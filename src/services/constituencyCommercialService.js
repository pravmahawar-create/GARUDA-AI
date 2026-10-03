/**
 * 🦅 GARUDA OS — CONSTITUENCY COMMERCIAL COMMAND SERVICE
 * Manages commercial packages, multi-currency pricing, constituency territorial exclusivity,
 * server-side order lifecycle, cryptographic payment verification, activation, and founder notifications.
 *
 * STRICT SECURITY & ANTI-FABRICATION INVARIANTS:
 * 1. Never trust client-supplied prices, currencies, or payment status.
 * 2. Server-side verification with HMAC-SHA256 signature checks.
 * 3. Formal 4-state lifecycle: CREATED -> PENDING -> VERIFIED -> ACTIVATED.
 * 4. Failure paths (FAILED, CANCELLED, EXPIRED, REFUNDED) strictly forbid active paid access.
 * 5. Single-seat territorial exclusivity enforced with atomic reservations and race-condition locks.
 * 6. Test mode strictly forbidden in production (NODE_ENV=production or RAZORPAY_LIVE_ENABLED=true).
 * 7. Payment ID replay attack protection (no reused transaction IDs across orders).
 * 8. Explicit distinction: LOCAL_TEST_SIMULATION vs REAL_PRODUCTION.
 */

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

let telegramBotService = null;
try {
  telegramBotService = require("./telegramBotService");
} catch (_) {}

// Dynamic Commercial Packages (No exaggerated or manipulative claims)
const COMMERCIAL_PLANS = {
  "garuda-intel": {
    id: "garuda-intel",
    name: "GARUDA INTELLIGENCE",
    tier: "Constituency Intelligence & Reporting",
    badge: "ESSENTIAL INTELLIGENCE",
    description: "Weekly structured intelligence dossiers, local issue radar, ECI booth data analysis, and emerging narrative monitoring.",
    priceINR: 149000, // Rs. 1,49,000 / month
    billingCycle: "Monthly Campaign Retainer",
    features: [
      "Weekly High-Resolution Constituency Intelligence Dossier",
      "Local Civic Issue Radar (24x7 monitoring across 12 categories)",
      "ECI Booth Structure & Historical Margin Breakdown",
      "Public Narrative Alert Feed (Rumor & Allegation detection)",
      "Standard ECI Voter & Polling Station Telemetry",
      "Executive PDF & Mobile Web Access for Core Team"
    ],
    recommended: false
  },
  "garuda-command": {
    id: "garuda-command",
    name: "GARUDA COMMAND",
    tier: "Full War Room & Operational Telemetry",
    badge: "MOST POPULAR // COMBAT PROVEN",
    description: "Continuous 24x7 candidate war room, 15-minute rapid response rebuttal engine, booth-level telemetry, and turnout logistics coordination.",
    priceINR: 349000, // Rs. 3,49,000 / month
    billingCycle: "Monthly Campaign Retainer",
    features: [
      "Everything in GARUDA Intelligence, PLUS:",
      "24x7 Live Candidate War Room Telemetry Dashboard",
      "15-Minute Rapid Response Rebuttal Engine (AI video + fact-check suite)",
      "Booth-Level Turnout Variance & Vulnerability Mapping",
      "Hyper-Local Demographic Information Synthesis (IT / Senior / Youth clusters)",
      "Election Day Booth Turnout Information Architecture & Logistics Coordination",
      "Dedicated Technical Campaign Manager Support"
    ],
    recommended: true
  },
  "garuda-enterprise": {
    id: "garuda-enterprise",
    name: "GARUDA ENTERPRISE",
    tier: "Multi-Constituency / Party Sovereign Cluster",
    badge: "MISSION CRITICAL // SOVEREIGN",
    description: "For political parties, multi-constituency battlegrounds, state leadership, custom AI models, and isolated sovereign infrastructure.",
    priceINR: 899000, // Rs. 8,99,000 / month
    billingCycle: "Custom Campaign Retainer",
    features: [
      "Everything in GARUDA Command across multiple constituencies",
      "Custom Private Sovereign Cloud Deployment (Zero Third-Party Leaks)",
      "Candidate Voice & Likeness Verified Media Engine",
      "State-Level Cross-Constituency Narrative Sentiment Aggregation",
      "Dedicated 24x7 Ground Tactical Response Team",
      "On-Site War Room Setup & Founder Strategic Consultation"
    ],
    recommended: false
  },
  "garuda-flagship": {
    id: "garuda-flagship",
    name: "GARUDA SOVEREIGN FLAGSHIP",
    tier: "Full Campaign Lifecycle War Room & Field Cadre Grid",
    badge: "FLAGSHIP CAMPAIGN SUITE",
    description: "End-to-end sovereign campaign infrastructure: 24x7 War Room, Ground Cadre PWA Grid, 15-Min Rebuttal Engine, and Strict Territorial Exclusivity.",
    priceINR: 3500000, // Rs. 35,00,000 full campaign contract
    billingCycle: "Full Campaign Retainer (Milestones: 50% Onboarding / 30% Sprint / 20% D-Day)",
    milestones: {
      onboarding: "50% (₹17,50,000) upon contract signing & territory lock",
      operationalSprint: "30% (₹10,50,000) upon field PWA deployment & 15-min rebuttal setup",
      delivery: "20% (₹7,00,000) upon D-Day live monitoring & final audit handover"
    },
    clientAdSpendNotice: "Meta ad spend is billed directly by Meta to client account. Never commingled with GARUDA engineering fee.",
    features: [
      "Strict Single-Candidate Territorial Exclusivity (Absolute Lock)",
      "Ground Cadre PWA Grid with Anti-Replay Heartbeat Architecture",
      "24x7 Live Candidate War Room Telemetry & Executive Visual Command",
      "15-Minute Rapid Response Rebuttal Engine (Fact-checked asset pipeline)",
      "High-Resolution Constituency Intelligence Dossier with SHA-256 Checksums",
      "Dedicated Technical Campaign Architect & On-Call Engineering Squad",
      "Client Meta Ad Account Direct Push (Separate Client Direct Budget)",
      "Zero Voter Profiling & Zero GOTV Manipulation Legal Compliance"
    ],
    recommended: true
  }
};

// Exchange rates benchmark against INR
const CURRENCY_RATES = {
  INR: { code: "INR", symbol: "₹", rate: 1.0, isZeroDecimal: false },
  USD: { code: "USD", symbol: "$", rate: 0.012, isZeroDecimal: false },
  AED: { code: "AED", symbol: "AED ", rate: 0.044, isZeroDecimal: false },
  GBP: { code: "GBP", symbol: "£", rate: 0.0095, isZeroDecimal: false },
  EUR: { code: "EUR", symbol: "€", rate: 0.011, isZeroDecimal: false }
};

// Formal State Machine
const ORDER_STATUSES = {
  CREATED: "CREATED",
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  ACTIVATED: "ACTIVATED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  REFUNDED: "REFUNDED"
};

// In-Memory Order, Exclusivity, and Replay Protection Stores
const ordersStore = new Map();
const exclusivityRegistry = new Map();
const usedPaymentIds = new Map();

// Pre-seed known pilot constituencies
exclusivityRegistry.set("thane-148", { status: "AVAILABLE", reservedBy: null, expiresAt: null });
exclusivityRegistry.set("indore-2", { status: "AVAILABLE", reservedBy: null, expiresAt: null });
exclusivityRegistry.set("noida-61", { status: "AVAILABLE", reservedBy: null, expiresAt: null });

class ConstituencyCommercialService {
  /**
   * Returns dynamic plans catalog localized to requested currency
   */
  getPlans(currencyCode = "INR") {
    const code = String(currencyCode || "INR").toUpperCase();
    if (!CURRENCY_RATES[code]) {
      throw new Error(`Unsupported or invalid currency: ${currencyCode}. Supported: ${Object.keys(CURRENCY_RATES).join(", ")}`);
    }
    const currency = CURRENCY_RATES[code];

    const localizedPlans = Object.values(COMMERCIAL_PLANS).map(plan => {
      const price = currency.code === "INR"
        ? plan.priceINR
        : Math.round(plan.priceINR * currency.rate);

      const formattedPrice = currency.code === "INR"
        ? `₹${price.toLocaleString("en-IN")}`
        : `${currency.symbol}${price.toLocaleString("en-US")}`;

      return {
        ...plan,
        currency: currency.code,
        price,
        formattedPrice
      };
    });

    return {
      success: true,
      currency: currency.code,
      availableCurrencies: Object.keys(CURRENCY_RATES),
      plans: localizedPlans
    };
  }

  /**
   * Check territorial exclusivity for a constituency
   */
  checkExclusivity(constituencyKey) {
    const key = String(constituencyKey || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "-");
    if (!key) {
      return {
        constituencyKey: "",
        status: "INVALID",
        message: "A valid constituency name or key is required."
      };
    }

    const existing = exclusivityRegistry.get(key);

    if (!existing) {
      return {
        constituencyKey: key,
        status: "AVAILABLE",
        message: "Constituency is available for territorial war-room exclusivity."
      };
    }

    if (existing.status === "ACTIVE") {
      return {
        constituencyKey: key,
        status: "ACTIVE",
        reservedBy: existing.reservedBy,
        message: "This constituency is currently locked by an active campaign under territorial exclusivity."
      };
    }

    if (existing.status === "RESERVED") {
      if (existing.expiresAt && Date.now() < existing.expiresAt) {
        return {
          constituencyKey: key,
          status: "RESERVED",
          reservedBy: existing.reservedBy,
          expiresAt: existing.expiresAt,
          message: "This constituency is reserved pending commercial completion."
        };
      } else {
        // Expired reservation cleanup
        exclusivityRegistry.set(key, { status: "AVAILABLE", reservedBy: null, expiresAt: null });
        return {
          constituencyKey: key,
          status: "AVAILABLE",
          message: "Constituency is open for immediate activation."
        };
      }
    }

    return {
      constituencyKey: key,
      status: "AVAILABLE",
      message: "Constituency is open for immediate activation."
    };
  }

  /**
   * Creates a secure server-side order with idempotency protection and price-tampering defense
   */
  createOrder({ constituency, planId, currency = "INR", billingCycle = "monthly", customerDetails = {}, amount: clientSuppliedAmount } = {}) {
    if (!constituency || (!constituency.id && !constituency.name && typeof constituency !== "string")) {
      throw new Error("A valid constituency object or identifier is required.");
    }
    if (!planId) {
      throw new Error("planId is required to create a commercial order.");
    }

    const plan = COMMERCIAL_PLANS[planId];
    if (!plan) {
      throw new Error(`Invalid plan specified: ${planId}. Available: ${Object.keys(COMMERCIAL_PLANS).join(", ")}`);
    }

    const currCode = String(currency || "INR").toUpperCase();
    if (!CURRENCY_RATES[currCode]) {
      throw new Error(`Invalid currency specified: ${currency}. Supported: ${Object.keys(CURRENCY_RATES).join(", ")}`);
    }
    const curr = CURRENCY_RATES[currCode];
    const serverCalculatedAmount = curr.code === "INR" ? plan.priceINR : Math.round(plan.priceINR * curr.rate);

    // PRICE TAMPERING DEFENSE:
    // If client explicitly passed an amount that differs from the server catalog price, reject immediately.
    if (clientSuppliedAmount !== undefined && clientSuppliedAmount !== null) {
      const numClient = Number(clientSuppliedAmount);
      if (numClient !== serverCalculatedAmount) {
        throw new Error(`Security Violation: Price tampering detected. Requested amount (${numClient}) does not match server catalog price (${serverCalculatedAmount}).`);
      }
    }

    // Check exclusivity
    const constituencyKey = String(constituency.id || constituency.name || constituency).toLowerCase().trim().replace(/[^a-z0-9]/g, "-");
    const exclusivity = this.checkExclusivity(constituencyKey);

    if (exclusivity.status === "ACTIVE") {
      throw new Error(`Constituency "${constituencyKey}" is already locked under territorial exclusivity.`);
    }

    // Idempotency: Check if an identical active pending order was created in last 5 minutes by the same principal
    const idempotencyKey = `${constituencyKey}_${planId}_${customerDetails.email || customerDetails.phone || "guest"}`;
    for (const [id, ord] of ordersStore.entries()) {
      if (ord.idempotencyKey === idempotencyKey && ord.status === ORDER_STATUSES.CREATED && (Date.now() - ord.createdAt < 300000)) {
        return ord;
      }
    }

    // EXCLUSIVITY RACE-CONDITION DEFENSE:
    // If another customer has an active, unexpired RESERVED checkout session on this constituency, reject.
    if (exclusivity.status === "RESERVED" && exclusivity.expiresAt && Date.now() < exclusivity.expiresAt) {
      throw new Error(`Constituency "${constituencyKey}" is currently reserved by a pending checkout session. Please try again after expiry or select another constituency.`);
    }

    const orderId = `ORD-WARROOM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const order = {
      orderId,
      idempotencyKey,
      constituency: {
        id: constituency.id || constituencyKey,
        name: constituency.name || constituency,
        district: constituency.district || "Regional District",
        state: constituency.state || "India"
      },
      plan: {
        id: plan.id,
        name: plan.name,
        tier: plan.tier
      },
      amount: serverCalculatedAmount,
      currency: curr.code,
      billingCycle,
      customerDetails: {
        name: customerDetails.name || "Campaign Principal",
        phone: customerDetails.phone || "",
        email: customerDetails.email || "",
        party: customerDetails.party || "Independent"
      },
      status: ORDER_STATUSES.CREATED,
      createdAt: Date.now(),
      paymentProvider: "RAZORPAY_SOVEREIGN",
      paymentMode: "PENDING_VERIFICATION",
      isProductionRevenue: false,
      isActivated: false,
      activationToken: crypto.randomBytes(16).toString("hex")
    };

    ordersStore.set(orderId, order);

    // Reserve constituency for 30 minutes
    exclusivityRegistry.set(constituencyKey, {
      status: "RESERVED",
      reservedBy: orderId,
      expiresAt: Date.now() + 1800000 // 30 minutes
    });

    return order;
  }

  /**
   * Server-Side Payment Verification (Cryptographic Signature Verification & State Machine Transition)
   */
  verifyAndActivatePayment({ orderId, paymentId, signature, provider = "RAZORPAY_SOVEREIGN", testMode = false } = {}) {
    if (!orderId) {
      throw new Error("orderId is required for payment verification.");
    }

    const order = ordersStore.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Idempotent return if already activated
    if (order.status === ORDER_STATUSES.ACTIVATED) {
      return { success: true, activated: true, order, alreadyActive: true };
    }

    // Enforce valid source state: Must be CREATED or PENDING
    if (order.status !== ORDER_STATUSES.CREATED && order.status !== ORDER_STATUSES.PENDING) {
      throw new Error(`Order cannot be activated from current status: ${order.status}`);
    }

    // PRODUCTION TEST MODE BAN:
    // In production environments, client-initiated testMode is strictly prohibited.
    const isProduction = process.env.NODE_ENV === "production" || String(process.env.RAZORPAY_LIVE_ENABLED || "").toLowerCase() === "true";
    if (isProduction && testMode) {
      order.status = ORDER_STATUSES.FAILED;
      order.failureReason = "Test mode payment simulation is strictly prohibited in production.";
      throw new Error("Security Violation: Test mode payment simulation is strictly prohibited in production.");
    }

    // REPLAY ATTACK DEFENSE: Reused paymentId check
    if (paymentId && usedPaymentIds.has(paymentId)) {
      const prev = usedPaymentIds.get(paymentId);
      if (prev.orderId !== orderId) {
        order.status = ORDER_STATUSES.FAILED;
        order.failureReason = `Payment ID "${paymentId}" was already utilized by order "${prev.orderId}".`;
        throw new Error(`Security Violation: Reused payment ID "${paymentId}". Replay attack blocked.`);
      }
    }

    // Transition to PENDING before verification
    order.status = ORDER_STATUSES.PENDING;

    // Cryptographic Signature Verification
    let isSignatureValid = false;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET_TEST || "garuda_warroom_secret_key_2026";

    if (testMode || process.env.NODE_ENV === "test") {
      // In controlled test mode or mock environments
      isSignatureValid = Boolean(paymentId && orderId);
    } else if (signature && paymentId) {
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      try {
        isSignatureValid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
      } catch {
        isSignatureValid = (expected === signature);
      }
    }

    if (!isSignatureValid) {
      order.status = ORDER_STATUSES.FAILED;
      order.failureReason = "Cryptographic signature verification failed.";
      throw new Error("Invalid payment signature. Payment cannot be verified.");
    }

    // Transition to VERIFIED
    order.status = ORDER_STATUSES.VERIFIED;

    // ATOMIC EXCLUSIVITY LOCK:
    // Verify that the constituency has not been locked by a competing order before activating.
    const cKey = order.constituency.id;
    const existingLock = exclusivityRegistry.get(cKey);
    if (existingLock && existingLock.status === "ACTIVE" && existingLock.reservedBy !== orderId) {
      order.status = ORDER_STATUSES.FAILED;
      order.failureReason = `Territorial exclusivity conflict: Constituency already locked by order ${existingLock.reservedBy}.`;
      throw new Error(`Territorial Exclusivity Violation: Constituency has already been locked by a competing order (${existingLock.reservedBy}). Activation rejected.`);
    }

    const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const activatedAt = Date.now();

    // Final State: ACTIVATED
    order.status = ORDER_STATUSES.ACTIVATED;
    order.isActivated = true;
    order.paymentId = paymentId || `pay_mock_${crypto.randomBytes(4).toString("hex")}`;
    order.transactionId = transactionId;
    order.activatedAt = activatedAt;
    order.invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Explicit payment mode differentiation
    if (testMode) {
      order.paymentMode = "LOCAL_TEST_SIMULATION";
      order.isProductionRevenue = false;
      order.notes = "Simulated local test transaction. Zero actual money moved.";
    } else {
      order.paymentMode = isProduction ? "REAL_PRODUCTION" : "SANDBOX_VERIFIED";
      order.isProductionRevenue = isProduction;
      order.notes = "Cryptographically verified gateway transaction.";
    }

    // Record used payment ID for replay defense
    if (paymentId) {
      usedPaymentIds.set(paymentId, { orderId, timestamp: activatedAt });
    }

    // Lock constituency under ACTIVE exclusivity
    exclusivityRegistry.set(cKey, {
      status: "ACTIVE",
      reservedBy: orderId,
      lockedAt: activatedAt
    });

    // Send Founder Telegram Alert
    this.sendFounderCommercialNotification(order);

    return {
      success: true,
      activated: true,
      order: {
        orderId: order.orderId,
        transactionId: order.transactionId,
        invoiceNumber: order.invoiceNumber,
        status: order.status,
        paymentMode: order.paymentMode,
        isProductionRevenue: order.isProductionRevenue,
        plan: order.plan,
        constituency: order.constituency,
        amount: order.amount,
        currency: order.currency,
        activatedAt: new Date(order.activatedAt).toISOString(),
        customer: order.customerDetails
      }
    };
  }

  /**
   * Safely refunds and revokes an activated order, releasing exclusivity
   */
  handleRefund({ orderId, paymentId, reason = "Customer requested refund" } = {}) {
    let order = null;
    if (orderId) {
      order = ordersStore.get(orderId);
    } else if (paymentId) {
      for (const [id, ord] of ordersStore.entries()) {
        if (ord.paymentId === paymentId) {
          order = ord;
          break;
        }
      }
    }

    if (!order) {
      throw new Error(`Cannot process refund: Order not found (orderId: ${orderId}, paymentId: ${paymentId})`);
    }

    if (order.status !== ORDER_STATUSES.ACTIVATED) {
      throw new Error(`Cannot refund order in status "${order.status}". Only ACTIVATED orders can be refunded.`);
    }

    order.status = ORDER_STATUSES.REFUNDED;
    order.isActivated = false;
    order.refundedAt = Date.now();
    order.refundReason = reason;

    // Release territorial exclusivity
    const cKey = order.constituency.id;
    const currentLock = exclusivityRegistry.get(cKey);
    if (currentLock && currentLock.reservedBy === order.orderId) {
      exclusivityRegistry.set(cKey, { status: "AVAILABLE", reservedBy: null, expiresAt: null });
    }

    return {
      success: true,
      refunded: true,
      orderId: order.orderId,
      status: ORDER_STATUSES.REFUNDED,
      exclusivityReleased: true
    };
  }

  /**
   * Retrieves order by ID
   */
  getOrder(orderId) {
    return ordersStore.get(orderId) || null;
  }

  /**
   * Checks whether an order holds active paid access
   */
  isOrderActive(orderId) {
    const order = this.getOrder(orderId);
    return Boolean(order && order.status === ORDER_STATUSES.ACTIVATED && order.isActivated === true);
  }

  /**
   * Generates Tax Invoice Data (Strictly requires ACTIVATED status)
   */
  generateInvoice(orderId) {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    if (order.status !== ORDER_STATUSES.ACTIVATED) {
      throw new Error(`Valid ACTIVATED paid order required to generate invoice. Current status: ${order.status}`);
    }

    const taxRate = order.currency === "INR" ? 0.18 : 0.0;
    const baseAmount = Math.round(order.amount / (1 + taxRate));
    const taxAmount = order.amount - baseAmount;

    return {
      invoiceNumber: order.invoiceNumber,
      date: new Date(order.activatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
      orderId: order.orderId,
      transactionId: order.transactionId,
      paymentMode: order.paymentMode,
      isProductionRevenue: order.isProductionRevenue,
      client: order.customerDetails,
      constituency: order.constituency,
      plan: order.plan,
      currency: order.currency,
      subtotal: baseAmount,
      tax: taxAmount,
      total: order.amount,
      paymentMethod: order.paymentMode === "LOCAL_TEST_SIMULATION" ? "Simulated Test Authorization (Zero Money Moved)" : "Electronic Wire / Razorpay Gateway",
      provider: "GARUDA AI Operating System Private Limited",
      supportContact: "praveen@garudaos.in",
      portalUrl: "https://www.garudaos.in"
    };
  }

  /**
   * Sends structured internal alert to Founder Praveen
   */
  async sendFounderCommercialNotification(order) {
    const alertMessage =
      `🦅 GARUDA COMMERCIAL ACTIVATION\n\n` +
      `👤 Customer: ${order.customerDetails.name} (${order.customerDetails.phone || order.customerDetails.email || "Confidential"})\n` +
      `🏛 Constituency: ${order.constituency.name} (${order.constituency.state})\n` +
      `📦 Plan: ${order.plan.name} (${order.plan.tier})\n` +
      `💰 Amount: ${order.currency} ${order.amount.toLocaleString()}\n` +
      `Mode: ${order.paymentMode}\n` +
      `🆔 Order ID: ${order.orderId}\n` +
      `⚡ Transaction ID: ${order.transactionId}\n` +
      `🧾 Invoice: ${order.invoiceNumber}\n` +
      `🕒 Activated: ${new Date(order.activatedAt).toLocaleString("en-IN")}\n` +
      `🔒 Exclusivity: ACTIVE LOCKED\n\n` +
      `[Sovereign Ground Activation Triggered]`;

    try {
      if (telegramBotService && typeof telegramBotService.sendFounderAlert === "function") {
        await telegramBotService.sendFounderAlert(alertMessage);
      }
    } catch (err) {
      console.warn("[ConstituencyCommercial] Failed to dispatch telegram notification:", err.message);
    }
  }
}

const constituencyCommercialService = new ConstituencyCommercialService();
module.exports = {
  constituencyCommercialService,
  ConstituencyCommercialService,
  ORDER_STATUSES,
  COMMERCIAL_PLANS,
  CURRENCY_RATES
};
