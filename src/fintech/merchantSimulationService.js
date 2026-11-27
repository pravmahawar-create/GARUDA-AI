/**
 * 🦅 GARUDA OS — ISOLATED MERCHANT OPERATIONS SIMULATION SANDBOX (PHASE 11)
 *
 * Strict Operational & Legal Boundaries:
 * - Zero shared state with live merchant/fintech stores.
 * - Executes REAL MerchantEligibilityService, BsaSection63EvidenceService,
 *   GrowthAttributionService, and FintechOrchestrationService instances in sandbox.
 * - Demonstrates live FAIL-CLOSED 403 blocking on ONLINE_MONEY_GAME while showcasing
 *   high-craft growth analytics for permitted RECOGNIZED_ESPORTS & SOCIAL_GAME entities,
 *   provider-neutral UPI QR checkout, bank-verified VAN sweep status, and BSA Sec 63 Part A/B drafts.
 */

const crypto = require("crypto");
const QRCode = require("qrcode");
const {
  GAME_CATEGORIES,
  MerchantEligibilityService
} = require("./merchantEligibilityService");
const { BsaSection63EvidenceService } = require("./bsaSection63EvidenceService");
const { GrowthAttributionService } = require("./growthAttributionService");
const { CommercialAgreementService, BILLING_MODES } = require("./commercialAgreementService");
const { FuelTankService } = require("./fuelTankService");
const { CommissionProtectionService } = require("./commissionProtectionService");
const { VerifiedBankReceiptRegistry, RECEIPT_PURPOSES } = require("./bankReceiptVerifier");
const { FintechOrchestrationService } = require("./orchestrationService");

const SIM_OPS_TENANT = "SIM_TENANT_MERCHANT_OPS";
const SIM_WEBHOOK_SECRET = "sim_ops_webhook_secret_local_only";
const SIM_FEED_SECRET = "sim_ops_feed_secret_local_only";

function tagSim(obj) {
  if (!obj || typeof obj !== "object") return obj;
  return { ...obj, isSimulated: true, environmentMode: "SIMULATED" };
}

function signSimHmac(payloadObj, secretKey, ts = Math.floor(Date.now() / 1000)) {
  const rawPayload = JSON.stringify(payloadObj);
  const sig = crypto.createHmac("sha256", secretKey).update(`${ts}.${rawPayload}`).digest("hex");
  return { rawPayload, signatureHeader: `t=${ts},v1=${sig}` };
}

class MerchantOpsSimulationService {
  constructor() {
    this.sessions = new Map();
  }

  async _createFreshWorkspace(sessionId) {
    const eligibility = new MerchantEligibilityService();
    const evidence = new BsaSection63EvidenceService();
    const growth = new GrowthAttributionService({ eligibilityService: eligibility });
    const receiptRegistry = new VerifiedBankReceiptRegistry();
    const agreements = new CommercialAgreementService();
    const fuelTank = new FuelTankService({ bankReceiptRegistry: receiptRegistry });
    const commissionProtection = new CommissionProtectionService({
      agreementService: agreements,
      bankReceiptRegistry: receiptRegistry
    });
    const orchestration = new FintechOrchestrationService({
      fuelTank,
      agreementService: agreements,
      commissionProtection,
      strictAgreementMode: true
    });

    const founderCtx = { role: "platform_founder", isFounderApproved: true, actorId: "SIM_FOUNDER" };

    // 1. Permitted Esports Merchant
    eligibility.declareMerchantProfile({
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_ESPORTS_01",
      legalName: "Apex Arena Esports League Pvt Ltd (SIMULATED)",
      category: GAME_CATEGORIES.RECOGNIZED_ESPORTS,
      involvesMoneyStakeOrWinnings: false,
      esportsRegistrationRef: "ESPORTS-IND-2026-881"
    });
    eligibility.reviewAndApprove({
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_ESPORTS_01",
      counselApproved: true,
      counselReference: "COUNSEL-MEMO-2026-ESP-01",
      founderContext: founderCtx
    });

    // 2. Permitted Social Game Merchant
    eligibility.declareMerchantProfile({
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_SOCIAL_02",
      legalName: "Ludo Social Arcade Studio LLP (SIMULATED)",
      category: GAME_CATEGORIES.SOCIAL_GAME,
      involvesMoneyStakeOrWinnings: false,
      socialGameDeclarationNote: "Non-monetary subscription entertainment passes only; zero stakes/winnings"
    });
    eligibility.reviewAndApprove({
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_SOCIAL_02",
      counselApproved: true,
      counselReference: "COUNSEL-MEMO-2026-SOC-02",
      founderContext: founderCtx
    });

    // 3. Prohibited Money Game Merchant (kept explicitly BLOCKED for demo proof)
    eligibility.declareMerchantProfile({
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_RMG_BLOCKED_99",
      legalName: "Royal Stakes India Pvt Ltd (SIMULATED - PROHIBITED RMG DEMO)",
      category: GAME_CATEGORIES.ONLINE_MONEY_GAME,
      involvesMoneyStakeOrWinnings: true
    });

    // Approved Commercial Agreements & Prepaid Credits
    agreements.createAgreement({
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_ESPORTS_01",
      merchantLegalName: "Apex Arena Esports League Pvt Ltd (SIMULATED)",
      contractVersion: "SIM-OPS-ESP-200BPS",
      billingMode: BILLING_MODES.PREPAID,
      commissionRate: 0.02,
      founderApproval: { isFounderApproved: true, activateImmediately: true, signedRef: "SIM-MSA-ESP-01" }
    });
    agreements.createAgreement({
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_SOCIAL_02",
      merchantLegalName: "Ludo Social Arcade Studio LLP (SIMULATED)",
      contractVersion: "SIM-OPS-SOC-200BPS",
      billingMode: BILLING_MODES.POSTPAID,
      commissionRate: 0.02,
      founderApproval: { isFounderApproved: true, activateImmediately: true, signedRef: "SIM-MSA-SOC-02" }
    });

    const topupBody = { tenantId: SIM_OPS_TENANT, merchantId: "SIM_GM_ESPORTS_01", purpose: RECEIPT_PURPOSES.FUEL_TANK_TOPUP, ref: "SIM-UTR-TOPUP-ESP", amount: 50000 };
    const topupSigned = signSimHmac(topupBody, SIM_FEED_SECRET);
    const topupRec = receiptRegistry.ingestAuthenticatedReceipt({
      rawFeedPayload: topupSigned.rawPayload,
      feedSignatureHeader: topupSigned.signatureHeader,
      feedSecretKey: SIM_FEED_SECRET,
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_ESPORTS_01",
      purpose: RECEIPT_PURPOSES.FUEL_TANK_TOPUP,
      bankTransactionRef: "SIM-UTR-TOPUP-ESP",
      payerCorporateAccount: "SIM-ICIC-CORP-ESP",
      amount: 50000,
      currency: "INR"
    });
    fuelTank.topUp("SIM_GM_ESPORTS_01", 50000, { tenantId: SIM_OPS_TENANT, invoiceRef: "SIM-FUEL-ESP-01", bankReceiptId: topupRec.bankReceiptId });

    // Seed 1 Checkout Intent + Settlement for Esports merchant
    const intent1 = await orchestration.createPaymentIntent({
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_ESPORTS_01",
      merchantLegalName: "Apex Arena Esports League Pvt Ltd (SIMULATED)",
      destinationBankIban: "SIM-IN-ICIC-000104998811",
      amount: 50000,
      currency: "INR",
      originCountry: "IN",
      destinationCountry: "IN",
      selectedRail: "RTGS"
    });
    await orchestration.provisionPaymentInstructions(intent1.id, SIM_OPS_TENANT);
    const ev = {
      paymentIntentId: intent1.id,
      providerTxId: "sim_utr_esp_50k",
      amount: 50000,
      currency: "INR",
      bankReference: "SIM-UTR-ESP-432891",
      settledAt: new Date().toISOString()
    };
    const signedEv = signSimHmac(ev, SIM_WEBHOOK_SECRET);
    await orchestration.handleBankWebhook("mock_sovereign_bank", {
      rawPayload: signedEv.rawPayload,
      signatureHeader: signedEv.signatureHeader,
      secretKey: SIM_WEBHOOK_SECRET,
      nonce: "sim_ops_init_nonce_1",
      eventPayload: ev
    });
    intent1.qrSourceType = "LOCAL_PREVIEW_QR";
    intent1.providerQrVerified = false;
    intent1.isLivePaymentReady = false;
    intent1.qrImageUrl = await QRCode.toDataURL(`upi://pay?pa=sim.esports@bank.sim&am=50000&cu=INR&tr=${encodeURIComponent(intent1.paymentReference)}&tn=${encodeURIComponent(intent1.paymentReference)}`, { width: 200, margin: 1 });

    // Seed Permitted ₹10k/Day Growth Campaign & Consent-Verified Conversion Events
    const cmp = growth.createCampaign({
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_ESPORTS_01",
      name: "Apex Esports Pass Launch Campaign (SIMULATED · PERMITTED)",
      dailyBudgetInr: 10000,
      managementFeeRate: 0.15
    });
    growth.recordAttributionEvent({
      tenantId: SIM_OPS_TENANT,
      campaignId: cmp.campaignId,
      channelId: "CREATOR_COMMUNITIES",
      consentRecorded: true,
      consentRef: "CONSENT-SIM-001",
      ipType: "RESIDENTIAL_MOBILE",
      requestsPerMinute: 2,
      stage: "VERIFIED_SETTLEMENT",
      paymentIntentId: intent1.id,
      verifiedSettlementRef: "SIM-UTR-ESP-432891",
      settledAmountInr: 50000,
      visitorSeed: "esports_fan_raipur_01"
    });
    growth.recordAttributionEvent({
      tenantId: SIM_OPS_TENANT,
      campaignId: cmp.campaignId,
      channelId: "APPROVED_SOCIAL_REELS",
      consentRecorded: true,
      consentRef: "CONSENT-SIM-002",
      ipType: "DATACENTER_PROXY",
      requestsPerMinute: 18,
      stage: "CLICK",
      visitorSeed: "bot_crawler_signal_02"
    });

    // Seed BSA Section 63 Evidence Case linked to transaction
    const evCase = evidence.createCase({
      tenantId: SIM_OPS_TENANT,
      merchantId: "SIM_GM_ESPORTS_01",
      complaintRef: "SIM-DISP-2026-104",
      authorityOrBank: "ICICI Bank Nodal Grievance Desk (SIMULATED)",
      paymentIntentId: intent1.id,
      vanIdentifier: intent1.van?.vanIdentifier || "SIM-VAN-01",
      bankUtr: "SIM-UTR-ESP-432891",
      disputedAmount: 50000,
      summary: "Simulated dispute verification inquiry preserved under BSA 2023 Section 63 workflow."
    });
    evidence.ingestSourceRecord({
      tenantId: SIM_OPS_TENANT,
      caseId: evCase.caseId,
      sourceType: "BANK_WEBHOOK_RAW",
      sourceSystem: "mock_sovereign_bank",
      originalRawPayload: signedEv.rawPayload
    });
    evidence.ingestSourceRecord({
      tenantId: SIM_OPS_TENANT,
      caseId: evCase.caseId,
      sourceType: "PAYMENT_INTENT_RECORD",
      sourceSystem: "FintechOrchestrationService",
      originalRawPayload: intent1
    });

    const ws = {
      sessionId,
      tenantId: SIM_OPS_TENANT,
      eligibility,
      evidence,
      growth,
      receiptRegistry,
      agreements,
      fuelTank,
      commissionProtection,
      orchestration
    };
    return ws;
  }

  async getWorkspace(sessionId = "default_sim_ops") {
    const key = String(sessionId || "default_sim_ops").slice(0, 64);
    if (!this.sessions.has(key)) {
      this.sessions.set(key, await this._createFreshWorkspace(key));
    }
    return this.sessions.get(key);
  }

  async resetWorkspace(sessionId = "default_sim_ops") {
    const key = String(sessionId || "default_sim_ops").slice(0, 64);
    const fresh = await this._createFreshWorkspace(key);
    this.sessions.set(key, fresh);
    return this.getSnapshot(key);
  }

  async getSnapshot(sessionId = "default_sim_ops") {
    const ws = await this.getWorkspace(sessionId);
    const declarations = ws.eligibility.listDeclarations(SIM_OPS_TENANT).map(tagSim);
    const intents = ws.orchestration.listPaymentIntents(SIM_OPS_TENANT).map(tagSim);
    const campaigns = ws.growth.listCampaigns(SIM_OPS_TENANT).map(tagSim);
    const attributionEvents = ws.growth.listAttributionEvents(SIM_OPS_TENANT).map(tagSim);
    const evidenceCases = ws.evidence.listCases(SIM_OPS_TENANT).map(tagSim);
    const taxConfig = tagSim(ws.eligibility.getActiveTaxConfig(SIM_OPS_TENANT));
    const fuelStatement = tagSim(ws.fuelTank.getLedgerStatement("SIM_GM_ESPORTS_01", SIM_OPS_TENANT));
    const dashboards = tagSim(
      ws.commissionProtection.getCommercialDashboards({
        tenantId: SIM_OPS_TENANT,
        merchantId: "SIM_GM_ESPORTS_01",
        orchestrationService: ws.orchestration,
        fuelTankService: ws.fuelTank
      })
    );

    return {
      environmentMode: "SIMULATED",
      isSimulated: true,
      sessionId: ws.sessionId,
      tenantId: SIM_OPS_TENANT,
      banner: "SIMULATED OPERATIONS TERMINAL — India Prohibited Online Money Games remain FAIL-CLOSED (403); zero real bank APIs active.",
      declarations,
      intents,
      campaigns,
      attributionEvents,
      evidenceCases,
      taxConfig,
      fuelStatement,
      dashboards
    };
  }
}

const defaultMerchantOpsSimService = new MerchantOpsSimulationService();

module.exports = {
  SIM_OPS_TENANT,
  SIM_WEBHOOK_SECRET,
  MerchantOpsSimulationService,
  defaultMerchantOpsSimService
};
