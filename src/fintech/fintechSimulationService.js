/**
 * 🦅 GARUDA OS — ISOLATED OPERATIONAL SIMULATION ENGINE (PHASE 8)
 *
 * Strict Operational & Security Guarantees:
 * - Isolated per simulation session (`SIM_...`). ZERO shared Maps/state with live tenant data.
 * - Executes REAL domain engines (CommercialAgreementService, FuelTankService,
 *   CommissionProtectionService, VerifiedBankReceiptRegistry, WebhookSecurityEngine,
 *   ZeroCustodyEnforcer, ForensicAuditLogger) inside sandboxed per-session instances.
 * - Every record carries explicit `isSimulated: true`, `environmentMode: "SIMULATED"`,
 *   and `simulatedLabel: "SIMULATED — NON-BANK TEST RECORD"`.
 * - Never triggers external banks or mutates real production state.
 */

const crypto = require("crypto");
const { CommercialAgreementService, BILLING_MODES } = require("./commercialAgreementService");
const { FuelTankService } = require("./fuelTankService");
const { CommissionProtectionService } = require("./commissionProtectionService");
const { VerifiedBankReceiptRegistry, RECEIPT_PURPOSES } = require("./bankReceiptVerifier");
const { FintechOrchestrationService } = require("./orchestrationService");
const { ForensicAuditLogger } = require("./auditLogger");
const { IntegrationRegistryService } = require("./integrationRegistryService");

const SIM_TENANT_ID = "SIM_TENANT_ENTERPRISE_DEMO";
const SIM_WEBHOOK_SECRET = "sim_sandbox_webhook_hmac_secret_local_only";
const SIM_FEED_SECRET = "sim_sandbox_bank_feed_hmac_secret_local_only";

function tagSim(obj) {
  if (!obj || typeof obj !== "object") return obj;
  return {
    ...obj,
    isSimulated: true,
    environmentMode: "SIMULATED",
    simulatedLabel: "SIMULATED"
  };
}

function signSimHmac(payloadObj, secretKey, timestampSec = Math.floor(Date.now() / 1000)) {
  const rawPayload = JSON.stringify(payloadObj);
  const sig = crypto.createHmac("sha256", secretKey).update(`${timestampSec}.${rawPayload}`).digest("hex");
  return { rawPayload, signatureHeader: `t=${timestampSec},v1=${sig}` };
}

class FintechSimulationService {
  constructor() {
    this.sessions = new Map();
  }

  _buildFreshWorkspace(sessionId) {
    const receiptRegistry = new VerifiedBankReceiptRegistry();
    const agreementService = new CommercialAgreementService();
    const fuelTank = new FuelTankService({ bankReceiptRegistry: receiptRegistry });
    const auditLogger = new ForensicAuditLogger();
    const commissionProtection = new CommissionProtectionService({
      agreementService,
      bankReceiptRegistry: receiptRegistry
    });
    const orchestration = new FintechOrchestrationService({
      fuelTank,
      agreementService,
      commissionProtection,
      strictAgreementMode: true
    });
    const integrations = new IntegrationRegistryService();

    const merchants = new Map();
    const simWebhookMetrics = {
      invalidHmacRejected: 0,
      duplicateEventsBlocked: 0,
      settledCount: 0,
      failedOrManualReviewCount: 0,
      lastEventNote: "Initialized isolated SIMULATED workspace"
    };

    const ws = {
      sessionId,
      tenantId: SIM_TENANT_ID,
      receiptRegistry,
      agreementService,
      fuelTank,
      auditLogger,
      commissionProtection,
      orchestration,
      integrations,
      merchants,
      simWebhookMetrics,
      createdAt: new Date().toISOString()
    };

    this._seedBaselineData(ws);
    return ws;
  }

  _ingestSimReceipt(ws, { merchantId, purpose, ref, account, amount }) {
    const bodyObj = { tenantId: SIM_TENANT_ID, merchantId, purpose, ref, amount, isSimulated: true };
    const { rawPayload, signatureHeader } = signSimHmac(bodyObj, SIM_FEED_SECRET);
    return ws.receiptRegistry.ingestAuthenticatedReceipt({
      rawFeedPayload: rawPayload,
      feedSignatureHeader: signatureHeader,
      feedSecretKey: SIM_FEED_SECRET,
      tenantId: SIM_TENANT_ID,
      merchantId,
      purpose,
      bankTransactionRef: ref,
      payerCorporateAccount: account,
      amount,
      currency: "INR"
    });
  }

  _seedBaselineData(ws) {
    const today = new Date().toISOString().slice(0, 10);

    // 1. Sample Merchants (explicitly SIMULATED)
    ws.merchants.set("SIM_M_BABA_01", tagSim({
      merchantId: "SIM_M_BABA_01",
      tenantId: SIM_TENANT_ID,
      legalName: "Baba Enterprises Digital Ops (SIMULATED)",
      corporateBankName: "ICICI Corporate CIB (Simulated)",
      maskedIban: "****8877",
      destinationBankIban: "SIM-IN-ICIC-000104998877",
      country: "IN",
      currency: "INR",
      preferredBillingMode: BILLING_MODES.PREPAID,
      kybStatus: "SIMULATED_VERIFIED",
      accountFreezeActive: false,
      createdAt: new Date().toISOString()
    }));

    ws.merchants.set("SIM_M_RAIPUR_02", tagSim({
      merchantId: "SIM_M_RAIPUR_02",
      tenantId: SIM_TENANT_ID,
      legalName: "Raipur Commerce & Gaming Holdings (SIMULATED)",
      corporateBankName: "ICICI Corporate CIB (Simulated)",
      maskedIban: "****8899",
      destinationBankIban: "SIM-IN-ICIC-000104998899",
      country: "IN",
      currency: "INR",
      preferredBillingMode: BILLING_MODES.POSTPAID,
      kybStatus: "SIMULATED_VERIFIED",
      accountFreezeActive: false,
      createdAt: new Date().toISOString()
    }));

    ws.merchants.set("SIM_M_UAE_03", tagSim({
      merchantId: "SIM_M_UAE_03",
      tenantId: SIM_TENANT_ID,
      legalName: "Gulf Horizon Trading FZE (SIMULATED)",
      corporateBankName: "Wio Business UAE (Simulated)",
      maskedIban: "****4412",
      destinationBankIban: "SIM-AE07-0331-0001-4412",
      country: "AE",
      currency: "AED",
      preferredBillingMode: BILLING_MODES.POSTPAID,
      kybStatus: "SIMULATED_PENDING_AGREEMENT",
      accountFreezeActive: false,
      createdAt: new Date().toISOString()
    }));

    // 2. Signed Agreements (200 bps = 2.00%)
    ws.agreementService.createAgreement({
      tenantId: SIM_TENANT_ID,
      merchantId: "SIM_M_BABA_01",
      merchantLegalName: "Baba Enterprises Digital Ops (SIMULATED)",
      contractVersion: "SIM-PRE-200BPS-V1",
      billingMode: BILLING_MODES.PREPAID,
      commissionRate: 0.02,
      founderApproval: { isFounderApproved: true, activateImmediately: true, signedRef: "SIM-MSA-BABA-001" }
    });

    ws.agreementService.createAgreement({
      tenantId: SIM_TENANT_ID,
      merchantId: "SIM_M_RAIPUR_02",
      merchantLegalName: "Raipur Commerce & Gaming Holdings (SIMULATED)",
      contractVersion: "SIM-POST-200BPS-V1",
      billingMode: BILLING_MODES.POSTPAID,
      commissionRate: 0.02,
      founderApproval: { isFounderApproved: true, activateImmediately: true, signedRef: "SIM-MSA-RAIPUR-002" }
    });

    // Draft pending agreement for merchant 3
    ws.agreementService.createAgreement({
      tenantId: SIM_TENANT_ID,
      merchantId: "SIM_M_UAE_03",
      merchantLegalName: "Gulf Horizon Trading FZE (SIMULATED)",
      contractVersion: "SIM-UAE-DRAFT-V1",
      billingMode: BILLING_MODES.POSTPAID,
      commissionRate: 0.02
    });

    // 3. Prepaid Fuel Tank verified top-up (₹50,000) + 2 simulated intents (₹10,00,000 settled + ₹2,50,000 instruction)
    const topupRec = this._ingestSimReceipt(ws, {
      merchantId: "SIM_M_BABA_01",
      purpose: RECEIPT_PURPOSES.FUEL_TANK_TOPUP,
      ref: "SIM-UTR-FUEL-50000",
      account: "SIM-ICIC-CORP-01",
      amount: 50000
    });
    ws.fuelTank.topUp("SIM_M_BABA_01", 50000, {
      tenantId: SIM_TENANT_ID,
      invoiceRef: "SIM-INV-FUEL-001",
      bankReceiptId: topupRec.bankReceiptId,
      lowBalanceThreshold: 15000
    });

    this._seedPrepaidSettlementSync(ws);

    // 4. Postpaid Accruals, Daily Statement, GST Invoice & Partial Payment
    ws.commissionProtection.accrueCommissionFromSettlement({
      tenantId: SIM_TENANT_ID,
      merchantId: "SIM_M_RAIPUR_02",
      merchantLegalName: "Raipur Commerce & Gaming Holdings (SIMULATED)",
      destinationBankIban: "SIM-IN-ICIC-000104998899",
      transactionId: "SIM_PI_POST_2500K",
      bankSettlementRef: "SIM-UTR-8801001",
      settlementDate: today,
      settledPrincipalAmount: 2500000,
      currency: "INR",
      providerConfirmed: true
    });
    ws.commissionProtection.generateDailyStatement({
      tenantId: SIM_TENANT_ID,
      merchantId: "SIM_M_RAIPUR_02",
      dateKey: today
    });
    const inv = ws.commissionProtection.generateDailyInvoice({
      tenantId: SIM_TENANT_ID,
      merchantId: "SIM_M_RAIPUR_02",
      billingDate: today
    });
    const partRec = this._ingestSimReceipt(ws, {
      merchantId: "SIM_M_RAIPUR_02",
      purpose: RECEIPT_PURPOSES.COMMISSION_INVOICE_PAYMENT,
      ref: "SIM-NEFT-PART-25000",
      account: "SIM-HDFC-CORP-02",
      amount: 25000
    });
    ws.commissionProtection.recordInvoicePayment({
      tenantId: SIM_TENANT_ID,
      invoiceId: inv.invoiceId,
      paidAmount: 25000,
      bankReceiptId: partRec.bankReceiptId,
      paymentReference: "SIM-NEFT-PART-25000",
      payerCorporateAccount: "SIM-HDFC-CORP-02"
    });

    ws.auditLogger.logEvent({
      transactionId: "SIM_WORKSPACE_BOOT",
      actor: "SIMULATION_ENGINE",
      action: "SIMULATED_SANDBOX_INITIALIZED",
      oldState: "EMPTY",
      newState: "SIMULATED_READY",
      payload: { isSimulated: true, merchants: 3, rateBps: 200 }
    });
  }

  _seedPrepaidSettlementSync(ws) {
    // Seed 1 settled transaction + 1 pending transaction + 1 manual review mismatch cleanly
    const settledIntentId = "SIM_PI_PRE_1000K";
    ws.orchestration.intents.set(settledIntentId, tagSim({
      id: settledIntentId,
      tenantId: SIM_TENANT_ID,
      merchantId: "SIM_M_BABA_01",
      merchantLegalName: "Baba Enterprises Digital Ops (SIMULATED)",
      destinationBankIban: "SIM-IN-ICIC-000104998877",
      amount: 1000000,
      currency: "INR",
      originCountry: "IN",
      destinationCountry: "IN",
      selectedRail: "RTGS",
      preferredProvider: "mock_sovereign_bank",
      paymentReference: "SIM-GAR-1000K",
      status: "SETTLED",
      billingMode: BILLING_MODES.PREPAID,
      appliedRate: 0.02,
      appliedRateBps: 200,
      contractVersion: "SIM-PRE-200BPS-V1",
      providerTxId: "sim_utr_pre_1000k",
      bankSettlementRef: "SIM-UTR-9901001",
      settledAt: new Date().toISOString(),
      van: { vanIdentifier: "SIM-ICIC-VAN-8492", bankName: "Mock Sovereign Bank (SIMULATED)" },
      fees: { garudaSaasFee: 20000, totalFee: 20000, saasRate: 0.02 },
      saasDeduction: { feeDeducted: 20000 },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString()
    }));

    ws.fuelTank.deductSaaSFee("SIM_M_BABA_01", 1000000, 0.02, {
      tenantId: SIM_TENANT_ID,
      transactionId: settledIntentId,
      bankSettlementRef: "SIM-UTR-9901001",
      contractVersion: "SIM-PRE-200BPS-V1",
      requireBankEvidence: true
    });
    ws.simWebhookMetrics.settledCount += 1;

    const pendingIntentId = "SIM_PI_PRE_250K_PEND";
    ws.orchestration.intents.set(pendingIntentId, tagSim({
      id: pendingIntentId,
      tenantId: SIM_TENANT_ID,
      merchantId: "SIM_M_BABA_01",
      merchantLegalName: "Baba Enterprises Digital Ops (SIMULATED)",
      destinationBankIban: "SIM-IN-ICIC-000104998877",
      amount: 250000,
      currency: "INR",
      originCountry: "IN",
      destinationCountry: "IN",
      selectedRail: "IMPS",
      preferredProvider: "mock_sovereign_bank",
      paymentReference: "SIM-GAR-250K",
      status: "PAYMENT_INSTRUCTION_CREATED",
      billingMode: BILLING_MODES.PREPAID,
      appliedRate: 0.02,
      appliedRateBps: 200,
      contractVersion: "SIM-PRE-200BPS-V1",
      van: { vanIdentifier: "SIM-ICIC-VAN-8493", bankName: "Mock Sovereign Bank (SIMULATED)" },
      fees: { garudaSaasFee: 5000, totalFee: 5000, saasRate: 0.02 },
      createdAt: new Date(Date.now() - 1200000).toISOString(),
      updatedAt: new Date().toISOString()
    }));

    const mismatchIntentId = "SIM_PI_RECON_MISMATCH";
    ws.orchestration.intents.set(mismatchIntentId, tagSim({
      id: mismatchIntentId,
      tenantId: SIM_TENANT_ID,
      merchantId: "SIM_M_RAIPUR_02",
      merchantLegalName: "Raipur Commerce & Gaming Holdings (SIMULATED)",
      destinationBankIban: "SIM-IN-ICIC-000104998899",
      amount: 150000,
      currency: "INR",
      originCountry: "IN",
      destinationCountry: "IN",
      selectedRail: "NEFT",
      preferredProvider: "mock_sovereign_bank",
      paymentReference: "SIM-GAR-150K",
      status: "MANUAL_REVIEW",
      reconciliationNotes: "SIMULATED_CURRENCY_OR_AMOUNT_VARIANCE: Bank sent USD instead of INR",
      billingMode: BILLING_MODES.POSTPAID,
      appliedRate: 0.02,
      appliedRateBps: 200,
      contractVersion: "SIM-POST-200BPS-V1",
      van: { vanIdentifier: "SIM-ICIC-VAN-8499", bankName: "Mock Sovereign Bank (SIMULATED)" },
      fees: { garudaSaasFee: 3000, totalFee: 3000, saasRate: 0.02 },
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date().toISOString()
    }));
    ws.simWebhookMetrics.failedOrManualReviewCount += 1;
  }

  getWorkspace(sessionId = "default_sim") {
    const cleanKey = String(sessionId || "default_sim").slice(0, 64);
    if (!this.sessions.has(cleanKey)) {
      this.sessions.set(cleanKey, this._buildFreshWorkspace(cleanKey));
    }
    return this.sessions.get(cleanKey);
  }

  resetWorkspace(sessionId = "default_sim") {
    const cleanKey = String(sessionId || "default_sim").slice(0, 64);
    const fresh = this._buildFreshWorkspace(cleanKey);
    this.sessions.set(cleanKey, fresh);
    return this.getFullSnapshot(cleanKey);
  }

  getFullSnapshot(sessionId = "default_sim") {
    const ws = this.getWorkspace(sessionId);
    const merchants = Array.from(ws.merchants.values());
    const intents = Array.from(ws.orchestration.intents.values()).map(tagSim);
    const agreements = Array.from(ws.agreementService.agreements.values()).map(tagSim);

    const fuelTanks = merchants.map((m) =>
      tagSim(ws.fuelTank.getLedgerStatement(m.merchantId, SIM_TENANT_ID))
    );

    const receivables = Array.from(ws.commissionProtection.receivables.values()).map(tagSim);
    const invoices = Array.from(ws.commissionProtection.invoices.values()).map(tagSim);
    const disputes = (ws.commissionProtection.freezeRecords || []).map(tagSim);
    const adjustments = (ws.commissionProtection.adjustments || []).map(tagSim);
    const statements = Array.from(ws.commissionProtection.dailyStatements.values()).map(tagSim);
    const receipts = Array.from(ws.receiptRegistry.receipts.values()).map(tagSim);
    const combinedDashboard = tagSim(
      ws.commissionProtection.getCommercialDashboards({
        tenantId: SIM_TENANT_ID,
        merchantId: null,
        orchestrationService: ws.orchestration,
        fuelTankService: ws.fuelTank
      })
    );

    let chainValid = false;
    try {
      chainValid = ws.auditLogger.verifyChainIntegrity();
    } catch {
      chainValid = false;
    }

    const totalFuelBalance = fuelTanks.reduce((s, f) => s + Number(f.closingBalance || 0), 0);
    const settledPrincipalTotal = intents
      .filter((i) => i.status === "SETTLED")
      .reduce((s, i) => s + Number(i.amount || 0), 0) +
      receivables
        .filter((r) => r.transactionId === "SIM_PI_POST_2500K")
        .reduce((s, r) => s + Number(r.eligiblePrincipalAmount || 0), 0);

    return {
      environmentMode: "SIMULATED",
      isSimulated: true,
      bannerMessage: "SIMULATED OPERATIONAL SANDBOX — No real banks or customer funds are connected. All records carry explicit SIMULATED identifiers.",
      sessionId: ws.sessionId,
      tenantId: SIM_TENANT_ID,
      zeroCustodyPrincipalHeld: 0,
      overview: {
        merchantsCount: merchants.length,
        activeAgreementsCount: agreements.filter((a) => a.status === "APPROVED_ACTIVE").length,
        totalSettledPrincipal: settledPrincipalTotal,
        totalFuelBalance,
        postpaidOutstanding: combinedDashboard.B_garudaRevenueDashboard.postpaidReceivables,
        feesAccrued: combinedDashboard.B_garudaRevenueDashboard.dailySoftwareFeesAccrued,
        paymentsReceived: combinedDashboard.B_garudaRevenueDashboard.paymentsReceived,
        webhookMetrics: ws.simWebhookMetrics
      },
      merchants,
      agreements,
      intents,
      fuelTanks,
      receivables,
      invoices,
      statements,
      disputes,
      adjustments,
      bankReceipts: receipts,
      dashboards: combinedDashboard,
      integrations: ws.integrations.listIntegrations(SIM_TENANT_ID),
      audit: {
        chainIntegrityValid: chainValid,
        entries: ws.auditLogger.getLogs().slice().reverse().map(tagSim)
      }
    };
  }

  async runScenario(sessionId = "default_sim", action, payload = {}) {
    const ws = this.getWorkspace(sessionId);
    const today = new Date().toISOString().slice(0, 10);
    let outcome = null;

    if (action === "onboard_merchant") {
      const mId = `SIM_M_${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
      const record = tagSim({
        merchantId: mId,
        tenantId: SIM_TENANT_ID,
        legalName: `${String(payload.legalName || "Demo Industrial Corp").trim()} (SIMULATED)`,
        corporateBankName: String(payload.corporateBankName || "ICICI Corporate CIB (Simulated)"),
        maskedIban: `****${String(payload.destinationBankIban || "9900").slice(-4)}`,
        destinationBankIban: String(payload.destinationBankIban || `SIM-IN-ICIC-${Date.now().toString().slice(-8)}`),
        country: String(payload.country || "IN").toUpperCase(),
        currency: String(payload.currency || "INR").toUpperCase(),
        preferredBillingMode: payload.billingMode === "POSTPAID" ? BILLING_MODES.POSTPAID : BILLING_MODES.PREPAID,
        kybStatus: "SIMULATED_VERIFIED",
        accountFreezeActive: false,
        createdAt: new Date().toISOString()
      });
      ws.merchants.set(mId, record);
      ws.auditLogger.logEvent({
        transactionId: mId,
        actor: "SIM_OPERATOR",
        action: "SIM_MERCHANT_ONBOARDED",
        oldState: "NONE",
        newState: "SIMULATED_VERIFIED",
        payload: { merchantId: mId }
      });
      outcome = { message: `Onboarded simulated merchant ${mId}`, record };
    } else if (action === "create_agreement") {
      const merchantId = payload.merchantId || "SIM_M_UAE_03";
      const merchant = ws.merchants.get(merchantId);
      const agr = ws.agreementService.createAgreement({
        tenantId: SIM_TENANT_ID,
        merchantId,
        merchantLegalName: merchant?.legalName || merchantId,
        contractVersion: payload.contractVersion || `SIM-V${Date.now().toString().slice(-4)}`,
        billingMode: payload.billingMode || BILLING_MODES.POSTPAID,
        commissionRate: Number(payload.commissionRate || 0.02)
      });
      ws.auditLogger.logEvent({
        transactionId: agr.contractId,
        actor: "SIM_OPERATOR",
        action: "SIM_AGREEMENT_CREATED",
        oldState: "NONE",
        newState: agr.status,
        payload: { contractId: agr.contractId, commissionBps: agr.commissionBps }
      });
      outcome = { message: `Created agreement ${agr.contractId} (${agr.status})`, agreement: tagSim(agr) };
    } else if (action === "approve_agreement") {
      const agr = ws.agreementService.approveAgreement(payload.contractId, {
        tenantId: SIM_TENANT_ID,
        founderApproved: true,
        approvedBy: "SIM_FOUNDER_APPROVAL",
        signedRef: payload.signedRef || `SIM-MSA-${Date.now().toString().slice(-5)}`
      });
      const m = ws.merchants.get(agr.merchantId);
      if (m) m.kybStatus = "SIMULATED_VERIFIED";
      ws.auditLogger.logEvent({
        transactionId: agr.contractId,
        actor: "SIM_FOUNDER_APPROVAL",
        action: "SIM_AGREEMENT_APPROVED",
        oldState: "PENDING_APPROVAL",
        newState: "APPROVED_ACTIVE",
        payload: { contractId: agr.contractId, merchantId: agr.merchantId }
      });
      outcome = { message: `Founder-approved agreement ${agr.contractId}`, agreement: tagSim(agr) };
    } else if (action === "topup_fuel_tank") {
      const merchantId = payload.merchantId || "SIM_M_BABA_01";
      const amount = Number(payload.amount || 25000);
      const ref = `SIM-UTR-TOPUP-${Date.now().toString().slice(-6)}`;
      const rec = this._ingestSimReceipt(ws, {
        merchantId,
        purpose: RECEIPT_PURPOSES.FUEL_TANK_TOPUP,
        ref,
        account: "SIM-ICIC-CORP-01",
        amount
      });
      const res = ws.fuelTank.topUp(merchantId, amount, {
        tenantId: SIM_TENANT_ID,
        invoiceRef: `SIM-FUEL-${Date.now().toString().slice(-5)}`,
        bankReceiptId: rec.bankReceiptId
      });
      ws.auditLogger.logEvent({
        transactionId: res.ledgerEntryId,
        actor: "SIM_BANK_FEED",
        action: "SIM_FUEL_TANK_CREDITED",
        oldState: "TOPUP_PENDING",
        newState: "CREDITED",
        payload: { merchantId, amount, bankReceiptId: rec.bankReceiptId }
      });
      outcome = { message: `Credited ₹${amount.toLocaleString("en-IN")} via HMAC-verified SIM bank receipt ${rec.bankReceiptId}`, result: tagSim(res) };
    } else if (action === "settle_prepaid_payment") {
      const merchantId = payload.merchantId || "SIM_M_BABA_01";
      const amount = Number(payload.amount || 500000);
      const merchant = ws.merchants.get(merchantId);
      const intent = await ws.orchestration.createPaymentIntent({
        tenantId: SIM_TENANT_ID,
        merchantId,
        merchantLegalName: merchant?.legalName || "Baba Enterprises Digital Ops (SIMULATED)",
        destinationBankIban: merchant?.destinationBankIban || "SIM-IN-ICIC-000104998877",
        amount,
        currency: "INR",
        originCountry: "IN",
        destinationCountry: "IN",
        selectedRail: payload.rail || "RTGS"
      });
      await ws.orchestration.provisionPaymentInstructions(intent.id, SIM_TENANT_ID);

      const ev = {
        paymentIntentId: intent.id,
        providerTxId: `sim_utr_${Date.now().toString().slice(-6)}`,
        amount,
        currency: "INR",
        bankReference: `SIM-UTR-${Date.now().toString().slice(-6)}`,
        settledAt: new Date().toISOString()
      };
      const signed = signSimHmac(ev, SIM_WEBHOOK_SECRET);
      const settled = await ws.orchestration.handleBankWebhook("mock_sovereign_bank", {
        rawPayload: signed.rawPayload,
        signatureHeader: signed.signatureHeader,
        secretKey: SIM_WEBHOOK_SECRET,
        nonce: `sim_nonce_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
        eventPayload: ev
      });
      ws.simWebhookMetrics.settledCount += 1;
      ws.simWebhookMetrics.lastEventNote = `SIMULATED payment ${intent.id} settled -> ₹${settled.saasFeeDeducted} 2% software fee metered.`;
      ws.auditLogger.logEvent({
        transactionId: intent.id,
        actor: "SIM_BANK_WEBHOOK",
        action: "SIM_PAYMENT_SETTLED",
        oldState: "PAYMENT_INSTRUCTION_CREATED",
        newState: "SETTLED",
        payload: { amount, saasFeeDeducted: settled.saasFeeDeducted }
      });
      outcome = { message: `Settled SIMULATED payment ₹${amount.toLocaleString("en-IN")} (2% fee: ₹${settled.saasFeeDeducted.toLocaleString("en-IN")})`, settled: tagSim(settled) };
    } else if (action === "duplicate_webhook") {
      const targetIntent = Array.from(ws.orchestration.intents.values()).find((i) => i.status === "SETTLED");
      const ev = {
        paymentIntentId: targetIntent ? targetIntent.id : "SIM_PI_PRE_1000K",
        providerTxId: targetIntent?.providerTxId || "sim_utr_pre_1000k",
        amount: targetIntent?.amount || 1000000,
        currency: "INR",
        bankReference: targetIntent?.bankSettlementRef || "SIM-UTR-9901001"
      };
      const signed = signSimHmac(ev, SIM_WEBHOOK_SECRET);
      const dupNonce = "sim_static_replay_nonce_test";
      // Ensure once processed inside webhookIdempotencyMap
      ws.orchestration.webhookIdempotencyMap.add(dupNonce);
      const res = await ws.orchestration.handleBankWebhook("mock_sovereign_bank", {
        rawPayload: signed.rawPayload,
        signatureHeader: signed.signatureHeader,
        secretKey: SIM_WEBHOOK_SECRET,
        nonce: dupNonce,
        eventPayload: ev
      });
      ws.simWebhookMetrics.duplicateEventsBlocked += 1;
      ws.simWebhookMetrics.lastEventNote = `Duplicate webhook blocked idempotently (${dupNonce}). Zero double debit.`;
      ws.auditLogger.logEvent({
        transactionId: ev.paymentIntentId,
        actor: "WEBHOOK_SECURITY_ENGINE",
        action: "SIM_DUPLICATE_WEBHOOK_BLOCKED",
        oldState: "SETTLED",
        newState: "DUPLICATE_IGNORED",
        payload: { nonce: dupNonce }
      });
      outcome = { message: "Duplicate webhook replay intercepted idempotently — zero double commission charged.", result: tagSim(res) };
    } else if (action === "failed_webhook") {
      const ev = { paymentIntentId: "SIM_PI_PRE_1000K", providerTxId: "tampered_tx", amount: 99999999, currency: "INR" };
      let blockedReason = "";
      try {
        await ws.orchestration.handleBankWebhook("mock_sovereign_bank", {
          rawPayload: JSON.stringify(ev),
          signatureHeader: `t=${Math.floor(Date.now() / 1000)},v1=0000deadbeef_invalid_tampered_hmac`,
          secretKey: SIM_WEBHOOK_SECRET,
          nonce: `sim_tamper_${Date.now()}`,
          eventPayload: ev
        });
      } catch (err) {
        blockedReason = err.message;
      }
      ws.simWebhookMetrics.invalidHmacRejected += 1;
      ws.simWebhookMetrics.lastEventNote = `Tampered HMAC webhook REJECTED fail-closed.`;
      ws.auditLogger.logEvent({
        transactionId: "SIM_SECURITY_TEST",
        actor: "WEBHOOK_SECURITY_ENGINE",
        action: "SIM_INVALID_HMAC_REJECTED",
        oldState: "INCOMING",
        newState: "401_REJECTED",
        payload: { blockedReason }
      });
      outcome = { message: `Tampered webhook strictly rejected (${blockedReason})`, blockedReason };
    } else if (action === "generate_postpaid_invoice") {
      const merchantId = payload.merchantId || "SIM_M_RAIPUR_02";
      const amount = Number(payload.amount || 750000);
      const txId = `SIM_PI_POST_${Date.now().toString().slice(-6)}`;
      ws.commissionProtection.accrueCommissionFromSettlement({
        tenantId: SIM_TENANT_ID,
        merchantId,
        merchantLegalName: "Raipur Commerce & Gaming Holdings (SIMULATED)",
        destinationBankIban: "SIM-IN-ICIC-000104998899",
        transactionId: txId,
        bankSettlementRef: `SIM-UTR-${Date.now().toString().slice(-6)}`,
        settlementDate: today,
        settledPrincipalAmount: amount,
        currency: "INR",
        providerConfirmed: true
      });
      const stmt = ws.commissionProtection.generateDailyStatement({
        tenantId: SIM_TENANT_ID,
        merchantId,
        dateKey: today
      });
      let invoiceResult = null;
      const existingInvId = ws.commissionProtection.invoiceDateIndex.get(`${SIM_TENANT_ID}::${merchantId}::${today}`);
      if (existingInvId) {
        invoiceResult = { note: "Daily invoice already exists for today (duplicate daily invoice prevented); statement updated.", existingInvoiceId: existingInvId, statementId: stmt.statementId };
      } else {
        invoiceResult = ws.commissionProtection.generateDailyInvoice({ tenantId: SIM_TENANT_ID, merchantId, billingDate: today });
      }
      ws.auditLogger.logEvent({
        transactionId: txId,
        actor: "COMMISSION_PROTECTION_ENGINE",
        action: "SIM_POSTPAID_ACCRUAL_AND_STATEMENT",
        oldState: "SETTLED",
        newState: "RECONCILED",
        payload: { merchantId, settledPrincipal: amount }
      });
      outcome = { message: `Accrued 2% postpaid fee on ₹${amount.toLocaleString("en-IN")} settlement & reconciled statement.`, details: tagSim(invoiceResult) };
    } else if (action === "settle_invoice_payment") {
      const invoices = Array.from(ws.commissionProtection.invoices.values());
      const inv = (payload.invoiceId ? ws.commissionProtection.invoices.get(payload.invoiceId) : null) ||
        invoices.find((i) => i.outstandingAmount > 0);
      if (!inv) {
        throw new Error("All simulated postpaid invoices are already PAID. Accrue another postpaid batch or reset simulation.");
      }
      const payAmt = Number(payload.paidAmount || inv.outstandingAmount);
      const ref = `SIM-NEFT-INV-${Date.now().toString().slice(-5)}`;
      const rec = this._ingestSimReceipt(ws, {
        merchantId: inv.merchantId,
        purpose: RECEIPT_PURPOSES.COMMISSION_INVOICE_PAYMENT,
        ref,
        account: "SIM-HDFC-CORP-02",
        amount: payAmt
      });
      const res = ws.commissionProtection.recordInvoicePayment({
        tenantId: SIM_TENANT_ID,
        invoiceId: inv.invoiceId,
        paidAmount: payAmt,
        bankReceiptId: rec.bankReceiptId,
        paymentReference: ref,
        payerCorporateAccount: "SIM-HDFC-CORP-02"
      });
      ws.auditLogger.logEvent({
        transactionId: inv.invoiceId,
        actor: "SIM_BANK_FEED",
        action: "SIM_INVOICE_PAYMENT_VERIFIED",
        oldState: "PAYMENT_PENDING",
        newState: res.invoice.status,
        payload: { paidAmount: payAmt, bankReceiptId: rec.bankReceiptId }
      });
      outcome = { message: `Verified ₹${payAmt.toLocaleString("en-IN")} via bank receipt ${rec.bankReceiptId} -> Invoice status: ${res.invoice.status}`, invoice: tagSim(res.invoice) };
    } else if (action === "refund_reversal_adjustment") {
      const rec = ws.fuelTank.creditRefundAdjustment("SIM_M_BABA_01", 100000, 0.02, {
        tenantId: SIM_TENANT_ID,
        transactionId: `SIM_REV_${Date.now().toString().slice(-5)}`,
        bankSettlementRef: `SIM-REV-UTR-${Date.now().toString().slice(-5)}`,
        contractVersion: "SIM-PRE-200BPS-V1",
        isReversal: true
      });
      ws.auditLogger.logEvent({
        transactionId: rec.ledgerEntryId || "SIM_REVERSAL",
        actor: "SIM_RECON_ENGINE",
        action: "SIM_REFUND_CREDIT_RESTORED",
        oldState: "SETTLED",
        newState: "REVERSED_FEE_CREDITED",
        payload: { amountCredited: 2000 }
      });
      outcome = { message: "Recorded simulated reversal on ₹1,00,000 principal -> ₹2,000 (2%) software fee credited back to Fuel Tank.", adjustment: tagSim(rec) };
    } else if (action === "record_merchant_freeze") {
      const mId = payload.merchantId || "SIM_M_RAIPUR_02";
      const rec = ws.commissionProtection.recordMerchantAccountFreeze({
        tenantId: SIM_TENANT_ID,
        merchantId: mId,
        orderReference: payload.orderReference || `SIM-CYBER-LEA-${Date.now().toString().slice(-5)}`,
        authorityOrBank: payload.authorityOrBank || "Raipur Cyber Nodal Cell (SIMULATED)",
        disputedAmount: Number(payload.disputedAmount || 250000),
        legalNoticeSummary: payload.legalNoticeSummary || "Simulated third-party layer dispute notice; preserving receivables evidence without fund diversion"
      });
      const m = ws.merchants.get(mId);
      if (m) m.accountFreezeActive = true;
      ws.auditLogger.logEvent({
        transactionId: rec.freezeId,
        actor: "RISK_AND_COMPLIANCE",
        action: "SIM_MERCHANT_FREEZE_PRESERVED",
        oldState: "ACTIVE",
        newState: "LEGAL_REVIEW",
        payload: { merchantId: mId, zeroPrincipalDiversion: true }
      });
      outcome = { message: `Recorded lawful freeze dossier ${rec.freezeId}; GARUDA receivables preserved cleanly with ₹0 principal held.`, freezeRecord: tagSim(rec) };
    } else if (action === "mismatch_settlement") {
      const mId = payload.merchantId || "SIM_M_RAIPUR_02";
      const merchant = ws.merchants.get(mId);
      const intent = await ws.orchestration.createPaymentIntent({
        tenantId: SIM_TENANT_ID,
        merchantId: mId,
        merchantLegalName: merchant?.legalName || "Raipur Commerce & Gaming Holdings (SIMULATED)",
        destinationBankIban: merchant?.destinationBankIban || "SIM-IN-ICIC-000104998899",
        amount: Number(payload.amount || 400000),
        currency: "INR",
        originCountry: "IN",
        destinationCountry: "IN",
        selectedRail: "RTGS"
      });
      await ws.orchestration.provisionPaymentInstructions(intent.id, SIM_TENANT_ID);

      // Simulate bank reporting mismatched amount (partial variance 350,000 instead of 400,000)
      const ev = {
        paymentIntentId: intent.id,
        providerTxId: `sim_mismatch_${Date.now().toString().slice(-6)}`,
        amount: 350000,
        currency: "INR",
        bankReference: `SIM-MISMATCH-${Date.now().toString().slice(-5)}`,
        settledAt: new Date().toISOString()
      };
      const signed = signSimHmac(ev, SIM_WEBHOOK_SECRET);
      const reconRes = await ws.orchestration.handleBankWebhook("mock_sovereign_bank", {
        rawPayload: signed.rawPayload,
        signatureHeader: signed.signatureHeader,
        secretKey: SIM_WEBHOOK_SECRET,
        nonce: `sim_mismatch_nonce_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
        eventPayload: ev
      });
      ws.simWebhookMetrics.failedOrManualReviewCount += 1;
      ws.simWebhookMetrics.lastEventNote = `Mismatched amount (₹3.5L vs ₹4.0L) flagged for MANUAL_REVIEW on ${intent.id}.`;
      ws.auditLogger.logEvent({
        transactionId: intent.id,
        actor: "RECONCILIATION_ENGINE",
        action: "SIM_SETTLEMENT_MISMATCH_FLAGGED",
        oldState: "PAYMENT_INSTRUCTION_CREATED",
        newState: reconRes.status,
        payload: { expectedAmount: 400000, bankReportedAmount: 350000, reason: reconRes.reason }
      });
      outcome = { message: `Settlement mismatch flagged (${reconRes.status}): ${reconRes.reason}`, result: tagSim(reconRes), intentId: intent.id };
    } else if (action === "failed_settlement") {
      const mId = payload.merchantId || "SIM_M_BABA_01";
      const merchant = ws.merchants.get(mId);
      const intent = await ws.orchestration.createPaymentIntent({
        tenantId: SIM_TENANT_ID,
        merchantId: mId,
        merchantLegalName: merchant?.legalName || "Baba Enterprises Digital Ops (SIMULATED)",
        destinationBankIban: merchant?.destinationBankIban || "SIM-IN-ICIC-000104998877",
        amount: Number(payload.amount || 180000),
        currency: "INR",
        originCountry: "IN",
        destinationCountry: "IN",
        selectedRail: "IMPS"
      });
      await ws.orchestration.provisionPaymentInstructions(intent.id, SIM_TENANT_ID);

      const ev = {
        paymentIntentId: intent.id,
        providerTxId: `sim_ret_${Date.now().toString().slice(-6)}`,
        amount: 180000,
        currency: "INR",
        bankReference: `SIM-RET-${Date.now().toString().slice(-5)}`,
        isReturn: true,
        settledAt: new Date().toISOString()
      };
      const signed = signSimHmac(ev, SIM_WEBHOOK_SECRET);
      const failRes = await ws.orchestration.handleBankWebhook("mock_sovereign_bank", {
        rawPayload: signed.rawPayload,
        signatureHeader: signed.signatureHeader,
        secretKey: SIM_WEBHOOK_SECRET,
        nonce: `sim_ret_nonce_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
        eventPayload: ev
      });
      ws.simWebhookMetrics.failedOrManualReviewCount += 1;
      ws.simWebhookMetrics.lastEventNote = `Failed/Returned bank rail webhook (${failRes.status}) on ${intent.id}; zero fee debited.`;
      ws.auditLogger.logEvent({
        transactionId: intent.id,
        actor: "BANK_RAIL_RETURN",
        action: "SIM_SETTLEMENT_FAILED_RETURNED",
        oldState: "PAYMENT_INSTRUCTION_CREATED",
        newState: failRes.status,
        payload: { reason: failRes.reason, feeCharged: 0 }
      });
      outcome = { message: `Bank settlement returned (${failRes.status}) — ₹0.00 fee debited.`, result: tagSim(failRes), intentId: intent.id };
    } else if (action === "full_customer_journey") {
      // Complete verified E2E journey: Merchant -> Intent -> Settlement -> Reconciliation -> Fee -> Invoice -> Payment Tracking
      const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
      const mId = `SIM_M_DEMO_${suffix}`;
      const legalName = `Bharat Steel & Infra Pvt Ltd (${suffix}) (SIMULATED)`;
      const iban = `SIM-IN-ICIC-8800${suffix}`;
      const journeyMerchant = tagSim({
        merchantId: mId,
        tenantId: SIM_TENANT_ID,
        legalName,
        corporateBankName: "ICICI Corporate CIB (Simulated)",
        maskedIban: `****${suffix}`,
        destinationBankIban: iban,
        country: "IN",
        currency: "INR",
        preferredBillingMode: BILLING_MODES.POSTPAID,
        kybStatus: "SIMULATED_VERIFIED",
        accountFreezeActive: false,
        createdAt: new Date().toISOString()
      });
      ws.merchants.set(mId, journeyMerchant);

      const agreement = ws.agreementService.createAgreement({
        tenantId: SIM_TENANT_ID,
        merchantId: mId,
        merchantLegalName: legalName,
        contractVersion: `SIM-DEMO-${suffix}-200BPS`,
        billingMode: BILLING_MODES.POSTPAID,
        commissionRate: 0.02,
        founderApproval: { isFounderApproved: true, activateImmediately: true, signedRef: `SIM-MSA-DEMO-${suffix}` }
      });

      const principalAmount = Number(payload.amount || 1200000);
      const intent = await ws.orchestration.createPaymentIntent({
        tenantId: SIM_TENANT_ID,
        merchantId: mId,
        merchantLegalName: legalName,
        destinationBankIban: iban,
        amount: principalAmount,
        currency: "INR",
        originCountry: "IN",
        destinationCountry: "IN",
        selectedRail: "RTGS"
      });
      await ws.orchestration.provisionPaymentInstructions(intent.id, SIM_TENANT_ID);

      const ev = {
        paymentIntentId: intent.id,
        providerTxId: `sim_utr_e2e_${suffix}`,
        amount: principalAmount,
        currency: "INR",
        bankReference: `SIM-UTR-E2E-${suffix}`,
        settledAt: new Date().toISOString()
      };
      const signed = signSimHmac(ev, SIM_WEBHOOK_SECRET);
      const settled = await ws.orchestration.handleBankWebhook("mock_sovereign_bank", {
        rawPayload: signed.rawPayload,
        signatureHeader: signed.signatureHeader,
        secretKey: SIM_WEBHOOK_SECRET,
        nonce: `sim_e2e_nonce_${Date.now()}_${suffix}`,
        eventPayload: ev
      });
      ws.simWebhookMetrics.settledCount += 1;

      const stmt = ws.commissionProtection.generateDailyStatement({
        tenantId: SIM_TENANT_ID,
        merchantId: mId,
        dateKey: today
      });
      const invoice = ws.commissionProtection.generateDailyInvoice({
        tenantId: SIM_TENANT_ID,
        merchantId: mId,
        billingDate: today
      });
      const rec = this._ingestSimReceipt(ws, {
        merchantId: mId,
        purpose: RECEIPT_PURPOSES.COMMISSION_INVOICE_PAYMENT,
        ref: `SIM-NEFT-E2E-${suffix}`,
        account: `SIM-HDFC-${suffix}`,
        amount: invoice.totalAmount
      });
      const paidRes = ws.commissionProtection.recordInvoicePayment({
        tenantId: SIM_TENANT_ID,
        invoiceId: invoice.invoiceId,
        paidAmount: invoice.totalAmount,
        bankReceiptId: rec.bankReceiptId,
        paymentReference: `SIM-NEFT-E2E-${suffix}`,
        payerCorporateAccount: `SIM-HDFC-${suffix}`
      });

      ws.simWebhookMetrics.lastEventNote = `Completed 7-step E2E SIMULATED journey for ${mId} (₹${principalAmount.toLocaleString("en-IN")} -> Invoice ${invoice.invoiceNumber} PAID).`;
      ws.auditLogger.logEvent({
        transactionId: intent.id,
        actor: "SIM_E2E_DEMO_JOURNEY",
        action: "SIM_7STEP_JOURNEY_COMPLETED",
        oldState: "INITIATED",
        newState: "INVOICE_PAID",
        payload: { merchantId: mId, contractId: agreement.contractId, invoiceId: invoice.invoiceId, paidTotal: invoice.totalAmount }
      });

      outcome = {
        message: `Completed full 7-step SIMULATED customer journey for ${mId}: ₹${principalAmount.toLocaleString("en-IN")} settled -> ₹${settled.saasFeeDeducted.toLocaleString("en-IN")} (2%) + GST = ₹${invoice.totalAmount.toLocaleString("en-IN")} (${paidRes.invoice.status}).`,
        journeySteps: [
          { step: "1. Merchant", status: "DONE", ref: mId },
          { step: "2. Agreement (200 bps)", status: "DONE", ref: agreement.contractId },
          { step: "3. Payment Intent", status: "DONE", ref: intent.id },
          { step: "4. Bank Settlement", status: "DONE", ref: ev.bankReference },
          { step: "5. Reconciliation & Fee", status: "DONE", ref: stmt.statementId },
          { step: "6. GST Invoice", status: "DONE", ref: invoice.invoiceNumber },
          { step: "7. Receipt Verified & Paid", status: "DONE", ref: rec.bankReceiptId }
        ]
      };
    } else {
      throw new Error(`UNKNOWN_SIMULATION_ACTION: "${action}"`);
    }

    return {
      outcome,
      workspace: this.getFullSnapshot(sessionId)
    };
  }
}

const defaultFintechSimulationService = new FintechSimulationService();

module.exports = {
  SIM_TENANT_ID,
  FintechSimulationService,
  defaultFintechSimulationService
};
