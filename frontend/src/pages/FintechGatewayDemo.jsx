import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";

const palette = {
  canvas: "#F6F4EE",
  canvasIvory: "#FAF9F6",
  card: "#FFFFFF",
  text: "#17181B",
  textBody: "#292B30",
  muted: "#525866",
  subtle: "#8A8D95",
  gold: "#B38235",
  goldPrimary: "#C48B28",
  goldDeep: "#9E6D1C",
  goldLight: "#F5D76E",
  goldGradient: "linear-gradient(135deg, #C48B28 0%, #9E6D1C 100%)",
  goldGlow: "rgba(196, 139, 40, 0.15)",
  border: "rgba(23, 24, 27, 0.08)",
  borderGold: "rgba(179, 130, 53, 0.35)",
  green: "#15803d",
  greenBg: "rgba(22, 163, 74, 0.08)",
  red: "#b91c1c",
  redBg: "rgba(185, 28, 28, 0.08)"
};

const RAILS = [
  {
    id: "us",
    name: "USA (Fedwire / ACH)",
    flag: "🇺🇸",
    clearingBank: "JPMorgan Chase US",
    currency: "USD",
    railFee: 15,
    railLatency: "15 - 45 Mins",
    vanPrefix: "US-FED-"
  },
  {
    id: "uk",
    name: "UK (Faster Payments)",
    flag: "🇬🇧",
    clearingBank: "Modulr / Bank of England",
    currency: "GBP",
    railFee: 1,
    railLatency: "15 Seconds",
    vanPrefix: "UK-FPS-"
  },
  {
    id: "eu",
    name: "Europe (SEPA Instant)",
    flag: "🇪🇺",
    clearingBank: "Modulr / Central Bank of Ireland",
    currency: "EUR",
    railFee: 1.5,
    railLatency: "5 Seconds",
    vanPrefix: "EU-SEPA-"
  },
  {
    id: "uae",
    name: "UAE & GCC (IPI / Aani)",
    flag: "🇦🇪",
    clearingBank: "Wio Bank PJSC (Abu Dhabi/Dubai)",
    currency: "AED",
    railFee: 0.5,
    railLatency: "10 Seconds",
    vanPrefix: "AE-IPI-"
  },
  {
    id: "in",
    name: "India (RTGS / Auto-eFIRC)",
    flag: "🇮🇳",
    clearingBank: "ICICI Bank Corporate Stack",
    currency: "INR",
    railFee: 0.2,
    railLatency: "Instant",
    vanPrefix: "IN-RTGS-"
  }
];

const TICKET_PRESETS = [
  { label: "$5,000", value: 5000, desc: "Hotel / Token Booking", inr: "₹4.25 Lakh" },
  { label: "$50,000", value: 50000, desc: "Luxury Villa Advance", inr: "₹42.5 Lakh" },
  { label: "$500,000", value: 500000, desc: "Commercial Real Estate", inr: "₹4.25 Crore" },
  { label: "$2,000,000", value: 2000000, desc: "Institutional / M&A Escrow", inr: "₹17 Crore" }
];

const ARCHITECTURE_NODES = [
  {
    id: "buyer",
    title: "1. Buyer / Institutional Client",
    category: "COMMERCIAL CLIENT",
    icon: "👤",
    summary: "Initiates purchase instruction via enterprise checkout or B2B treasury invoice.",
    detail: "Buyer sends funds from their commercial bank. Zero client funds touch GARUDA servers.",
    fileRef: "src/controllers/fintechController.js:createPayment"
  },
  {
    id: "rails",
    title: "2. Regulated Clearing Rails",
    category: "CENTRAL BANK / RAILS",
    icon: "⚡",
    summary: "Fedwire, UAE FTS, RBI RTGS, Bank of England Faster Payments.",
    detail: "Direct central bank interbank clearance. Direct credit to merchant corporate bank account.",
    fileRef: "src/fintech/adapters/PaymentProviderAdapter.js"
  },
  {
    id: "gateway",
    title: "3. GARUDA Fintech Gateway",
    category: "ORCHESTRATION LAYER",
    icon: "🦅",
    summary: "Sovereign software coordinator, telemetry dispatcher and status monitor.",
    detail: "Maintains zero custody ($0.00). Dispatches payment instructions and coordinates engines.",
    fileRef: "src/fintech/orchestrationService.js:FintechOrchestrationService"
  },
  {
    id: "state_machine",
    title: "4. State Machine (13 States)",
    category: "LOCKED CORE",
    icon: "🔒",
    summary: "Deterministic transition graph with cryptographic SHA-256 state hashes.",
    detail: "Enforces strict forward transitions. Completely blocks unverified client-side settlement.",
    fileRef: "src/fintech/stateMachine.js:recordTransition"
  },
  {
    id: "webhook_security",
    title: "5. Webhook Security",
    category: "LOCKED CORE",
    icon: "🛡️",
    summary: "Constant-time HMAC-SHA256, 300-second freshness window, anti-replay nonce cache.",
    detail: "Timing-attack proof verification. Rejects expired, replayed, or altered payloads with 401/409.",
    fileRef: "src/fintech/webhookSecurity.js:verifyWebhook"
  },
  {
    id: "reconciliation",
    title: "6. Reconciliation Engine",
    category: "LOCKED CORE",
    icon: "⚖️",
    summary: "8-point automated matching matrix with instant quarantine into MANUAL_REVIEW.",
    detail: "Partial, overpayment, duplicate, currency mismatch auto-quarantined. Zero silent failures.",
    fileRef: "src/fintech/reconciliationEngine.js:reconcile"
  },
  {
    id: "merchant_account",
    title: "7. Merchant Corporate Account",
    category: "COMMERCIAL BENEFICIARY",
    icon: "🏦",
    summary: "Sole legal beneficiary & statutory Merchant of Record with verified corporate bank.",
    detail: "Receives 100% gross principal directly from clearing rail. Full liquidity retained.",
    fileRef: "src/fintech/zeroCustodyEnforcer.js:assertZeroCustody"
  }
];

const LIFECYCLE_STEPS = [
  {
    num: "01",
    title: "Payment Initiated",
    desc: "Merchant or buyer creates payment intent with commercial parameters, destination IBAN, and idempotency key.",
    codeRef: "orchestrationService.js:createPaymentIntent",
    invariant: "Zero-Custody Check passes; Risk Engine evaluates sanctions."
  },
  {
    num: "02",
    title: "Provider Routing & VAN",
    desc: "Provider adapter provisions a dedicated Virtual Account Number (VAN) or Virtual IBAN mapped to the merchant.",
    codeRef: "PaymentProviderAdapter.js:createVirtualAccount",
    invariant: "Virtual account identifier issued directly under partner bank clearing umbrella."
  },
  {
    num: "03",
    title: "Direct Interbank Clearing",
    desc: "Buyer dispatches payment directly via central clearing (Fedwire, UAE FTS, RTGS, Faster Payments).",
    codeRef: "Interbank Network (External)",
    invariant: "100% of customer principal clears directly to merchant corporate bank. GARUDA custody = $0.00."
  },
  {
    num: "04",
    title: "Secure Webhook Ingestion",
    desc: "Regulated bank posts settlement telemetry to GARUDA. HMAC signature, timestamp freshness, and nonce are verified.",
    codeRef: "webhookSecurity.js:verifyWebhook",
    invariant: "Payload tampering and replay attacks physically blocked with 401/409."
  },
  {
    num: "05",
    title: "State Machine Validation",
    desc: "State machine verifies the transition against the 13-state DAG. Validates provider evidence before advancing.",
    codeRef: "stateMachine.js:validateTransition",
    invariant: "Client-side bypass blocked: Only verified bank telemetry permits transition to SETTLED."
  },
  {
    num: "06",
    title: "Deterministic Reconciliation",
    desc: "Reconciliation engine compares amount, currency, reference, and VAN expiry across 8 verification criteria.",
    codeRef: "reconciliationEngine.js:reconcile",
    invariant: "Exact match -> SETTLED. Any variance or duplicate -> AUTO-QUARANTINE in MANUAL_REVIEW."
  },
  {
    num: "07",
    title: "Audit Trail & Metered SaaS",
    desc: "Immutable SHA-256 block sealed in audit chain. Software fee (0.15%) deducted from merchant's prepaid Fuel Tank.",
    codeRef: "auditLogger.js & fuelTankService.js",
    invariant: "Zero deduction from customer settlement wire. Tamper-evident ledger record permanent."
  }
];

const ENGINES = [
  {
    name: "STATE MACHINE",
    file: "src/fintech/stateMachine.js",
    badge: "13 DETERMINISTIC STATES",
    what: "Controls transaction progression along a mathematical Directed Acyclic Graph (DAG) and generates a SHA-256 hash for every transition.",
    why: "Prevents race conditions, out-of-order execution, and unauthorized client-side state manipulation.",
    protects: "Lifecycle integrity — guarantees no transaction can reach SETTLED without cryptographic bank proof."
  },
  {
    name: "ZERO-CUSTODY ENFORCER",
    file: "src/fintech/zeroCustodyEnforcer.js",
    badge: "CONSTITUTIONAL INVARIANT",
    what: "Inspects account configurations and ledger mutations to reject forbidden constructs (CUSTOMER_WALLET, POOLED_ESCROW, OMNIBUS).",
    why: "Ensures GARUDA never acts as an escrow agent, deposit-taker, or funds transmitter under any circumstance.",
    protects: "Regulatory demarcation — guarantees customer principal remains strictly between regulated bank and merchant."
  },
  {
    name: "WEBHOOK SECURITY",
    file: "src/fintech/webhookSecurity.js",
    badge: "HMAC-SHA256 & ANTI-REPLAY",
    what: "Verifies provider webhook payloads using timingSafeEqual, enforces 300s timestamp freshness, and caches nonces in memory.",
    why: "Prevents webhook forgery, man-in-the-middle tampering, clock skew exploits, and duplicate transaction processing.",
    protects: "Ingestion perimeter — ensures only authentic bank messages trigger downstream orchestration."
  },
  {
    name: "RECONCILIATION ENGINE",
    file: "src/fintech/reconciliationEngine.js",
    badge: "DETERMINISTIC 8-CHECK MATRIX",
    what: "Verifies incoming settlement against payment intents across 8 criteria (amount, currency, reference, expiry, duplicates).",
    why: "Eliminates silent financial discrepancies, partial wire confusion, and overpayment misallocation.",
    protects: "Accounting truth — automatically quarantines ambiguous or contested wires into MANUAL_REVIEW."
  },
  {
    name: "FORENSIC AUDIT LOGGER",
    file: "src/fintech/auditLogger.js",
    badge: "SHA-256 HASH-CHAINED",
    what: "Appends every financial action into a tamper-evident blockchain-style ledger linked from genesis hash to tip.",
    why: "Provides mathematical, non-repudiable proof of every lifecycle event for institutional audits and compliance scrutiny.",
    protects: "Institutional auditability — any in-memory or storage alteration immediately throws AuditTamperingError."
  },
  {
    name: "FUEL TANK SERVICE",
    file: "src/fintech/fuelTankService.js",
    badge: "RING-FENCED SAAS METERING",
    what: "Maintains a prepaid software licensing credit balance per merchant, deducting metered technology maintenance fees (0.15%).",
    why: "Allows GARUDA to monetize software value without taking percentage cuts from customer settlement wires directly.",
    protects: "Zero-custody invariant — keeps software revenue strictly segregated from customer transaction principal."
  }
];

const PROVIDERS = [
  {
    name: "Mock Interbank Simulator",
    rail: "Local Loopback & In-Memory Test Harness",
    status: "OPERATIONAL",
    statusColor: "#22c55e",
    statusBadge: "🟢 OPERATIONAL",
    env: "Local CI/CD Simulation",
    capabilities: "10/10 Capabilities Implemented",
    details: "Continuous integration simulator. Verified across 81/81 automated tests with 0ms network latency.",
    gate: "Built-in / Zero External Keys Required"
  },
  {
    name: "Wio Bank PJSC (UAE)",
    rail: "UAE FTS • Aani (IPI) • SWIFT Inward",
    status: "CREDENTIALS REQUIRED",
    statusColor: "#eab308",
    statusBadge: "🟡 SANDBOX / CREDENTIALS REQUIRED",
    env: "UAE Corporate BaaS Sandbox Gate",
    capabilities: "10/10 Capabilities Implemented",
    details: "Full adapter implemented with x-wio-signature verification. Awaiting formal partner API credentials.",
    gate: "Requires WIO_SANDBOX_API_KEY + MERCHANT_ID"
  },
  {
    name: "ICICI Bank Corporate Stack",
    rail: "RBI RTGS • NEFT • IMPS • Auto-eFIRC",
    status: "CREDENTIALS REQUIRED",
    statusColor: "#eab308",
    statusBadge: "🟡 SANDBOX / CREDENTIALS REQUIRED",
    env: "India Corporate API Banking Gate",
    capabilities: "10/10 Capabilities Implemented",
    details: "Full adapter implemented with Auto-eFIRC ingestion telemetry. Awaiting corporate CIB PKI certificates.",
    gate: "Requires ICICI_SANDBOX_CORP_ID + CLIENT_CERT"
  },
  {
    name: "Modulr Finance UK/EU",
    rail: "Bank of England FPS • CHAPS • SEPA Instant",
    status: "CREDENTIALS REQUIRED",
    statusColor: "#eab308",
    statusBadge: "🟡 SANDBOX / CREDENTIALS REQUIRED",
    env: "FCA Authorised EMI Sandbox Gate",
    capabilities: "10/10 Capabilities Implemented",
    details: "Full adapter implemented with Sort Code (04-00-04) and SEPA IBAN schemas. Awaiting client API keys.",
    gate: "Requires MODULR_SANDBOX_API_KEY + HMAC_SECRET"
  }
];

const SECURITY_CONTROLS = [
  { title: "Zero-Custody Architecture", desc: "Customer principal balances strictly $0.00 at all times.", tag: "CONSTITUTIONAL" },
  { title: "HMAC-SHA256 Verification", desc: "Constant-time signature verification prevents timing attacks.", tag: "CRYPTOGRAPHIC" },
  { title: "300s Anti-Replay Window", desc: "Rejects webhook timestamps older or newer than 300 seconds.", tag: "TEMPORAL" },
  { title: "Nonce Cache (TTL)", desc: "In-memory delivery deduplication blocks duplicate webhook replays.", tag: "IDEMPOTENCY" },
  { title: "Idempotent Creation", desc: "Deterministic idempotencyKey prevents duplicate payment intents.", tag: "SAFETY" },
  { title: "Deterministic Recon", desc: "Exact amount match or automated quarantine into MANUAL_REVIEW.", tag: "ACCOUNTING" },
  { title: "SHA-256 Audit Chain", desc: "Genesis-to-tip hash chaining exposes any historical record tampering.", tag: "EVIDENTIARY" },
  { title: "Manual Review Quarantine", desc: "Contested, partial, or late payments cannot bypass into SETTLED.", tag: "GOVERNANCE" }
];

export default function FintechGatewayDemo() {
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState(500000);
  const [selectedRail, setSelectedRail] = useState(RAILS[0]);
  const [merchantBank, setMerchantBank] = useState("Wio Bank Dubai (Master Corporate)");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simComplete, setSimComplete] = useState(false);
  const [activeNode, setActiveNode] = useState(ARCHITECTURE_NODES[2]); // Default: Gateway
  const [activeLifecycleStep, setActiveLifecycleStep] = useState(0);

  React.useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = palette.canvas;
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, []);

  // Financial calculations
  const grossAmountUSD = selectedTicket;
  const grossAmountINR = grossAmountUSD * 85;

  const traditionalRate = 0.025; // 2.50%
  const traditionalFeeUSD = grossAmountUSD * traditionalRate;
  const traditionalNetUSD = grossAmountUSD - traditionalFeeUSD;

  const garudaRate = 0.0015; // 0.15% (15 basis points)
  const garudaSoftwareFeeUSD = grossAmountUSD * garudaRate;
  const interbankRailFeeUSD = selectedRail.railFee;
  const garudaTotalFeeUSD = garudaSoftwareFeeUSD + interbankRailFeeUSD;
  const garudaNetUSD = grossAmountUSD - garudaTotalFeeUSD;

  const totalSavedUSD = traditionalFeeUSD - garudaTotalFeeUSD;
  const totalSavedINR = totalSavedUSD * 85;

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimStep(1);
    setSimComplete(false);

    setTimeout(() => { setSimStep(2); }, 450);
    setTimeout(() => { setSimStep(3); }, 900);
    setTimeout(() => { setSimStep(4); }, 1350);
    setTimeout(() => { setSimStep(5); }, 1800);
    setTimeout(() => {
      setSimStep(6);
      setIsSimulating(false);
      setSimComplete(true);
    }, 2250);
  };

  return (
    <div style={{ background: palette.canvas, minHeight: "100vh", color: palette.text, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <SEOHead
        title="Fintech Gateway • Payment Orchestration & Treasury | GARUDA OS"
        description="Sovereign payment orchestration and treasury infrastructure. Zero-custody architecture, multi-rail direct bank clearance, deterministic reconciliation, and cryptographic audit chains."
      />

      {/* Scoped Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
        }
        .garuda-tier-card {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .garuda-tier-card:hover {
          transform: translateY(-4px);
        }
        @media (prefers-reduced-motion: reduce) {
          .garuda-tier-card {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Top Sovereign Navigation */}
      <header style={{
        padding: "1rem clamp(1.25rem, 4vw, 4rem)",
        borderBottom: `1px solid ${palette.border}`,
        background: "rgba(246, 244, 238, 0.94)",
        backdropFilter: "blur(16px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: 0
            }}
          >
            <BrandAssetImage
              src="/images/garuda_eagle_sigil.png"
              alt="GARUDA Logo"
              style={{ width: 32, height: 32, objectFit: "contain" }}
            />
            <div style={{ textAlign: "left", lineHeight: 1 }}>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1.2rem", letterSpacing: "0.04em", color: palette.text }}>
                GARUDA <span style={{ color: palette.goldDeep, fontStyle: "italic" }}>FINTECH</span>
              </span>
              <div style={{ fontSize: "0.62rem", color: palette.goldPrimary, letterSpacing: "0.22em", fontWeight: 700, marginTop: "2px" }}>
                UNIVERSE 12 • FINANCE
              </div>
            </div>
          </button>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "1.2rem" }} className="desktop-nav">
          <a href="#demo" style={{ color: palette.goldDeep, textDecoration: "none", fontSize: "0.82rem", fontWeight: 700, background: "rgba(196, 139, 40, 0.1)", padding: "0.35rem 0.85rem", borderRadius: 999, border: `1px solid ${palette.borderGold}` }}>⚡ Live Simulator</a>
          <a href="#architecture" style={{ color: palette.muted, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>Architecture</a>
          <a href="#how-it-works" style={{ color: palette.muted, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>Lifecycle</a>
          <a href="#engines" style={{ color: palette.muted, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>Core Engines</a>
          <a href="#providers" style={{ color: palette.muted, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>Providers</a>
          <a href="#verification" style={{ color: palette.muted, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>Verification</a>
          <a href="#pricing" style={{ color: palette.muted, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>Commercial Tiers</a>
          <button
            onClick={() => navigate("/chat?topic=fintech-gateway")}
            style={{
              background: palette.goldGradient,
              color: "#FFFFFF",
              border: "none",
              padding: "0.55rem 1.35rem",
              borderRadius: 999,
              fontSize: "0.84rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(179, 130, 53, 0.35)",
              transition: "transform 0.16s ease"
            }}
          >
            Request Pilot Briefing →
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: "clamp(4rem, 7vw, 6.5rem) clamp(1.25rem, 4vw, 4rem)",
        maxWidth: 1240,
        margin: "0 auto",
        textAlign: "center",
        position: "relative"
      }}>
        {/* Canonical Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.55rem",
          padding: "0.4rem 1rem",
          borderRadius: 999,
          border: `1px solid ${palette.borderGold}`,
          background: "rgba(196, 139, 40, 0.1)",
          color: palette.goldDeep,
          fontSize: "0.76rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          marginBottom: "1.5rem"
        }}>
          <span>✦</span>
          <span>CANONICAL UNIVERSE 12 • SOVEREIGN PAYMENT ORCHESTRATION</span>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(2.5rem, 5.5vw, 4.2rem)",
          fontWeight: 700,
          lineHeight: 1.12,
          margin: "0 0 1.2rem",
          color: palette.text
        }}>
          FINTECH GATEWAY
          <span style={{ display: "block", fontSize: "clamp(1.2rem, 2.5vw, 1.9rem)", fontWeight: 400, color: palette.goldDeep, marginTop: "0.6rem", fontStyle: "italic" }}>
            Payment Orchestration & Treasury Infrastructure
          </span>
        </h1>

        <p style={{
          fontSize: "clamp(1.05rem, 1.8vw, 1.2rem)",
          color: palette.muted,
          maxWidth: 860,
          margin: "0 auto 2.8rem",
          lineHeight: 1.65
        }}>
          Connect payment providers, banking rails and merchant treasury operations through a controlled orchestration layer. Direct interbank clearing, deterministic reconciliation, and immutable cryptographic audit trails — engineered with zero customer fund custody.
        </p>

        {/* 3 Pillar Enterprise Assurance */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.4rem",
          maxWidth: 1040,
          margin: "0 auto 3rem",
          textAlign: "left"
        }}>
          <div style={{
            background: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 16,
            padding: "1.6rem",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🛡️</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: palette.text, marginBottom: "0.35rem" }}>
              Zero-Custody Architecture
            </div>
            <div style={{ fontSize: "0.85rem", color: palette.muted, lineHeight: 1.55 }}>
              GARUDA never holds, pools, or touches customer principal funds. Principal clears directly into the merchant's corporate bank account via licensed banking rails.
            </div>
          </div>

          <div style={{
            background: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 16,
            padding: "1.6rem",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⚡</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: palette.text, marginBottom: "0.35rem" }}>
              Direct Rail Routing
            </div>
            <div style={{ fontSize: "0.85rem", color: palette.muted, lineHeight: 1.55 }}>
              Connects domestic and cross-border settlement rails (Fedwire, UAE FTS, RTGS, Faster Payments) with sub-minute clearance and auto-reconciliation.
            </div>
          </div>

          <div style={{
            background: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 16,
            padding: "1.6rem",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📜</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: palette.text, marginBottom: "0.35rem" }}>
              Cryptographic Audit Chain
            </div>
            <div style={{ fontSize: "0.85rem", color: palette.muted, lineHeight: 1.55 }}>
              Every state transition, webhook receipt, and reconciliation event is cryptographically sealed in an append-only SHA-256 hash-chained ledger.
            </div>
          </div>
        </div>

        {/* Quick CTA row */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="#demo"
            style={{
              background: palette.goldGradient,
              color: "#FFFFFF",
              textDecoration: "none",
              padding: "0.85rem 2rem",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: "0.95rem",
              boxShadow: "0 4px 16px rgba(179, 130, 53, 0.35)"
            }}
          >
            Launch Interactive Simulation ↓
          </a>
          <a
            href="#architecture"
            style={{
              background: palette.card,
              color: palette.text,
              border: `1px solid ${palette.border}`,
              textDecoration: "none",
              padding: "0.85rem 1.8rem",
              borderRadius: 999,
              fontWeight: 600,
              fontSize: "0.95rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
            }}
          >
            Inspect Architecture Topology
          </a>
        </div>
      </section>

      {/* PHASE 5: INTERACTIVE ARCHITECTURE VISUALIZATION */}
      <section id="architecture" style={{
        padding: "4rem clamp(1.25rem, 4vw, 4rem)",
        maxWidth: 1240,
        margin: "0 auto",
        borderTop: `1px solid ${palette.border}`
      }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ color: palette.goldDeep, letterSpacing: "0.14em", fontSize: "0.76rem", fontWeight: 700, margin: "0 0 0.5rem", textTransform: "uppercase" }}>
            ✦ SYSTEM TOPOLOGY
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.3rem", fontWeight: 700, color: palette.text, margin: 0 }}>
            Interactive Architecture Visualization
          </h2>
          <p style={{ color: palette.muted, fontSize: "0.95rem", maxWidth: 720, margin: "0.6rem auto 0" }}>
            Click any node below to inspect its exact operational role, code reference, and technical invariants.
          </p>
        </div>

        {/* Node Selection Ribbon */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "0.75rem",
          marginBottom: "2rem"
        }}>
          {ARCHITECTURE_NODES.map((node) => {
            const isSelected = activeNode.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setActiveNode(node)}
                style={{
                  background: isSelected ? "rgba(196, 139, 40, 0.1)" : palette.card,
                  border: isSelected ? `1.5px solid ${palette.goldPrimary}` : `1px solid ${palette.border}`,
                  borderRadius: 14,
                  padding: "0.9rem 0.75rem",
                  cursor: "pointer",
                  textAlign: "center",
                  boxShadow: isSelected ? "0 4px 16px rgba(196, 139, 40, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.16s ease"
                }}
              >
                <div style={{ fontSize: "1.4rem", marginBottom: "0.3rem" }}>{node.icon}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: isSelected ? palette.goldDeep : palette.text, lineHeight: 1.2 }}>
                  {node.title.split(". ")[1]}
                </div>
                <div style={{ fontSize: "0.64rem", color: isSelected ? palette.goldPrimary : palette.subtle, marginTop: "4px", textTransform: "uppercase", fontWeight: 600 }}>
                  {node.category}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Node Detailed Inspection Card */}
        <div style={{
          background: palette.card,
          border: `1.5px solid ${palette.borderGold}`,
          borderRadius: 20,
          padding: "2rem",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.06)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
          alignItems: "center"
        }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.72rem", color: palette.goldDeep, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
              <span>●</span> {activeNode.category}
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.8rem", margin: "0 0 0.8rem", color: palette.text }}>
              {activeNode.title}
            </h3>
            <p style={{ fontSize: "1rem", color: palette.textBody, lineHeight: 1.6, margin: "0 0 1rem" }}>
              {activeNode.summary}
            </p>
            <p style={{ fontSize: "0.88rem", color: palette.muted, lineHeight: 1.6, margin: 0 }}>
              {activeNode.detail}
            </p>
          </div>

          <div style={{
            background: "#FAF9F6",
            border: `1px solid ${palette.borderGold}`,
            borderRadius: 14,
            padding: "1.4rem",
            fontFamily: "ui-monospace, monospace"
          }}>
            <div style={{ fontSize: "0.72rem", color: palette.goldDeep, textTransform: "uppercase", marginBottom: "0.6rem", fontWeight: 700 }}>
              VERIFIED IMPLEMENTATION REFERENCE
            </div>
            <div style={{ color: palette.text, fontSize: "0.88rem", fontWeight: 700, wordBreak: "break-all" }}>
              {activeNode.fileRef}
            </div>
            <div style={{ marginTop: "1rem", paddingTop: "0.8rem", borderTop: `1px solid ${palette.border}`, fontSize: "0.78rem", color: "#15803d", fontWeight: 600 }}>
              ✔ ZERO-CUSTODY INVARIANT: ENFORCED
            </div>
            <div style={{ fontSize: "0.74rem", color: palette.muted, marginTop: "4px" }}>
              No customer funds transit or reside on GARUDA ledgers.
            </div>
          </div>
        </div>
      </section>

      {/* PHASE 6: HOW IT WORKS — 7-STEP LIFECYCLE */}
      <section id="how-it-works" style={{
        padding: "4rem clamp(1.25rem, 4vw, 4rem)",
        maxWidth: 1240,
        margin: "0 auto",
        borderTop: `1px solid ${palette.border}`
      }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ color: palette.goldDeep, letterSpacing: "0.14em", fontSize: "0.76rem", fontWeight: 700, margin: "0 0 0.5rem", textTransform: "uppercase" }}>
            ✦ END-TO-END EXECUTION
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.3rem", fontWeight: 700, color: palette.text, margin: 0 }}>
            How It Works: The 7-Step Lifecycle
          </h2>
          <p style={{ color: palette.muted, fontSize: "0.95rem", maxWidth: 680, margin: "0.6rem auto 0" }}>
            From payment initiation to direct corporate bank settlement, mapped to verified codebase methods.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
          {LIFECYCLE_STEPS.map((s, idx) => (
            <div
              key={s.num}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                borderRadius: 16,
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)"
              }}
            >
              <div>
                <div style={{
                  fontSize: "1.4rem",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 900,
                  color: palette.goldDeep,
                  marginBottom: "0.4rem"
                }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: palette.text, margin: "0 0 0.6rem" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: "0.84rem", color: palette.muted, lineHeight: 1.55, margin: "0 0 1rem" }}>
                  {s.desc}
                </p>
              </div>

              <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: "0.8rem", fontSize: "0.74rem" }}>
                <div style={{ color: palette.subtle, fontFamily: "monospace" }}>{s.codeRef}</div>
                <div style={{ color: "#059669", marginTop: "4px", fontWeight: 600 }}>{s.invariant}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PHASE 7: REAL GARUDA ENGINE SHOWCASE (THE 6 ENGINES) */}
      <section id="engines" style={{
        padding: "4rem clamp(1.25rem, 4vw, 4rem)",
        maxWidth: 1240,
        margin: "0 auto",
        borderTop: `1px solid ${palette.border}`
      }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ color: palette.goldDeep, letterSpacing: "0.14em", fontSize: "0.76rem", fontWeight: 700, margin: "0 0 0.5rem", textTransform: "uppercase" }}>
            ✦ SOVEREIGN CORE INFRASTRUCTURE
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.3rem", fontWeight: 700, color: palette.text, margin: 0 }}>
            The Engines Behind GARUDA Fintech Gateway
          </h2>
          <p style={{ color: palette.muted, fontSize: "0.95rem", maxWidth: 720, margin: "0.6rem auto 0" }}>
            The 6 inviolable, permanently locked modules running inside the GARUDA kernel.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {ENGINES.map((e) => (
            <div
              key={e.name}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                borderRadius: 18,
                padding: "1.8rem",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: palette.text, margin: 0 }}>
                    {e.name}
                  </h3>
                  <span style={{ fontSize: "0.72rem", color: palette.goldDeep, fontFamily: "monospace", background: "rgba(23, 24, 27, 0.04)", padding: "0.15rem 0.45rem", borderRadius: 4, display: "inline-block", marginTop: "4px" }}>
                    {e.file}
                  </span>
                </div>
                <span style={{
                  background: "rgba(196, 139, 40, 0.12)",
                  color: palette.goldDeep,
                  border: `1px solid ${palette.borderGold}`,
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  padding: "0.2rem 0.55rem",
                  borderRadius: 999
                }}>
                  {e.badge}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", fontSize: "0.82rem", marginTop: "1rem" }}>
                <div>
                  <span style={{ color: palette.goldDeep, fontWeight: 700 }}>WHAT IT DOES: </span>
                  <span style={{ color: palette.textBody }}>{e.what}</span>
                </div>
                <div>
                  <span style={{ color: palette.goldDeep, fontWeight: 700 }}>WHY IT EXISTS: </span>
                  <span style={{ color: palette.textBody }}>{e.why}</span>
                </div>
                <div>
                  <span style={{ color: "#059669", fontWeight: 700 }}>WHAT IT PROTECTS: </span>
                  <span style={{ color: palette.text }}>{e.protects}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PHASE 8: PROVIDER ORCHESTRATION WITH TRUTHFUL STATUS */}
      <section id="providers" style={{
        padding: "4rem clamp(1.25rem, 4vw, 4rem)",
        maxWidth: 1240,
        margin: "0 auto",
        borderTop: `1px solid ${palette.border}`
      }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ color: palette.goldDeep, letterSpacing: "0.14em", fontSize: "0.76rem", fontWeight: 700, margin: "0 0 0.5rem", textTransform: "uppercase" }}>
            ✦ BANK RAIL ADAPTERS
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.3rem", fontWeight: 700, color: palette.text, margin: 0 }}>
            Provider Orchestration & Live Truth Matrix
          </h2>
          <p style={{ color: palette.muted, fontSize: "0.95rem", maxWidth: 720, margin: "0.6rem auto 0" }}>
            In strict compliance with GARUDA Anti-Fabrication Law, operational status reflects verified hardware reality.
          </p>

          {/* Status Legend Strip */}
          <div style={{ display: "flex", justifyContent: "center", gap: "1.2rem", marginTop: "1.2rem", flexWrap: "wrap", fontSize: "0.78rem" }}>
            <span style={{ color: "#15803d", fontWeight: 600 }}>🟢 OPERATIONAL (Mock Adapter)</span>
            <span style={{ color: "#b45309", fontWeight: 600 }}>🟡 SANDBOX / CREDENTIALS REQUIRED</span>
            <span style={{ color: "#0284c7", fontWeight: 600 }}>🔵 ADAPTER READY</span>
            <span style={{ color: "#b91c1c", fontWeight: 600 }}>🔴 LIVE NOT CONNECTED</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.4rem" }}>
          {PROVIDERS.map((p) => (
            <div
              key={p.name}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                borderRadius: 18,
                padding: "1.6rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.03)"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: palette.text, margin: 0 }}>
                    {p.name}
                  </h3>
                </div>
                <div style={{ fontSize: "0.78rem", color: palette.goldDeep, fontWeight: 700, marginBottom: "0.8rem" }}>
                  {p.rail}
                </div>
                <div style={{ fontSize: "0.82rem", color: palette.muted, lineHeight: 1.55, marginBottom: "1rem" }}>
                  {p.details}
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: "0.8rem", fontSize: "0.76rem" }}>
                <div style={{ color: p.statusColor, fontWeight: 700, marginBottom: "4px" }}>
                  {p.statusBadge}
                </div>
                <div style={{ color: palette.subtle }}>{p.gate}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PHASE 9: SECURITY & CONTROL */}
      <section style={{
        padding: "4rem clamp(1.25rem, 4vw, 4rem)",
        maxWidth: 1240,
        margin: "0 auto",
        borderTop: `1px solid ${palette.border}`
      }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ color: palette.goldDeep, letterSpacing: "0.14em", fontSize: "0.76rem", fontWeight: 700, margin: "0 0 0.5rem", textTransform: "uppercase" }}>
            ✦ ENTERPRISE GOVERNANCE
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.3rem", fontWeight: 700, color: palette.text, margin: 0 }}>
            Institutional Security & Control Perimeter
          </h2>
          <p style={{ color: palette.muted, fontSize: "0.95rem", maxWidth: 680, margin: "0.6rem auto 0" }}>
            Mathematical and architectural invariants protecting sovereign multi-rail payments.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem" }}>
          {SECURITY_CONTROLS.map((ctrl) => (
            <div
              key={ctrl.title}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                borderRadius: 14,
                padding: "1.4rem",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: palette.text }}>{ctrl.title}</span>
                <span style={{ fontSize: "0.65rem", background: "rgba(196, 139, 40, 0.1)", color: palette.goldDeep, padding: "0.15rem 0.5rem", borderRadius: 4, fontWeight: 700 }}>
                  {ctrl.tag}
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: palette.muted, lineHeight: 1.5, margin: 0 }}>
                {ctrl.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PHASE 10: INTERACTIVE LIVE DEMO MODE (60-SECOND SIMULATOR) */}
      <section id="demo" style={{
        padding: "4rem clamp(1.25rem, 4vw, 4rem)",
        maxWidth: 1240,
        margin: "0 auto",
        borderTop: `1px solid ${palette.border}`
      }}>
        <div style={{
          background: palette.card,
          border: `1.5px solid ${palette.borderGold}`,
          borderRadius: 24,
          padding: "clamp(1.8rem, 3.5vw, 2.8rem)",
          color: palette.text,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            borderBottom: `1px solid ${palette.border}`,
            paddingBottom: "1.4rem",
            marginBottom: "2rem"
          }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", fontSize: "0.74rem", letterSpacing: "0.1em", color: palette.goldDeep, fontWeight: 700 }}>
                <span>●</span> INTERACTIVE CLIENT DEMO / SIMULATED RUNTIME (ZERO CUSTODY)
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.7rem", margin: "0.35rem 0 0", color: palette.text }}>
                Simulate End-to-End Orchestration in Under 60 Seconds
              </h2>
            </div>

            <div style={{
              background: palette.greenBg,
              border: "1px solid rgba(22, 163, 74, 0.3)",
              color: palette.green,
              padding: "0.35rem 0.85rem",
              borderRadius: 999,
              fontSize: "0.78rem",
              fontWeight: 700
            }}>
              <span>🟢</span> ZERO-CUSTODY DEMO ACTIVE
            </div>
          </div>

          {/* Interactive Configuration Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.8rem",
            marginBottom: "2.4rem"
          }}>
            {/* 1. Ticket Size Selection */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: palette.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem" }}>
                1. Select Transaction Ticket Size
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                {TICKET_PRESETS.map(t => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => { setSelectedTicket(t.value); setSimComplete(false); }}
                    style={{
                      background: selectedTicket === t.value ? "rgba(196, 139, 40, 0.12)" : "#FAF9F6",
                      border: selectedTicket === t.value ? `1.5px solid ${palette.goldPrimary}` : `1px solid ${palette.border}`,
                      borderRadius: 12,
                      padding: "0.75rem",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.16s ease"
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: selectedTicket === t.value ? palette.goldDeep : palette.text }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: palette.muted, marginTop: "2px" }}>
                      {t.desc} ({t.inr})
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Clearing Rail Selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: palette.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem" }}>
                2. Select Buyer Geographic Origin Rail
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {RAILS.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setSelectedRail(r); setSimComplete(false); }}
                    style={{
                      background: selectedRail.id === r.id ? "rgba(196, 139, 40, 0.12)" : "#FAF9F6",
                      border: selectedRail.id === r.id ? `1.5px solid ${palette.goldPrimary}` : `1px solid ${palette.border}`,
                      borderRadius: 10,
                      padding: "0.55rem 0.85rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.16s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>{r.flag}</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: selectedRail.id === r.id ? palette.goldDeep : palette.text }}>
                        {r.name}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: palette.muted, fontFamily: "monospace" }}>
                      {r.railLatency}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Destination Bank Configuration */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: palette.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem" }}>
                3. Your Corporate Bank Account (Beneficiary)
              </label>
              <select
                value={merchantBank}
                onChange={(e) => setMerchantBank(e.target.value)}
                style={{
                  width: "100%",
                  background: "#FAF9F6",
                  border: `1px solid ${palette.border}`,
                  borderRadius: 12,
                  padding: "0.85rem 1rem",
                  color: palette.text,
                  fontSize: "0.9rem",
                  outline: "none",
                  cursor: "pointer",
                  marginBottom: "1rem"
                }}
              >
                <option value="Wio Bank Dubai (Master Corporate)">Wio Bank Dubai (Master Corporate Account)</option>
                <option value="Mashreq NeoBiz (UAE Corporate)">Mashreq NeoBiz (UAE Corporate Account)</option>
                <option value="Emirates NBD (Dubai Corporate)">Emirates NBD (Dubai Corporate Account)</option>
                <option value="JPMorgan Chase US (Corporate Treasury)">JPMorgan Chase US (Corporate Treasury)</option>
                <option value="ICICI Bank (Inward Remittance & Auto-FIRC)">ICICI Bank India (Auto-eFIRC Remittance)</option>
              </select>

              <div style={{
                background: "rgba(196, 139, 40, 0.06)",
                border: `1px dashed ${palette.borderGold}`,
                borderRadius: 12,
                padding: "0.85rem 1rem",
                fontSize: "0.78rem",
                color: palette.textBody,
                lineHeight: 1.5
              }}>
                <span style={{ color: palette.goldDeep, fontWeight: 700 }}>🔒 Invariant Enforced:</span> Funds bypass GARUDA completely. Money lands directly in your corporate bank ledger.
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <button
              type="button"
              disabled={isSimulating}
              onClick={handleRunSimulation}
              style={{
                background: palette.goldGradient,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 14,
                padding: "1rem 2.5rem",
                fontSize: "1.05rem",
                fontWeight: 700,
                cursor: isSimulating ? "not-allowed" : "pointer",
                boxShadow: "0 8px 24px rgba(179, 130, 53, 0.28)",
                transition: "all 0.16s ease",
                opacity: isSimulating ? 0.7 : 1
              }}
            >
              {isSimulating ? "Executing Multi-Rail Routing..." : `Run Simulated $${selectedTicket.toLocaleString()} Direct-to-Bank Transfer →`}
            </button>
          </div>

          {/* Real-Time Execution Pipeline Steps */}
          {simStep > 0 && (
            <div style={{
              background: "#FAF9F6",
              border: `1px solid ${palette.border}`,
              borderRadius: 16,
              padding: "1.4rem",
              marginBottom: "2.4rem"
            }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: palette.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
                Deterministic Telemetry Stream
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontFamily: "ui-monospace, monospace", fontSize: "0.82rem" }}>
                <div style={{ color: simStep >= 1 ? "#15803d" : palette.subtle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{simStep >= 1 ? "✔" : "⏳"}</span>
                  <span>[STEP 1] PAYMENT_INTENT_CREATED: Idempotency checked, zero-custody validated, risk scored (Low).</span>
                </div>
                <div style={{ color: simStep >= 2 ? "#15803d" : palette.subtle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{simStep >= 2 ? "✔" : "⏳"}</span>
                  <span>[STEP 2] VAN_PROVISIONED: Dedicated account ({selectedRail.vanPrefix}9842107) generated under {merchantBank.split(" ")[0]}.</span>
                </div>
                <div style={{ color: simStep >= 3 ? "#15803d" : palette.subtle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{simStep >= 3 ? "✔" : "⏳"}</span>
                  <span>[STEP 3] DIRECT_CLEARING: Dispatched via {selectedRail.name} ({selectedRail.clearingBank}) direct to merchant.</span>
                </div>
                <div style={{ color: simStep >= 4 ? "#15803d" : palette.subtle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{simStep >= 4 ? "✔" : "⏳"}</span>
                  <span>[STEP 4] WEBHOOK_VERIFIED: Constant-time HMAC-SHA256 authenticated, timestamp validated, nonce deduplicated.</span>
                </div>
                <div style={{ color: simStep >= 5 ? "#15803d" : palette.subtle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{simStep >= 5 ? "✔" : "⏳"}</span>
                  <span>[STEP 5] RECONCILED_AND_SETTLED: Exact amount matched, state transition SHA-256 hash chained.</span>
                </div>
                <div style={{ color: simStep >= 6 ? palette.goldDeep : palette.subtle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{simStep >= 6 ? "✔" : "⏳"}</span>
                  <span>[STEP 6] AUDIT_SEALED: Software metering fee (0.15% = ${garudaSoftwareFeeUSD.toLocaleString()}) deducted from Fuel Tank. Customer principal = 100% untouched.</span>
                </div>
              </div>
            </div>
          )}

          {/* Explicit Illustrative Fee Notice */}
          <div style={{
            background: "#FAF9F6",
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: "0.75rem 1.2rem",
            marginBottom: "1.4rem",
            fontSize: "0.78rem",
            color: palette.textBody,
            lineHeight: 1.5
          }}>
            <span style={{ color: palette.goldDeep, fontWeight: 700, letterSpacing: "0.06em" }}>
              ✦ ILLUSTRATIVE / SIMULATED FEE ASSUMPTIONS:
            </span>{" "}
            Comparative models reflect standard card-aggregator merchant discount rates (2.50%) vs direct interbank software orchestration (0.15% SaaS fee + clearing rail pass-through). Actual bank rail fees, FX spreads, and commercial terms are subject to negotiated client agreements with partner financial institutions.
          </div>

          {/* Financial Math & Comparison Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.6rem"
          }}>
            {/* Traditional Gateway Card */}
            <div style={{
              background: "rgba(185, 28, 28, 0.04)",
              border: "1px solid rgba(220, 38, 38, 0.25)",
              borderRadius: 18,
              padding: "1.6rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: palette.red }}>Traditional Card Gateway / Escrow</span>
                <span style={{ background: "rgba(220, 38, 38, 0.1)", color: palette.red, padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 800 }}>2.50% CUT</span>
              </div>

              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: palette.red, margin: "0.5rem 0" }}>
                -${traditionalFeeUSD.toLocaleString()} USD
              </div>
              <div style={{ fontSize: "0.82rem", color: "#991b1b", marginBottom: "1.2rem" }}>
                Total transaction processing fee (₹{(traditionalFeeUSD * 85).toLocaleString()} INR)
              </div>

              <div style={{ borderTop: "1px solid rgba(220, 38, 38, 0.15)", paddingTop: "0.8rem", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.82rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: palette.muted }}>Settlement Hold:</span>
                  <span style={{ color: palette.red, fontWeight: 700 }}>7 – 14 Business Days (Locked)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: palette.muted }}>Net Received by Merchant:</span>
                  <span style={{ color: palette.text, fontWeight: 700 }}>${traditionalNetUSD.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: palette.muted }}>Custody Risk:</span>
                  <span style={{ color: palette.red, fontWeight: 700 }}>Third-party pooled depository</span>
                </div>
              </div>
            </div>

            {/* GARUDA Sovereign Multi-Rail Card */}
            <div style={{
              background: "rgba(196, 139, 40, 0.08)",
              border: `1.5px solid ${palette.goldPrimary}`,
              borderRadius: 18,
              padding: "1.6rem",
              position: "relative",
              boxShadow: "0 8px 32px rgba(179, 130, 53, 0.12)"
            }}>
              <div style={{
                position: "absolute",
                top: -12,
                right: 20,
                background: palette.goldGradient,
                color: "#FFFFFF",
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
                padding: "0.25rem 0.75rem",
                borderRadius: 999
              }}>
                90% FEE EFFICIENCY
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: palette.goldDeep }}>GARUDA Sovereign Multi-Rail Switch</span>
                <span style={{ background: "rgba(196, 139, 40, 0.18)", color: palette.goldDeep, padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 800 }}>0.15% SAAS METERING</span>
              </div>

              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#15803d", margin: "0.5rem 0" }}>
                +${totalSavedUSD.toLocaleString()} USD PRESERVED
              </div>
              <div style={{ fontSize: "0.82rem", color: palette.goldDeep, marginBottom: "1.2rem" }}>
                Retained cash on this transaction (₹{totalSavedINR.toLocaleString()} INR)
              </div>

              <div style={{ borderTop: "1px solid rgba(196, 139, 40, 0.2)", paddingTop: "0.8rem", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.82rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: palette.muted }}>Settlement Hold:</span>
                  <span style={{ color: "#15803d", fontWeight: 700 }}>ZERO HOLD ({selectedRail.railLatency})</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: palette.muted }}>GARUDA Software Metering:</span>
                  <span style={{ color: palette.goldDeep, fontWeight: 700 }}>${garudaSoftwareFeeUSD.toLocaleString()} (0.15%)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: palette.muted }}>Interbank Rail Cost:</span>
                  <span style={{ color: palette.text, fontWeight: 700 }}>Flat ${interbankRailFeeUSD}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: palette.muted }}>Net Received Direct in Bank:</span>
                  <span style={{ color: "#15803d", fontWeight: 800, fontSize: "0.92rem" }}>${garudaNetUSD.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHASE 11: VERIFICATION PANEL */}
      <section id="verification" style={{
        padding: "4rem clamp(1.25rem, 4vw, 4rem)",
        maxWidth: 1240,
        margin: "0 auto",
        borderTop: `1px solid ${palette.border}`
      }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ color: palette.goldDeep, letterSpacing: "0.14em", fontSize: "0.76rem", fontWeight: 700, margin: "0 0 0.5rem", textTransform: "uppercase" }}>
            ✦ INTERNAL ENGINEERING VERIFICATION
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.3rem", fontWeight: 700, color: palette.text, margin: 0 }}>
            Automated Engineering Test Verification
          </h2>
          <p style={{ color: palette.muted, fontSize: "0.95rem", maxWidth: 680, margin: "0.6rem auto 0" }}>
            Deterministic test execution results verified clean on local developer hardware.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.2rem",
          marginBottom: "2rem"
        }}>
          {[
            { label: "Fintech Master Suite", val: "81/81 PASS", sub: "Production hardening & scenarios" },
            { label: "Production Hardening", val: "37/37 PASS", sub: "Cryptographic state machine & locks" },
            { label: "Zero-Custody Tests", val: "7/7 PASS", sub: "Prohibits wallets, escrow, custody" },
            { label: "Webhook Security Tests", val: "10/10 PASS", sub: "HMAC, 300s window & nonces" },
            { label: "Deterministic Recon", val: "12/12 PASS", sub: "Exact match & auto-quarantine" },
            { label: "Auth Context & Trust", val: "12/12 PASS", sub: "Tenant boundary isolation" },
            { label: "SaaS Billing Routes", val: "10/10 PASS", sub: "Metered subscription routing" },
            { label: "Frontend Build", val: "958 PAGES", sub: "451 canonical routes prerendered" }
          ].map((v) => (
            <div key={v.label} style={{
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 14,
              padding: "1.2rem 1.4rem",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)"
            }}>
              <div style={{ fontSize: "0.72rem", color: palette.subtle, textTransform: "uppercase", fontWeight: 700 }}>
                {v.label}
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#059669", margin: "0.3rem 0 0.15rem" }}>
                {v.val}
              </div>
              <div style={{ fontSize: "0.74rem", color: palette.muted }}>
                {v.sub}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: "rgba(23, 24, 27, 0.03)",
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: "1rem 1.4rem",
          fontSize: "0.8rem",
          color: palette.muted,
          textAlign: "center"
        }}>
          <span style={{ color: palette.goldDeep, fontWeight: 700 }}>INTERNAL VERIFICATION DISCLAIMER: </span>
          The above metrics reflect verified automated test suite execution inside the local development environment. They demonstrate technical software invariants and do not independently constitute statutory regulatory certification or banking licenses.
        </div>
      </section>

      {/* PHASE 12: REGULATORY DEMARCATION */}
      <section style={{
        padding: "4rem clamp(1.25rem, 4vw, 4rem)",
        maxWidth: 1240,
        margin: "0 auto",
        borderTop: `1px solid ${palette.border}`
      }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ color: palette.goldDeep, letterSpacing: "0.14em", fontSize: "0.76rem", fontWeight: 700, margin: "0 0 0.5rem", textTransform: "uppercase" }}>
            ✦ STATUTORY COMPLIANCE BOUNDARY
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.3rem", fontWeight: 700, color: palette.text, margin: 0 }}>
            Tri-Partite Regulatory Demarcation
          </h2>
          <p style={{ color: palette.muted, fontSize: "0.95rem", maxWidth: 700, margin: "0.6rem auto 0" }}>
            Clear statutory segregation of technology, banking execution, and commercial merchant responsibilities.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.8rem", marginBottom: "2rem" }}>
          {/* Card 1: GARUDA OS */}
          <div style={{ background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 18, padding: "1.8rem", boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>🦅</div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: palette.goldDeep, margin: "0 0 0.6rem" }}>
              GARUDA OS
            </h3>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: palette.subtle, textTransform: "uppercase", marginBottom: "0.8rem" }}>
              Technology & Orchestration Layer
            </div>
            <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.84rem", color: palette.textBody, lineHeight: 1.6 }}>
              <li>Software routing algorithms and Virtual Account Number (VAN) dispatch.</li>
              <li>Webhook security authentication (HMAC-SHA256) and replay defense.</li>
              <li>Deterministic reconciliation engine and anomaly quarantine.</li>
              <li>Cryptographic append-only SHA-256 audit ledger.</li>
              <li style={{ color: "#DC2626", fontWeight: 600 }}>Never takes custody, possession, or control of principal funds ($0.00).</li>
            </ul>
          </div>

          {/* Card 2: Regulated Bank */}
          <div style={{ background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 18, padding: "1.8rem", boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>🏦</div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0284c7", margin: "0 0 0.6rem" }}>
              Regulated Banking / PSP Partners
            </h3>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: palette.subtle, textTransform: "uppercase", marginBottom: "0.8rem" }}>
              Licensed Payment & Clearing Execution Layer
            </div>
            <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.84rem", color: palette.textBody, lineHeight: 1.6 }}>
              <li>Direct membership in central bank clearing networks (Fedwire, UAE FTS, RTGS, FPS).</li>
              <li>Licensed deposit accounts, statutory safeguarding, and treasury custody.</li>
              <li>Statutory KYC, AML, customer due diligence, and sanctions screening.</li>
              <li>Execution of interbank credit and settlement confirmation generation.</li>
            </ul>
          </div>

          {/* Card 3: Merchant */}
          <div style={{ background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 18, padding: "1.8rem", boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>🏢</div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#059669", margin: "0 0 0.6rem" }}>
              Enterprise Merchant
            </h3>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: palette.subtle, textTransform: "uppercase", marginBottom: "0.8rem" }}>
              Statutory Merchant of Record & Beneficiary
            </div>
            <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.84rem", color: palette.textBody, lineHeight: 1.6 }}>
              <li>Sole commercial beneficiary receiving 100% principal funds into corporate account.</li>
              <li>Maintains direct contractual and commercial relationships with banking providers.</li>
              <li>Fulfills commercial obligations, sales tax, VAT, and corporate reporting.</li>
              <li>Authorizes software maintenance deductions from prepaid SaaS Fuel Tank.</li>
            </ul>
          </div>
        </div>

        <div style={{
          background: "rgba(23, 24, 27, 0.03)",
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: "1.2rem 1.6rem",
          fontSize: "0.82rem",
          color: palette.muted,
          lineHeight: 1.6,
          textAlign: "center"
        }}>
          <span style={{ color: palette.goldDeep, fontWeight: 700 }}>LEGAL NOTICE: </span>
          Regulatory treatment depends on jurisdiction, commercial product structure, and the activities actually performed. Commercial pilot launch requires formal underwriting by regulated banking partners and written opinion from licensed legal counsel in applicable jurisdictions (UAE, India, UK/EU).
        </div>
      </section>

      {/* PHASE 12B: DEDICATED COMMERCIAL PRICING LAYER */}
      <section id="pricing" style={{
        padding: "4.5rem clamp(1.25rem, 4vw, 4rem)",
        maxWidth: 1240,
        margin: "0 auto",
        borderTop: `1px solid ${palette.border}`
      }}>
        {/* Section Heading & Subheading */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ color: palette.goldDeep, letterSpacing: "0.14em", fontSize: "0.76rem", fontWeight: 700, margin: "0 0 0.5rem", textTransform: "uppercase" }}>
            ✦ COMMERCIAL ARCHITECTURE TIERS
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem, 3.8vw, 2.7rem)", fontWeight: 700, color: palette.text, margin: "0 0 0.8rem" }}>
            Choose Your GARUDA Gateway Architecture
          </h2>
          <p style={{ color: palette.muted, fontSize: "1.02rem", maxWidth: 760, margin: "0 auto", lineHeight: 1.6 }}>
            Start with managed gateway infrastructure, scale into multi-rail treasury orchestration, or deploy a private sovereign architecture for enterprise environments.
          </p>
        </div>

        {/* Section 5: Statutory Demarcation & Fee Responsibility Segregation Explanatory Row */}
        <div style={{
          background: "#FAF9F6",
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          padding: "1.4rem 1.8rem",
          marginBottom: "3rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "1rem",
            borderBottom: `1px solid ${palette.border}`,
            paddingBottom: "0.75rem"
          }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, letterSpacing: "0.1em", color: palette.goldDeep, textTransform: "uppercase" }}>
              ⚖ Fee & Responsibility Segregation Model
            </span>
            <span style={{ fontSize: "0.74rem", color: palette.subtle }}>
              Zero-Custody Tri-Partite Demarcation
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.2rem"
          }}>
            <div style={{ padding: "0.9rem 1.1rem", background: palette.card, borderRadius: 12, border: `1px solid ${palette.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "1.1rem" }}>🦅</span>
                <span style={{ fontWeight: 800, fontSize: "0.86rem", color: palette.text }}>GARUDA PLATFORM</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: palette.goldDeep, fontWeight: 700, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                → Software / Orchestration / Infrastructure
              </div>
              <div style={{ fontSize: "0.78rem", color: palette.muted, lineHeight: 1.5 }}>
                Software licensing, routing telemetry, zero-custody orchestration, webhook verification & cryptographic audit ledger infrastructure.
              </div>
            </div>

            <div style={{ padding: "0.9rem 1.1rem", background: palette.card, borderRadius: 12, border: `1px solid ${palette.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "1.1rem" }}>🏦</span>
                <span style={{ fontWeight: 800, fontSize: "0.86rem", color: palette.text }}>REGULATED PROVIDER</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                → Banking / Clearing / Safeguarding / Execution
              </div>
              <div style={{ fontSize: "0.78rem", color: palette.muted, lineHeight: 1.5 }}>
                Direct interbank clearing, licensed deposit safeguarding, statutory KYC/AML, FX conversion, and regulated banking fees.
              </div>
            </div>

            <div style={{ padding: "0.9rem 1.1rem", background: palette.card, borderRadius: 12, border: `1px solid ${palette.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "1.1rem" }}>🏢</span>
                <span style={{ fontWeight: 800, fontSize: "0.86rem", color: palette.text }}>MERCHANT</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                → Commercial / Customer / Beneficiary Duties
              </div>
              <div style={{ fontSize: "0.78rem", color: palette.muted, lineHeight: 1.5 }}>
                Direct underwriting contracts with financial partners, merchant tax obligations, and commercial customer responsibilities.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Three Commercial Tier Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
          gap: "1.8rem",
          alignItems: "stretch"
        }}>
          {/* TIER 01: CLOUD STARTER */}
          <div className="garuda-tier-card" style={{
            background: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
            position: "relative"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", color: palette.muted, textTransform: "uppercase" }}>
                  TIER 01 • MANAGED INFRASTRUCTURE
                </span>
              </div>

              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.55rem", fontWeight: 700, margin: "0 0 0.5rem", color: palette.text }}>
                Cloud Starter
              </h3>

              <div style={{ fontSize: "0.8rem", color: palette.muted, marginBottom: "1.4rem", lineHeight: 1.5 }}>
                <strong style={{ color: palette.textBody }}>Target:</strong> D2C Brands • SMEs • Early-stage businesses • Digital commerce companies
              </div>

              <div style={{ borderTop: `1px solid ${palette.border}`, borderBottom: `1px solid ${palette.border}`, padding: "1.2rem 0", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: palette.subtle, marginBottom: "0.25rem" }}>
                  Managed Software Tier
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: 800, color: palette.text, letterSpacing: "-0.02em" }}>
                  From ₹4,999 <span style={{ fontSize: "0.95rem", fontWeight: 500, color: palette.muted }}>/ month</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: palette.muted, marginTop: "0.45rem", lineHeight: 1.45 }}>
                  Commercial pricing subject to transaction volume, provider costs and final scope.
                </div>
              </div>

              <div style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: palette.goldDeep, marginBottom: "0.9rem" }}>
                Core Capabilities
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.6rem", display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.84rem", color: palette.textBody }}>
                {[
                  "Hosted Gateway Infrastructure",
                  "Multi-rail orchestration architecture",
                  "Zero-custody design",
                  "Direct-to-regulated-provider execution model",
                  "Transaction lifecycle monitoring",
                  "Webhook security",
                  "Reconciliation architecture",
                  "Gateway dashboard",
                  "Standard support"
                ].map((cap, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", lineHeight: 1.45 }}>
                    <span style={{ color: palette.goldDeep, fontWeight: 800, fontSize: "0.9rem" }}>✓</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{
                background: "rgba(23, 24, 27, 0.03)",
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                padding: "0.75rem 0.9rem",
                fontSize: "0.72rem",
                color: palette.muted,
                lineHeight: 1.45,
                marginBottom: "1.3rem"
              }}>
                <span style={{ color: palette.text, fontWeight: 700 }}>Note:</span> Actual rail availability depends on approved regulated-provider connectivity and commercial onboarding. Live direct-bank settlement requires approved provider underwriting.
              </div>

              <button
                type="button"
                onClick={() => navigate("/chat?topic=fintech-gateway&tier=cloud-starter")}
                style={{
                  width: "100%",
                  background: palette.card,
                  color: palette.text,
                  border: `1.5px solid ${palette.border}`,
                  borderRadius: 12,
                  padding: "0.85rem 1.4rem",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)"
                }}
              >
                Discuss Starter Deployment →
              </button>
            </div>
          </div>

          {/* TIER 02: CROSS-BORDER GROWTH */}
          <div className="garuda-tier-card" style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FAF8F2 100%)",
            border: `1.5px solid ${palette.goldPrimary}`,
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 12px 36px rgba(179, 130, 53, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)",
            position: "relative"
          }}>
            <div style={{
              position: "absolute",
              top: -12,
              right: 20,
              background: palette.goldGradient,
              color: "#FFFFFF",
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              padding: "0.3rem 0.85rem",
              borderRadius: 999,
              boxShadow: "0 4px 12px rgba(196, 139, 40, 0.3)"
            }}>
              MULTI-CURRENCY ORCHESTRATION
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", color: palette.goldDeep, textTransform: "uppercase" }}>
                  TIER 02 • TREASURY SCALE
                </span>
              </div>

              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.55rem", fontWeight: 700, margin: "0 0 0.5rem", color: palette.text }}>
                Cross-Border Growth
              </h3>

              <div style={{ fontSize: "0.8rem", color: palette.muted, marginBottom: "1.4rem", lineHeight: 1.5 }}>
                <strong style={{ color: palette.textBody }}>Target:</strong> Exporters • IT agencies • International service businesses • Multi-currency merchants
              </div>

              <div style={{ borderTop: `1px solid ${palette.borderGold}`, borderBottom: `1px solid ${palette.borderGold}`, padding: "1.2rem 0", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: palette.goldDeep, marginBottom: "0.25rem" }}>
                  Cross-Border Setup & Monthly Orchestration
                </div>
                <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "0.6rem" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: palette.text, letterSpacing: "-0.02em" }}>
                    From ₹49,000 <span style={{ fontSize: "0.82rem", fontWeight: 600, color: palette.muted }}>setup</span>
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: palette.goldDeep }}>
                    + ₹9,999 <span style={{ fontSize: "0.82rem", fontWeight: 500, color: palette.muted }}>/ month</span>
                  </div>
                </div>
                <div style={{ fontSize: "0.75rem", color: palette.muted, marginTop: "0.45rem", lineHeight: 1.45 }}>
                  Indicative commercial starting point; final pricing depends on corridors, currencies, providers and integration scope.
                </div>
              </div>

              <div style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: palette.goldDeep, marginBottom: "0.9rem" }}>
                Everything in Cloud Starter, plus:
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.6rem", display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.84rem", color: palette.textBody }}>
                {[
                  "Multi-currency treasury orchestration",
                  "USD / AED / INR / GBP / EUR workflow support",
                  "Cross-border payment orchestration",
                  "Multi-provider routing architecture",
                  "Automated reconciliation",
                  "Invoice/payment workflow integration",
                  "Treasury visibility",
                  "Custom integration support",
                  "Priority implementation"
                ].map((cap, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", lineHeight: 1.45 }}>
                    <span style={{ color: palette.goldDeep, fontWeight: 800, fontSize: "0.9rem" }}>✓</span>
                    <span style={{ fontWeight: i === 1 ? 600 : 400 }}>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{
                background: "rgba(196, 139, 40, 0.08)",
                border: `1px solid ${palette.borderGold}`,
                borderRadius: 10,
                padding: "0.75rem 0.9rem",
                fontSize: "0.72rem",
                color: palette.textBody,
                lineHeight: 1.45,
                marginBottom: "1.3rem"
              }}>
                <span style={{ color: palette.goldDeep, fontWeight: 700 }}>Corridor Notice:</span> Supported architecture & configurable workflows for USD, AED, INR, GBP, EUR. Actual rail connectivity is subject to approved partner bank onboarding and corridor-specific provider underwriting.
              </div>

              <button
                type="button"
                onClick={() => navigate("/chat?topic=fintech-gateway&tier=cross-border-growth")}
                style={{
                  width: "100%",
                  background: palette.goldGradient,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 12,
                  padding: "0.85rem 1.4rem",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  boxShadow: "0 6px 20px rgba(179, 130, 53, 0.35)"
                }}
              >
                Plan Cross-Border Architecture →
              </button>
            </div>
          </div>

          {/* TIER 03: SOVEREIGN ENTERPRISE */}
          <div className="garuda-tier-card" style={{
            background: palette.card,
            border: "1px solid rgba(23, 24, 27, 0.14)",
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 6px 24px rgba(0, 0, 0, 0.04)",
            position: "relative"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", color: palette.muted, textTransform: "uppercase" }}>
                  TIER 03 • PRIVATE DEPLOYMENT
                </span>
                <span style={{ background: "rgba(23, 24, 27, 0.06)", color: palette.text, fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: 999 }}>
                  SOVEREIGN
                </span>
              </div>

              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.55rem", fontWeight: 700, margin: "0 0 0.5rem", color: palette.text }}>
                Sovereign Enterprise
              </h3>

              <div style={{ fontSize: "0.8rem", color: palette.muted, marginBottom: "1.4rem", lineHeight: 1.5 }}>
                <strong style={{ color: palette.textBody }}>Target:</strong> Large enterprises • Fintech infrastructure teams • NBFCs • Platforms • Organizations requiring private deployment
              </div>

              <div style={{ borderTop: `1px solid ${palette.border}`, borderBottom: `1px solid ${palette.border}`, padding: "1.2rem 0", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: palette.subtle, marginBottom: "0.25rem" }}>
                  Dedicated Architecture
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: 800, color: palette.text, letterSpacing: "-0.02em" }}>
                  Custom
                </div>
                <div style={{ fontSize: "0.75rem", color: palette.muted, marginTop: "0.45rem", lineHeight: 1.45 }}>
                  Private VPC / Self-Hosted Architecture. Available subject to commercial scope and agreement.
                </div>
              </div>

              <div style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: palette.goldDeep, marginBottom: "0.9rem" }}>
                Core Capabilities
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.6rem", display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.84rem", color: palette.textBody }}>
                {[
                  "Private deployment architecture",
                  "Sovereign infrastructure model",
                  "Dedicated environment",
                  "Enterprise integration",
                  "Custom provider orchestration",
                  "Advanced treasury workflows",
                  "Private audit infrastructure",
                  "Enterprise security controls",
                  "Dedicated SLA options",
                  "Architecture-level customization",
                  "Source-level deployment options subject to commercial agreement"
                ].map((cap, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", lineHeight: 1.45 }}>
                    <span style={{ color: palette.goldDeep, fontWeight: 800, fontSize: "0.9rem" }}>✓</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{
                background: "rgba(23, 24, 27, 0.03)",
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                padding: "0.75rem 0.9rem",
                fontSize: "0.72rem",
                color: palette.muted,
                lineHeight: 1.45,
                marginBottom: "1.3rem"
              }}>
                <span style={{ color: palette.text, fontWeight: 700 }}>Scope Grounding:</span> Private VPC deployment, custom provider orchestration, dedicated SLAs, and source-level licenses are available subject to commercial scope and agreement.
              </div>

              <button
                type="button"
                onClick={() => navigate("/chat?topic=fintech-gateway&tier=sovereign-enterprise")}
                style={{
                  width: "100%",
                  background: palette.text,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 12,
                  padding: "0.85rem 1.4rem",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  boxShadow: "0 4px 16px rgba(23, 24, 27, 0.25)"
                }}
              >
                Talk to Enterprise →
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Compact Transparency Note (Pricing Truth Layer) */}
        <div style={{
          background: "#FAF9F6",
          border: `1px solid ${palette.border}`,
          borderRadius: 14,
          padding: "1.2rem 1.6rem",
          marginTop: "2.4rem",
          marginBottom: "1.8rem",
          display: "flex",
          gap: "1rem",
          alignItems: "flex-start"
        }}>
          <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>🔒</span>
          <div style={{ fontSize: "0.82rem", color: palette.muted, lineHeight: 1.65 }}>
            <div style={{ fontWeight: 700, color: palette.text, marginBottom: "0.3rem" }}>
              Commercial Pricing Transparency & Boundary Notice
            </div>
            <p style={{ margin: "0 0 0.5rem" }}>
              Commercial pricing shown here is an indicative starting point, not a binding quote. Final pricing depends on transaction volume, supported corridors, regulated-provider availability, integration complexity, infrastructure requirements and commercial agreements.
            </p>
            <p style={{ margin: 0, color: palette.textBody }}>
              Provider fees, banking charges, FX costs, taxes and third-party infrastructure costs may apply separately.
            </p>
          </div>
        </div>

        {/* Section 6: Relationship to Global GARUDA Pricing */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          paddingTop: "0.8rem",
          borderTop: `1px solid ${palette.border}`
        }}>
          <Link
            to="/pricing"
            style={{
              color: palette.goldDeep,
              fontSize: "0.86rem",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            View GARUDA Platform Plans →
          </Link>

          <button
            type="button"
            onClick={() => navigate("/chat?topic=fintech-enterprise")}
            style={{
              background: "none",
              border: "none",
              color: palette.muted,
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            Need a fully custom architecture? Talk to GARUDA Enterprise →
          </button>
        </div>
      </section>

      {/* PHASE 13: CLIENT CALL TO ACTION */}
      <section style={{
        padding: "5rem clamp(1.25rem, 4vw, 4rem)",
        background: "linear-gradient(180deg, #FAF9F6 0%, #F2EFE8 100%)",
        borderTop: `1px solid ${palette.border}`,
        color: palette.text,
        textAlign: "center"
      }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <p style={{ color: palette.goldDeep, letterSpacing: "0.14em", fontSize: "0.76rem", fontWeight: 700, margin: "0 0 0.5rem", textTransform: "uppercase" }}>
            ✦ EXPLORE THE INFRASTRUCTURE
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 700, margin: "0 0 1rem", color: palette.text }}>
            Ready to Connect Sovereign Payment Orchestration?
          </h2>
          <p style={{ color: palette.muted, fontSize: "1.05rem", lineHeight: 1.65, marginBottom: "2.4rem" }}>
            Deploy zero-custody multi-rail routing, deterministic bank reconciliation, and real-time treasury telemetry for your enterprise operations.
          </p>

          <div style={{ display: "flex", gap: "1.2rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/chat?topic=fintech-gateway")}
              style={{
                background: palette.goldGradient,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "1rem 2.4rem",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 8px 28px rgba(179, 130, 53, 0.4)",
                transition: "transform 0.16s ease"
              }}
            >
              Request Enterprise Pilot Briefing →
            </button>
            <a
              href="#architecture"
              style={{
                background: palette.card,
                color: palette.text,
                border: `1px solid ${palette.border}`,
                borderRadius: 999,
                padding: "1rem 2rem",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
              }}
            >
              View Transaction Topology
            </a>
          </div>

          <div style={{ marginTop: "2.5rem", fontSize: "0.8rem", color: palette.subtle }}>
            GARUDA AI Operating System • Canonical Universe 12 (Finance) • Founder Praveen Mahawar
          </div>
        </div>
      </section>
    </div>
  );
}
