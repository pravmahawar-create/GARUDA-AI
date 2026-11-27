/**
 * 🦅 GARUDA OS — MERCHANT OPERATIONS CONTROLLER (PHASE 11)
 * Bridges Classic Merchant Operations Terminal (/merchant-classic) to shared
 * Zero-Custody Orchestration, Legal Eligibility Gate, BSA Sec 63 Evidence Engine,
 * and Consent-Aware Permitted Growth Attribution.
 */

const crypto = require("crypto");
const QRCode = require("qrcode");
const { defaultOrchestrationService } = require("../fintech/orchestrationService");
const { defaultMerchantEligibilityService } = require("../fintech/merchantEligibilityService");
const { defaultBsaEvidenceService } = require("../fintech/bsaSection63EvidenceService");
const { defaultGrowthAttributionService } = require("../fintech/growthAttributionService");
const { defaultMerchantOpsSimService, SIM_OPS_TENANT, SIM_WEBHOOK_SECRET } = require("../fintech/merchantSimulationService");
const { redactSecrets } = require("../fintech/observability");

function resolveTenantId(req) {
  return req.garudaContext && req.garudaContext.tenantId ? String(req.garudaContext.tenantId) : null;
}

function resolveSimSessionId(req) {
  return String(req.get("x-sim-session-id") || req.query.sessionId || "default_sim_ops").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "default_sim_ops";
}

function sendError(res, err, fallbackCode = "MERCHANT_OPS_ERROR") {
  res.status(err.httpStatus || 400).json({
    success: false,
    error: err.message,
    errorCode: err.errorCode || fallbackCode
  });
}

// --- 1. LEGAL ELIGIBILITY & TAX CONFIG ---
async function listEligibility(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    res.json({ success: true, data: redactSecrets({ declarations: defaultMerchantEligibilityService.listDeclarations(tenantId) }) });
  } catch (err) {
    sendError(res, err);
  }
}

async function declareEligibility(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const created = defaultMerchantEligibilityService.declareMerchantProfile({
      tenantId,
      ...(req.body || {}),
      actorId: req.garudaContext?.actorId || "TENANT_OPERATOR"
    });
    res.status(201).json({ success: true, data: redactSecrets(created) });
  } catch (err) {
    sendError(res, err);
  }
}

async function reviewEligibility(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const reviewed = defaultMerchantEligibilityService.reviewAndApprove({
      tenantId,
      merchantId: req.params.merchantId,
      counselApproved: req.body?.counselApproved,
      counselReference: req.body?.counselReference,
      expiresAt: req.body?.expiresAt,
      founderContext: req.garudaContext || {}
    });
    res.json({ success: true, data: redactSecrets(reviewed) });
  } catch (err) {
    sendError(res, err);
  }
}

async function getTaxConfig(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    res.json({ success: true, data: defaultMerchantEligibilityService.getActiveTaxConfig(tenantId, req.query.asOfDate) });
  } catch (err) {
    sendError(res, err);
  }
}

async function setTaxConfig(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const cfg = defaultMerchantEligibilityService.setTaxConfig({
      tenantId,
      ...(req.body || {}),
      founderContext: req.garudaContext || {}
    });
    res.status(201).json({ success: true, data: cfg });
  } catch (err) {
    sendError(res, err);
  }
}

// --- 2. CHECKOUT INTENTS (SHARED WITH ORCHESTRATION SERVICE + ELIGIBILITY GATE) ---
async function createCheckoutIntent(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const merchantId = req.body?.merchantId;
    // Enforce fail-closed Legal Eligibility Gate on all Merchant Operations checkout intents
    defaultMerchantEligibilityService.assertEligible(tenantId, merchantId, "MERCHANT_CHECKOUT");

    const intent = await defaultOrchestrationService.createPaymentIntent({
      tenantId,
      merchantId,
      merchantLegalName: req.body?.merchantLegalName,
      destinationBankIban: req.body?.destinationBankIban,
      amount: req.body?.amount,
      currency: req.body?.currency || "INR",
      originCountry: req.body?.originCountry || "IN",
      destinationCountry: req.body?.destinationCountry || "IN",
      selectedRail: req.body?.selectedRail || "RTGS",
      preferredProvider: req.body?.preferredProvider || "mock_sovereign_bank",
      idempotencyKey: req.body?.idempotencyKey
    });
    res.status(201).json({ success: true, data: redactSecrets(intent) });
  } catch (err) {
    sendError(res, err, "CHECKOUT_INTENT_FAILED");
  }
}

async function listCheckoutIntents(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    res.json({ success: true, data: redactSecrets({ items: defaultOrchestrationService.listPaymentIntents(tenantId) }) });
  } catch (err) {
    sendError(res, err);
  }
}

// --- 3. BSA SECTION 63 ELECTRONIC EVIDENCE ENGINE ---
async function listEvidenceCases(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    res.json({ success: true, data: redactSecrets({ cases: defaultBsaEvidenceService.listCases(tenantId) }) });
  } catch (err) {
    sendError(res, err);
  }
}

async function createEvidenceCase(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const created = defaultBsaEvidenceService.createCase({
      tenantId,
      ...(req.body || {}),
      actorId: req.garudaContext?.actorId
    });
    res.status(201).json({ success: true, data: redactSecrets(created) });
  } catch (err) {
    sendError(res, err);
  }
}

async function ingestEvidenceRecord(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const rec = defaultBsaEvidenceService.ingestSourceRecord({
      tenantId,
      caseId: req.params.caseId,
      sourceType: req.body?.sourceType,
      sourceSystem: req.body?.sourceSystem,
      originalRawPayload: req.body?.originalRawPayload,
      actorId: req.garudaContext?.actorId
    });
    res.status(201).json({ success: true, data: redactSecrets(rec) });
  } catch (err) {
    sendError(res, err);
  }
}

async function verifyEvidenceCase(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    res.json({ success: true, data: defaultBsaEvidenceService.verifyCaseChain(req.params.caseId, tenantId) });
  } catch (err) {
    sendError(res, err);
  }
}

async function signEvidencePartA(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const updated = defaultBsaEvidenceService.signPartA({
      tenantId,
      caseId: req.params.caseId,
      deponentName: req.body?.deponentName,
      designation: req.body?.designation,
      signerContext: req.garudaContext || {}
    });
    res.json({ success: true, data: redactSecrets(updated) });
  } catch (err) {
    sendError(res, err);
  }
}

async function signEvidencePartB(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const updated = defaultBsaEvidenceService.signPartB({
      tenantId,
      caseId: req.params.caseId,
      expertName: req.body?.expertName,
      qualification: req.body?.qualification,
      examinationTooling: req.body?.examinationTooling,
      signerContext: req.garudaContext || {}
    });
    res.json({ success: true, data: redactSecrets(updated) });
  } catch (err) {
    sendError(res, err);
  }
}

async function exportEvidenceCase(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const pkg = defaultBsaEvidenceService.exportEvidencePackage(req.params.caseId, tenantId, req.garudaContext || {});
    res.json({ success: true, data: redactSecrets(pkg) });
  } catch (err) {
    sendError(res, err);
  }
}

// --- 4. PERMITTED GROWTH & ATTRIBUTION ---
async function listCampaigns(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    res.json({
      success: true,
      data: redactSecrets({
        campaigns: defaultGrowthAttributionService.listCampaigns(tenantId),
        attributionEvents: defaultGrowthAttributionService.listAttributionEvents(tenantId, req.query.campaignId || null)
      })
    });
  } catch (err) {
    sendError(res, err);
  }
}

async function createCampaign(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const campaign = defaultGrowthAttributionService.createCampaign({
      tenantId,
      ...(req.body || {})
    });
    res.status(201).json({ success: true, data: redactSecrets(campaign) });
  } catch (err) {
    sendError(res, err);
  }
}

async function recordCampaignEvent(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const ev = defaultGrowthAttributionService.recordAttributionEvent({
      tenantId,
      campaignId: req.params.campaignId,
      ...(req.body || {})
    });
    res.status(201).json({ success: true, data: redactSecrets(ev) });
  } catch (err) {
    sendError(res, err);
  }
}

// --- 5. ISOLATED SIMULATED CLASSIC OPERATIONS SANDBOX ---
async function getSimState(req, res) {
  try {
    const snap = await defaultMerchantOpsSimService.getSnapshot(resolveSimSessionId(req));
    res.json({ success: true, data: redactSecrets(snap) });
  } catch (err) {
    sendError(res, err);
  }
}

async function resetSimState(req, res) {
  try {
    const snap = await defaultMerchantOpsSimService.resetWorkspace(resolveSimSessionId(req));
    res.json({ success: true, data: redactSecrets(snap) });
  } catch (err) {
    sendError(res, err);
  }
}

async function runSimAction(req, res) {
  try {
    const sessionId = resolveSimSessionId(req);
    const ws = await defaultMerchantOpsSimService.getWorkspace(sessionId);
    const action = req.params.action;
    const body = req.body || {};
    let outcome = null;

    if (action === "create_checkout") {
      const mId = body.merchantId || "SIM_GM_ESPORTS_01";
      ws.eligibility.assertEligible(SIM_OPS_TENANT, mId, "MERCHANT_CHECKOUT");
      const decl = ws.eligibility.declarations.get(`${SIM_OPS_TENANT}::${mId}`);
      const intent = await ws.orchestration.createPaymentIntent({
        tenantId: SIM_OPS_TENANT,
        merchantId: mId,
        merchantLegalName: decl?.legalName || mId,
        destinationBankIban: mId === "SIM_GM_SOCIAL_02" ? "SIM-IN-ICIC-000104998822" : "SIM-IN-ICIC-000104998811",
        amount: Number(body.amount || 2500),
        currency: "INR",
        originCountry: "IN",
        destinationCountry: "IN",
        selectedRail: body.rail || "IMPS"
      });
      await ws.orchestration.provisionPaymentInstructions(intent.id, SIM_OPS_TENANT);
      // Provider-neutral checkout QR preview payload (SIMULATED — strictly LOCAL_PREVIEW_QR, never live NPCI)
      intent.qrSourceType = "LOCAL_PREVIEW_QR";
      intent.providerQrVerified = false;
      intent.isLivePaymentReady = false;
      intent.qrImageUrl = await QRCode.toDataURL(`upi://pay?pa=sim.ops@bank.sim&am=${intent.amount}&cu=INR&tr=${encodeURIComponent(intent.paymentReference)}&tn=${encodeURIComponent(intent.paymentReference)}`, { width: 200, margin: 1 });
      outcome = { message: `Checkout intent ${intent.id} created (status: ${intent.status}). Pending webhook confirmation — not yet settled.`, intent };
    } else if (action === "settle_checkout") {
      const intent = ws.orchestration.getPaymentIntent(body.intentId, SIM_OPS_TENANT) ||
        ws.orchestration.listPaymentIntents(SIM_OPS_TENANT).find((i) => i.status !== "SETTLED");
      if (!intent) throw new Error("No unsettled simulated checkout intent found. Create one first.");
      const ev = {
        paymentIntentId: intent.id,
        providerTxId: `sim_utr_${Date.now().toString().slice(-6)}`,
        amount: intent.amount,
        currency: intent.currency,
        bankReference: `SIM-UTR-${Date.now().toString().slice(-6)}`,
        settledAt: new Date().toISOString()
      };
      const ts = Math.floor(Date.now() / 1000);
      const rawPayload = JSON.stringify(ev);
      const sig = crypto.createHmac("sha256", SIM_WEBHOOK_SECRET).update(`${ts}.${rawPayload}`).digest("hex");
      const settled = await ws.orchestration.handleBankWebhook("mock_sovereign_bank", {
        rawPayload,
        signatureHeader: `t=${ts},v1=${sig}`,
        secretKey: SIM_WEBHOOK_SECRET,
        nonce: `sim_ops_settle_${Date.now()}`,
        eventPayload: ev
      });
      outcome = { message: `Confirmed settlement UTR ${settled.bankSettlementRef} for ₹${intent.amount.toLocaleString("en-IN")} (2% fee: ₹${settled.saasFeeDeducted}).`, settled };
    } else if (action === "test_prohibited_rmg_block") {
      // Explicitly demonstrates fail-closed block for Indian Online Money Gaming
      ws.eligibility.assertEligible(SIM_OPS_TENANT, "SIM_GM_RMG_BLOCKED_99", "CAMPAIGN_AND_CHECKOUT");
    } else if (action === "record_campaign_hit") {
      const cmp = ws.growth.listCampaigns(SIM_OPS_TENANT)[0];
      const ev = ws.growth.recordAttributionEvent({
        tenantId: SIM_OPS_TENANT,
        campaignId: cmp.campaignId,
        channelId: body.channelId || "OPEN_GAMING_PUBLISHERS",
        consentRecorded: true,
        consentRef: `CONSENT-SIM-${Date.now().toString().slice(-5)}`,
        ipType: body.ipType || "RESIDENTIAL_MOBILE",
        requestsPerMinute: body.ipType === "DATACENTER_PROXY" ? 19 : 2,
        stage: body.stage || "CLICK",
        visitorSeed: `sim_user_${Date.now()}`
      });
      outcome = { message: `Recorded ${ev.classification} attribution event (${ev.channelId}, IVT risk score: ${ev.ivtRiskScore}/100).`, event: ev };
    } else if (action === "create_evidence_case") {
      const created = ws.evidence.createCase({
        tenantId: SIM_OPS_TENANT,
        merchantId: "SIM_GM_ESPORTS_01",
        complaintRef: body.complaintRef || `SIM-CASE-${Date.now().toString().slice(-5)}`,
        authorityOrBank: body.authorityOrBank || "Bank Grievance & Nodal Desk (SIMULATED)",
        paymentIntentId: body.paymentIntentId || ws.orchestration.listPaymentIntents(SIM_OPS_TENANT)[0]?.id,
        bankUtr: "SIM-UTR-ESP-432891",
        disputedAmount: Number(body.disputedAmount || 50000),
        summary: body.summary || "Dispute case preserved for BSA Section 63 export"
      });
      ws.evidence.ingestSourceRecord({
        tenantId: SIM_OPS_TENANT,
        caseId: created.caseId,
        sourceType: "SETTLEMENT_UTR_FEED",
        sourceSystem: "mock_sovereign_bank",
        originalRawPayload: { utr: "SIM-UTR-ESP-432891", amount: 50000, currency: "INR", isSimulated: true }
      });
      outcome = { message: `Preserved BSA Sec 63 evidence case ${created.caseId} with SHA-256 original record hash.`, caseObj: created };
    } else if (action === "sign_part_a") {
      const updated = ws.evidence.signPartA({
        tenantId: SIM_OPS_TENANT,
        caseId: body.caseId,
        deponentName: body.deponentName || "Authorized Finance Custodian",
        designation: body.designation || "Head of Operations",
        signerContext: { role: "platform_founder", actorId: "SIM_CUSTODIAN" }
      });
      outcome = { message: `Part A custodian attestation recorded on ${updated.caseId}.`, caseObj: updated };
    } else if (action === "sign_part_b") {
      const updated = ws.evidence.signPartB({
        tenantId: SIM_OPS_TENANT,
        caseId: body.caseId,
        expertName: body.expertName || "Technical Forensics Officer",
        qualification: body.qualification || "B.Tech CS / Digital Forensics Specialist",
        signerContext: { role: "platform_founder", actorId: "SIM_EXPERT" }
      });
      outcome = { message: `Part B technical expert verification recorded on ${updated.caseId}.`, caseObj: updated };
    } else if (action === "export_bsa_certificate") {
      const pkg = ws.evidence.exportEvidencePackage(body.caseId, SIM_OPS_TENANT, { actorId: "SIM_PREVIEW", role: "tenant_operator" });
      outcome = { message: `Exported BSA Sec 63 draft manifest ${pkg.exportId} (sha256: ${pkg.exportManifestSha256.slice(0, 14)}…).`, exportPackage: pkg };
    } else {
      throw new Error(`UNKNOWN_SIM_ACTION: "${action}"`);
    }

    return res.json({
      success: true,
      data: redactSecrets({
        outcome,
        workspace: await defaultMerchantOpsSimService.getSnapshot(sessionId)
      })
    });
  } catch (err) {
    sendError(res, err, "SIM_ACTION_FAILED");
  }
}

module.exports = {
  listEligibility,
  declareEligibility,
  reviewEligibility,
  getTaxConfig,
  setTaxConfig,
  createCheckoutIntent,
  listCheckoutIntents,
  listEvidenceCases,
  createEvidenceCase,
  ingestEvidenceRecord,
  verifyEvidenceCase,
  signEvidencePartA,
  signEvidencePartB,
  exportEvidenceCase,
  listCampaigns,
  createCampaign,
  recordCampaignEvent,
  getSimState,
  resetSimState,
  runSimAction
};
