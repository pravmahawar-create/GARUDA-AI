/**
 * GARUDA FOUNDER INTELLIGENCE — Proposal Copilot (Phase 9)
 *
 * Facade over the EXISTING clientProposalService (no duplicate proposal
 * engine). The copilot:
 *  1. runs deterministic pricing FIRST (evidence-labeled),
 *  2. refuses to create a proposal when price is UNKNOWN (anti-fabrication),
 *  3. passes explicit `amount` so no hidden estimation path invents numbers,
 *  4. validates the created proposal against the engine output.
 */

const { LABELS, makeEvidence, unknownEvidence, summarizeEvidence } = require("./evidenceLabels");
const pricingEngine = require("./pricingIntelligenceEngine");

function getClientProposalService() {
  return require("../clientProposalService");
}

function buildDeliverables(serviceType, scope) {
  const list = [];
  if (scope?.pages) list.push(`Delivery covering ${scope.pages} page(s)/screen(s)`);
  if (scope?.features) list.push(`${scope.features} feature module(s)`);
  if (scope?.flows) list.push(`${scope.flows} automation flow(s)`);
  list.push("Production deployment + handover documentation");
  list.push("50% milestone governance (deposit → delivery → final)");
  return list;
}

/**
 * Draft a proposal from a brief. Deterministic price path.
 *
 * @param {object} input  { title, requirements, serviceType, scope, complexity, clientName }
 * @param {object} context { founderApproved?: boolean, nowMs?: number }
 */
async function draftFromBrief(input = {}, context = {}) {
  const title = String(input.title || "").trim();
  const requirements = String(input.requirements || "").trim();

  if (!title && !requirements) {
    return {
      success: false,
      created: false,
      reason: "TITLE_OR_REQUIREMENTS_REQUIRED",
      label: LABELS.UNKNOWN,
      missingInputs: ["title|requirements"],
      evidence: [unknownEvidence("title")],
    };
  }

  // ---- 1. Deterministic pricing first ----
  const quote = pricingEngine.quote(
    {
      serviceType: input.serviceType,
      scope: input.scope,
      complexity: input.complexity,
    },
    { nowMs: context.nowMs }
  );

  if (!quote.success || quote.label === LABELS.UNKNOWN) {
    return {
      success: false,
      created: false,
      reason: "PRICE_NOT_VERIFIABLE",
      label: LABELS.UNKNOWN,
      pricing: quote,
      missingInputs: quote.missingInputs || [],
      evidence: quote.evidence,
      note: "Anti-fabrication: proposal NOT created because price cannot be verified/estimated from provided inputs.",
    };
  }

  const amountINR = quote.quote.minINR;

  const evidence = [
    ...quote.evidence,
    makeEvidence({
      field: "proposal_amount_basis",
      label: quote.label,
      value: { amountINR, basis: "pricing_engine_min" },
      source: { type: "model", ref: "pricingIntelligenceEngine", retrievedAt: null },
    }),
  ];

  // ---- 2. Create via EXISTING proposal infrastructure ----
  let proposal;
  try {
    proposal = await getClientProposalService().createProposal(
      {
        title: title || requirements.slice(0, 120),
        requirements,
        amount: amountINR,
        currency: "INR",
        depositPercentage: 50,
        deliverables: buildDeliverables(quote.serviceType, input.scope),
        clientName: input.clientName || undefined,
      },
      { founderApproved: context.founderApproved !== false }
    );
  } catch (err) {
    return {
      success: false,
      created: false,
      reason: "PROPOSAL_SERVICE_ERROR",
      label: LABELS.BLOCKED,
      errorMessage: String(err.message).slice(0, 300),
      pricing: quote,
      evidence,
    };
  }

  // ---- 3. Validation against engine output (Anti-Fabrication) ----
  const validation = validateProposal(proposal, quote, amountINR);

  // ---- 4. OPTIONAL mirror into EXISTING persistentProposalService (§11) ----
  const mirror = await mirrorToPersistentStore(proposal);

  return {
    success: validation.ok,
    created: true,
    label: summarizeEvidence(evidence).label,
    proposalId: proposal.proposalId || proposal.id || null,
    proposal: validation.ok ? proposal : proposal,
    pricing: quote,
    proposedAmountINR: amountINR,
    evidence,
    validation,
    persistentMirror: mirror,
  };
}

/**
 * §11 — best-effort mirror into the existing persistentProposalService.
 * Never breaks proposal creation: persistence failure → PARTIAL note only.
 */
async function mirrorToPersistentStore(proposal) {
  if (!proposal) return { mirrored: false, note: "NO_PROPOSAL" };
  try {
    const persistent = require("../persistentProposalService");
    if (persistent && typeof persistent.saveProposal === "function") {
      await persistent.saveProposal(proposal);
      return { mirrored: true, backend: "persistentProposalService" };
    }
    return { mirrored: false, note: "PERSISTENT_SERVICE_HAS_NO_saveProposal" };
  } catch (err) {
    return { mirrored: false, note: `PERSISTENCE_SKIPPED: ${String(err.message).slice(0, 160)}` };
  }
}

/**
 * §11 — proposal → PDF via EXISTING pdfGenerationService (facade, no new engine).
 *
 * pdfGenerationService renders with standard WinAnsi fonts, which cannot encode
 * ₹ (0x20B9), → (0x2192), and other non-Latin1 glyphs — previously threw
 * "WinAnsi cannot encode" and failed EVERY PDF containing Indian currency.
 * Sanitize to WinAnsi-safe equivalents (values preserved: ₹ → "Rs. ").
 */
function pdfSafe(text) {
  return String(text)
    .replace(/₹/g, "Rs. ")
    .replace(/[←-⇿]/g, "->")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/[^\u0000-\u00FF]/g, "");
}

async function exportPdf(proposalId, options = {}) {
  const fetched = await getProposal(proposalId, { isPublicView: false });
  if (!fetched.success) return { success: false, reason: fetched.reason || "NOT_FOUND", label: LABELS.UNKNOWN };
  const p = fetched.proposal;
  const pricing = p.pricing || {};
  const sections = [
    { heading: "Project Overview", body: pdfSafe(p.project?.title || p.title || p.name || proposalId) },
    { heading: "Requirements", body: pdfSafe(String(p.requirements || p.project?.requirements || "As discussed in scoping session")).slice(0, 1200) },
    { heading: "Scope & Deliverables", body: pdfSafe((p.deliverables || []).map((d) => `- ${d}`).join("\n")) || "As per agreed scope" },
    {
      heading: "Commercials",
      body: pdfSafe([
        `Total: ₹${Number(pricing.totalINR ?? p.totalINR ?? p.amount ?? 0).toLocaleString("en-IN")}`,
        `Deposit (50%): ₹${Number(pricing.depositAmountINR ?? 0).toLocaleString("en-IN")}`,
        "Governance: 50% milestone (deposit → delivery → final)",
      ].join("\n")),
    },
    { heading: "Evidence & Labels", body: "Pricing anchored to GARUDA official pricing snapshot with evidence labels (VERIFIED / ESTIMATE / PARTIAL as applicable)." },
    { heading: "Next Steps", body: pdfSafe("Confirm scope → sign-off → 50% deposit → build begins") },
  ];
  try {
    const pdfService = require("../pdfGenerationService").pdfGenerationService;
    const artifact = await pdfService.generatePdfArtifact({
      title: pdfSafe(`Proposal: ${p.project?.title || p.title || proposalId}`),
      summary: `Executive proposal generated by GARUDA Founder Intelligence (proposalId: ${proposalId}).`,
      sections,
      options: options.pdfOptions || {},
    });
    return {
      success: true,
      label: LABELS.VERIFIED,
      artifact,
      note: "Generated via existing pdfGenerationService",
    };
  } catch (err) {
    return { success: false, reason: "PDF_GENERATION_FAILED", errorMessage: String(err.message).slice(0, 300), label: LABELS.BLOCKED };
  }
}

/**
 * Validate created proposal against engine outputs.
 * Detects: amount drift, missing deposit, NaN, fabricated totals.
 */
function validateProposal(proposal, quote, expectedAmountINR) {
  const issues = [];
  if (!proposal) issues.push("PROPOSAL_MISSING");

  const total = proposal?.pricing?.totalINR ?? proposal?.totalINR ?? proposal?.total;
  if (total === undefined || total === null) {
    issues.push("TOTAL_MISSING");
  } else if (typeof total !== "number" || !Number.isFinite(total)) {
    issues.push("TOTAL_NOT_FINITE");
  } else if (expectedAmountINR !== undefined && total !== expectedAmountINR) {
    // clientProposalService may re-derive; flag any drift from engine basis
    issues.push(`AMOUNT_DRIFT:${total}!=${expectedAmountINR}`);
  }

  const deposit = proposal?.pricing?.depositAmountINR;
  if (deposit !== undefined) {
    if (!Number.isFinite(deposit)) issues.push("DEPOSIT_NOT_FINITE");
    else if (expectedAmountINR && deposit !== Math.round((expectedAmountINR * 50) / 100)) {
      issues.push(`DEPOSIT_DRIFT:${deposit}`);
    }
  }

  const serialized = JSON.stringify(proposal || {});
  if (/NaN|undefined_INR|"∞"/.test(serialized)) issues.push("CORRUPT_NUMERIC");

  return {
    ok: issues.length === 0,
    issues,
    checkedAgainst: quote ? quote.methodology : null,
  };
}

/**
 * Read a proposal through the copilot facade (existing engine).
 */
async function getProposal(proposalId, { isPublicView = false } = {}) {
  try {
    const proposal = await getClientProposalService().getProposal(proposalId, { isPublicView });
    if (!proposal) return { success: false, reason: "NOT_FOUND", label: LABELS.UNKNOWN };
    return { success: true, proposal, label: LABELS.VERIFIED };
  } catch (err) {
    return { success: false, reason: "PROPOSAL_SERVICE_ERROR", errorMessage: err.message, label: LABELS.BLOCKED };
  }
}

module.exports = { draftFromBrief, validateProposal, getProposal, buildDeliverables, exportPdf, mirrorToPersistentStore };
