/**
 * GARUDA FOUNDER INTELLIGENCE — Orchestrator (Phase 2 + Phase 3)
 *
 * Flow: REQUEST → INTENT → CONTEXT → MEMORY → RESEARCH (when required)
 *       → EVIDENCE → DETERMINISTIC CALCULATION → INTELLIGENCE
 *       → PRIVATE/SHARED SEPARATION → PROPOSAL → AUDIT → RESULT
 *
 * Reuses EXISTING engines (never duplicates):
 *  - llmAdapter (conversation), memoryService (lessons/wisdom),
 *  - knowledgeService (via researchBridge), clientProposalService (via copilot),
 *  - dealTrackerService (empirical probability), mother mission report (read-only).
 * Deterministic engines own ALL numbers — the LLM never supplies prices.
 */

const fs = require("fs");
const path = require("path");

const { LABELS, makeEvidence, unknownEvidence, summarizeEvidence } = require("./evidenceLabels");
const pricingEngine = require("./pricingIntelligenceEngine");
const negotiationAdvisor = require("./negotiationAdvisor");
const businessCalculator = require("./businessCalculator");
const clientMemoryService = require("./clientMemoryService");
const meetingModeService = require("./meetingModeService");
const researchBridge = require("./researchBridge");
const proposalCopilot = require("./proposalCopilot");
const businessAnalysisService = require("./businessAnalysisService");
const { ConfidenceEngine } = require("../garudaIntelligence/confidenceEngine");

// Reused existing GARUDA confidence engine (never duplicated).
const confidenceEngine = new ConfidenceEngine();

const INTENTS = Object.freeze({
  ANALYZE: "analyze",
  PRICING: "pricing",
  RESEARCH: "research",
  NEGOTIATION: "negotiation",
  PROPOSAL: "proposal",
  FEASIBILITY: "feasibility",
  CLIENT_MEMORY: "client_memory",
  MEETING: "meeting",
  GENERAL: "general",
});

/**
 * Deterministic intent classifier — scored keyword cues (testable, stable).
 */
const INTENT_CUES = Object.freeze({
  [INTENTS.ANALYZE]: ["analyse", "analyze", "analysis karo", "business samjho", "understand this business", "is client ka business", "business kya hai", "identify modules", "identify automation", "kya banana chahiye", "actual scope kya", "samjho ye"],
  [INTENTS.PRICING]: ["price", "pricing", "quote", "cost", "rate", "charge", "charges", "fees", "kitna", "rate card", "estimate", "bhav", "budget check"],
  [INTENTS.RESEARCH]: ["research", "market", "competitor", "latest news", "find out", "current trend", "industry data", "scout"],
  [INTENTS.NEGOTIATION]: ["negotiat", "discount", "objection", "pushback", "walk away", "close the deal", "deal closing", "counter offer", "kam karo"],
  [INTENTS.PROPOSAL]: ["proposal", "bid", "tender", "sow", "statement of work", "draft kar", "proposal bana"],
  [INTENTS.FEASIBILITY]: ["margin", "break even", "breakeven", "profit", "calculator", "milestone split", "deposit percent", "roi"],
  [INTENTS.CLIENT_MEMORY]: ["returning client", "past client", "previous client", "client history", "remember client", "purana client", "we worked with"],
  [INTENTS.MEETING]: ["meeting mode", "live call", "on call", "screen share", "customer is here", "on the call", "meeting shuru"],
});

function classifyIntent(text = "", explicitHint = null) {
  if (explicitHint && Object.values(INTENTS).includes(explicitHint)) {
    return { intent: explicitHint, confidence: 1.0, matchedCues: ["explicit_hint"] };
  }
  const t = String(text).toLowerCase();
  const scores = {};
  for (const [intent, cues] of Object.entries(INTENT_CUES)) {
    const matched = cues.filter((c) => t.includes(c));
    scores[intent] = matched.length;
  }
  let best = INTENTS.GENERAL;
  let bestScore = 0;
  for (const [intent, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  if (bestScore === 0) return { intent: INTENTS.GENERAL, confidence: 0.2, matchedCues: [] };
  return { intent: best, confidence: Math.min(1, 0.5 + bestScore * 0.25), matchedCues: Object.keys(scores).filter((k) => scores[k] > 0 && k === best) };
}

/**
 * Deterministic context extraction — service, scope, complexity, verbatim budget mentions.
 * Budget mentions are captured VERBATIM as statements — never converted to claims.
 */
function extractContext(text = "", structured = {}) {
  const ctx = {
    serviceType: null,
    scope: {},
    complexity: structured.complexity || null,
    explicitBudgetMentions: [],
    timelineDays: null,
  };

  const serviceType = pricingEngine.normalizeServiceType(
    structured.serviceType || text
  );
  if (serviceType) ctx.serviceType = serviceType;
  else {
    // Scan free text for service words: LONGEST alias first to avoid
    // short-token false positives ("cha**hiye**" contains "ai").
    // Short aliases (<=4 chars) only match on word boundaries.
    const words = Object.keys(pricingEngine.SERVICE_ALIASES).sort((a, b) => b.length - a.length);
    for (const w of words) {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const hit =
        w.length <= 4
          ? new RegExp(`\\b${escaped}\\b`, "i").test(String(text))
          : String(text).toLowerCase().includes(w);
      if (hit) {
        ctx.serviceType = pricingEngine.SERVICE_ALIASES[w];
        break;
      }
    }
  }

  const scope = structured.scope || {};
  const pagesMatch = String(text).match(/(\d+)\s*(pages?|screens?)/i);
  const featMatch = String(text).match(/(\d+)\s*(features?)/i);
  const flowMatch = String(text).match(/(\d+)\s*(flows?|workflows?)/i);
  ctx.scope = {
    pages: Number.isFinite(scope.pages) ? scope.pages : pagesMatch ? Number(pagesMatch[1]) : null,
    features: Number.isFinite(scope.features) ? scope.features : featMatch ? Number(featMatch[1]) : null,
    flows: Number.isFinite(scope.flows) ? scope.flows : flowMatch ? Number(flowMatch[1]) : null,
  };
  if (ctx.scope.pages === null) delete ctx.scope.pages;
  if (ctx.scope.features === null) delete ctx.scope.features;
  if (ctx.scope.flows === null) delete ctx.scope.flows;

  const budgetMatches = String(text).match(/₹\s?[\d,]+(?:\s*(?:lakh|lac|k|crore))?/gi) || [];
  ctx.explicitBudgetMentions = budgetMatches.slice(0, 5);

  const daysMatch = String(text).match(/(\d+)\s*days?/i);
  if (daysMatch) ctx.timelineDays = Number(daysMatch[1]);

  return ctx;
}

/** Read-only integration with existing Mother Brain mission report. */
function motherMissionContext() {
  try {
    const p = path.join(process.cwd(), "reports", "mother-cycle-report.json");
    if (!fs.existsSync(p)) return null;
    const r = JSON.parse(fs.readFileSync(p, "utf8"));
    return { goal: r.goal || null, status: r.status || null };
  } catch {
    return null;
  }
}

/** Existing memory engine — lessons/wisdom (read-only reuse). */
function recallWisdom(query) {
  try {
    const memoryService = require("../persistentMemory/memoryService");
    const wisdom = memoryService.getWisdom ? memoryService.getWisdom() : null;
    if (Array.isArray(wisdom) && wisdom.length > 0) {
      return wisdom.slice(-5).map((w) => ({
        text: w.text || w.lesson || JSON.stringify(w).slice(0, 200),
        label: LABELS.VERIFIED,
        source: "memoryService.experiences",
      }));
    }
  } catch {
    /* memory engine unavailable → skip, never fake */
  }
  return [];
}

function appendAudit(entry) {
  if (process.env.GARUDA_FI_AUDIT === "off") return;
  try {
    const file =
      process.env.GARUDA_FI_AUDIT_FILE ||
      path.join(process.cwd(), "data", "founder-intelligence-audit.jsonl");
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Audit never contains private payload contents — only metadata.
    fs.appendFileSync(file, JSON.stringify(entry) + "\n", "utf8");
  } catch {
    /* audit write failure must not break intelligence flow */
  }
}

/**
 * MAIN ENTRY — full founder intelligence pipeline.
 *
 * @param {object} request
 *   { text, intentHint, structured, externalSources, meetingSessionId,
 *     founderApproved, clientStatementInputs, founderAssumptions, quote }
 */
async function handle(request = {}, deps = {}) {
  const startedAt = Date.now();
  const text = String(request.text || "").trim();
  // Accept service hints at request root OR nested under `structured`
  const structured = {
    serviceType: request.serviceType,
    scope: request.scope,
    complexity: request.complexity,
    ...(request.structured || {}),
  };

  // ---------- INTENT ----------
  const classification = classifyIntent(text, request.intentHint || null);

  // ---------- CONTEXT ----------
  const context = extractContext(text, structured);

  // ---------- MEMORY ----------
  const clientMemory = await clientMemoryService.recallForContext(
    `${text} ${structured.clientId || ""}`.trim(),
    { limit: 3 }
  );
  const wisdom = recallWisdom(text);

  // ---------- RESEARCH (when required) ----------
  let research = null;
  const needsResearch =
    classification.intent === INTENTS.RESEARCH ||
    request.research === true ||
    (classification.intent === INTENTS.PRICING && request.research === true);
  if (needsResearch) {
    research = await researchBridge.research(
      text || "current GARUDA market pricing",
      { externalSources: request.externalSources || [] },
      { knowledgeService: deps.knowledgeService }
    );
  }

  // ---------- ROUTE TO DETERMINISTIC ENGINES ----------
  let result = null;
  let evidence = [];
  let sources = [];
  let split = null; // meeting separation

  switch (classification.intent) {
    case INTENTS.ANALYZE: {
      result = businessAnalysisService.analyze({ text, structured });
      evidence = result.evidence || [];
      break;
    }
    case INTENTS.PRICING: {
      result = pricingEngine.quote(
        { serviceType: context.serviceType || structured.serviceType, scope: context.scope, complexity: context.complexity },
        { nowMs: request.nowMs }
      );
      if (result.success && result.snapshot) {
        sources.push({ title: "GARUDA Official Pricing (live snapshot)", source: { type: "url", ref: result.snapshot.source.ref, retrievedAt: result.snapshot.source.retrievedAt }, freshness: result.snapshot.freshness });
      }
      evidence = result.evidence || [];
      if (result.label) {
        evidence = [
          ...evidence,
          makeEvidence({
            field: "quote_summary",
            label: result.label,
            value: result.quote,
            source: { type: "model", ref: "pricingIntelligenceEngine", retrievedAt: null },
          }),
        ];
      }
      break;
    }
    case INTENTS.NEGOTIATION: {
      const quotePayload =
        request.quote ||
        (context.serviceType
          ? pricingEngine.quote({ serviceType: context.serviceType, scope: context.scope, complexity: context.complexity }, { nowMs: request.nowMs })
          : null);
      result = negotiationAdvisor.analyze(
        {
          customerStatements: request.customerStatements || [],
          founderAssumptions: request.founderAssumptions || [],
          customerAsk: request.customerAsk || text,
          quote: quotePayload && quotePayload.success ? quotePayload : null,
        },
        { dealTracker: deps.dealTracker }
      );
      evidence = result.evidence || [];
      break;
    }
    case INTENTS.FEASIBILITY: {
      const calcType = request.calc || detectCalcType(text);
      const fn = businessCalculator[calcType];
      if (typeof fn === "function") {
        result = { calcType, ...(fn(request.calcInput || structured.calcInput || {})) };
      } else {
        result = { success: false, label: LABELS.UNKNOWN, reason: "CALC_TYPE_REQUIRED", missingInputs: ["calc"] };
      }
      evidence = result.missingInputs
        ? result.missingInputs.map((f) => unknownEvidence(f))
        : [makeEvidence({ field: "calculator", label: result.label || LABELS.ESTIMATE, value: true, source: { type: "model", ref: "businessCalculator", retrievedAt: null } })];
      break;
    }
    case INTENTS.PROPOSAL: {
      result = await proposalCopilot.draftFromBrief(
        {
          title: structured.title || text.slice(0, 140),
          requirements: structured.requirements || text,
          serviceType: context.serviceType || structured.serviceType,
          scope: context.scope,
          complexity: context.complexity,
          clientName: structured.clientName,
        },
        { founderApproved: request.founderApproved !== false, nowMs: request.nowMs }
      );
      evidence = result.evidence || [];
      break;
    }
    case INTENTS.CLIENT_MEMORY: {
      result = clientMemory;
      evidence = clientMemory.evidence || [];
      break;
    }
    case INTENTS.MEETING: {
      const sessionId = request.meetingSessionId;
      if (!sessionId) {
        result = { success: false, reason: "MEETING_SESSION_REQUIRED", label: LABELS.UNKNOWN };
        evidence = [unknownEvidence("meetingSessionId")];
      } else {
        const quotePayload = context.serviceType
          ? pricingEngine.quote({ serviceType: context.serviceType, scope: context.scope, complexity: context.complexity }, { nowMs: request.nowMs })
          : null;
        const negotiation = negotiationAdvisor.analyze(
          {
            customerStatements: request.customerStatements || [],
            founderAssumptions: request.founderAssumptions || [],
            customerAsk: text,
            quote: quotePayload && quotePayload.success ? quotePayload : null,
          },
          { dealTracker: deps.dealTracker }
        );

        // §4 business analysis runs inside the meeting too (deterministic, cheap)
        const analysisRun = businessAnalysisService.analyze({ text, structured });
        const nextQ =
          suggestNextQuestions(analysisRun.missingInputs || [])[0] ||
          suggestNextQuestions(quotePayload?.missingInputs || [])[0] ||
          null;
        const founderFloor = quotePayload?.derived?.founderFloor || { valueINR: null, label: LABELS.UNKNOWN };

        split = meetingModeService.buildSplitResponse(sessionId, {
          public: {
            customerGreeting: request.customerGreeting,
            publicAnswer: request.publicAnswer || buildCustomerSafeAnswer(context, quotePayload),
            publicQuote: quotePayload && quotePayload.success && quotePayload.label !== LABELS.UNKNOWN
              ? { minINR: quotePayload.quote.minINR, maxINR: quotePayload.quote.maxINR, currency: quotePayload.quote.currency, label: quotePayload.label }
              : null,
            publicEvidence: (quotePayload?.evidence || [])
              .filter((e) => e.label === LABELS.VERIFIED)
              .map((e) => ({ field: e.field, label: e.label })),
            publicSources: quotePayload?.snapshot ? [{ title: "GARUDA Official Pricing", ref: quotePayload.snapshot.source.ref, retrievedAt: quotePayload.snapshot.source.retrievedAt }] : [],
            questionsForCustomer: quotePayload?.missingInputs || [],
            nextSteps: ["Scope confirm", "50% milestone plan", "Proposal draft"],
            // Customer-safe: lexicon-derived understanding ONLY (never raw private text)
            understanding: {
              business: analysisRun.analysis?.business || null,
              requestedFeatures: analysisRun.analysis?.requestedFeatures || null,
            },
            nextQuestion: nextQ,
          },
          private: {
            // K3 FIX: founder floor is the FOUNDER-DEFINED cost/margin floor,
            // NEVER the public list price. Undefined → null with UNKNOWN label.
            internalFloor: founderFloor.valueINR,
            marginGuidance: founderFloor,
            privateGuidance: negotiation.privateGuidance,
            founderAssumptions: negotiation.evidenceClasses.founderAssumptions,
            modelInference: negotiation.evidenceClasses.modelInference,
            closeProbability: negotiation.closeProbability,
            negotiationIntelligence: {
              verifiedCustomerStatements: negotiation.evidenceClasses.verifiedCustomerStatements,
              unknowns: negotiation.unknowns,
            },
            clientMemoryPrivate: clientMemory.found ? clientMemory.clients : null,
            // §12 meeting capabilities — founder-facing
            analysis: analysisRun.analysis,
            riskAlerts: [
              ...(quotePayload?.warnings || []),
              ...(Array.isArray(analysisRun.analysis?.risks?.value)
                ? analysisRun.analysis.risks.value.map((r) => r.risk)
                : []),
              ...(negotiation.unknowns || []).slice(0, 3).map((u) => `UNKNOWN: ${u}`),
            ],
            pricingGuidance: quotePayload?.success
              ? {
                  recommendedQuote: quotePayload.derived?.recommendedQuote || null,
                  negotiationRange: quotePayload.derived?.negotiationRange || null,
                  founderFloor,
                  label: quotePayload.label,
                }
              : { label: LABELS.UNKNOWN, note: "No quote built — scope inputs missing" },
            proposalAction: {
              ready: Boolean(context.serviceType || analysisRun.analysis?.requestedFeatures?.value),
              action: "POST /api/founder-intelligence/proposal/draft with confirmed scope",
              missing: analysisRun.missingInputs || [],
            },
            nextQuestionSuggestion: nextQ,
          },
        });
        result = split.success ? { sessionId, label: split.label, hasCustomerView: true, hasFounderPrivate: true } : split;
        evidence = quotePayload?.evidence || [];
      }
      break;
    }
    case INTENTS.GENERAL:
    default: {
      // LLM conversational path — numbers still never come from the LLM.
      const llmAdapter = deps.llmAdapter || require("../../rag/llmAdapter");
      const mission = motherMissionContext();
      const contextBlocks = [];
      if (wisdom.length) contextBlocks.push("GARUDA memory lessons:\n" + wisdom.map((w) => `- ${w.text}`).join("\n"));
      if (clientMemory.found) contextBlocks.push("Known clients:\n" + clientMemory.clients.map((c) => `- ${c.displayName} (${c.companyName})`).join("\n"));
      if (mission) contextBlocks.push("Mother Brain mission: " + JSON.stringify(mission));
      contextBlocks.push("Founder Intelligence services available: pricing, research, negotiation, proposal, feasibility, client memory, meeting mode. For prices use the pricing engine — never state amounts from memory.");
      try {
        const answer = await llmAdapter.generateAnswer({
          query: text,
          context: contextBlocks.join("\n\n"),
          systemPrompt:
            "You are GARUDA Founder Intelligence — a private business copilot for founder Praveen Mahawar. " +
            "Answer in natural Roman Hindi (Hinglish) unless asked otherwise. " +
            "STRICT RULE: never state prices, budgets, competitor offers, or closing probabilities unless they appear in the provided context with evidence labels. If a number is not in context, say it is UNKNOWN.",
          metadata: { capability: "founder_intelligence.general" },
        });
        result = {
          success: true,
          label: LABELS.PARTIAL,
          answer: answer?.answer || null,
          providerNote: answer?.warnings?.length ? answer.warnings.join(",") : null,
          evidence: [
            makeEvidence({
              field: "llm_answer",
              label: LABELS.PARTIAL,
              value: true,
              source: { type: "live", ref: "llmAdapter", retrievedAt: null },
              note: "Conversational reasoning only — no numbers sourced from LLM",
            }),
          ],
        };
      } catch (err) {
        result = { success: false, label: LABELS.BLOCKED, reason: "LLM_UNAVAILABLE", errorMessage: err.message };
      }
      evidence = result.evidence || [];
      break;
    }
  }

  // ---------- RESEARCH EVIDENCE MERGE ----------
  if (research) {
    evidence = [...evidence, ...research.evidence];
    sources = [...sources, ...research.sources];
  }

  const summary = summarizeEvidence(evidence);
  const finalLabel = request.forceUnknown ? LABELS.UNKNOWN : summary.label;
  const confidence = computeConfidence(evidence, finalLabel);
  const nextQuestions = suggestNextQuestions([
    ...(result?.missingInputs || []),
    ...summary.unknownFields,
  ]);

  const response = {
    success: result ? result.success !== false : false,
    intent: classification.intent,
    intentConfidence: classification.confidence,
    matchedCues: classification.matchedCues,
    context,
    memory: { client: clientMemory, wisdom },
    research: research ? { label: research.label, sourceCount: research.sources.length, findings: research.findings.length, layers: research.layers || null } : null,
    result,
    evidence,
    sources,
    label: finalLabel,
    confidence,
    nextQuestions,
    unknownFields: summary.unknownFields,
    warnings: [
      ...new Set([
        ...(summary.staleSources.length ? ["PRICE_SNAPSHOT_STALE"] : []),
        ...(result?.warnings || []),
        ...(research?.warnings || []),
      ]),
    ],
    durationMs: Date.now() - startedAt,
  };

  // §2 INTELLIGENCE PANEL — deterministic per-intent assembly for the UI right rail
  if (!split) {
    response.panel = buildPanel({
      intent: classification.intent,
      result,
      evidence,
      sources,
      research,
      clientMemory,
      label: finalLabel,
      warnings: response.warnings,
      unknownFields: summary.unknownFields,
      nextQuestions,
    });
  }

  if (split) {
    // Meeting mode: TWO SEPARATE server-side structures
    response.customerView = split.customerView;
    response.founderPrivate = split.founderPrivate;
    delete response.result; // meeting results are already split
  }

  // ---------- AUDIT (§17: metadata only, never chain-of-thought) ----------
  appendAudit({
    ts: new Date().toISOString(),
    intent: response.intent,
    confidence: response.intentConfidence,
    label: response.label,
    confidenceScore: confidence.score,
    evidenceCount: evidence.length,
    unknownFields: response.unknownFields,
    assumptionsCount: result?.assumptions?.length || 0,
    warnings: response.warnings,
    recommendationClass: response.panel?.recommendation ? "present" : "absent",
    founderDecision: null,
    outcome: null,
    hadCustomerView: Boolean(response.customerView),
    hadFounderPrivate: Boolean(response.founderPrivate),
    durationMs: response.durationMs,
  });

  return response;
}

/**
 * §13 confidence — REUSES the existing GARUDA confidenceEngine with
 * evidence-label mapped weights. Never invents a score basis.
 */
function computeConfidence(evidence = [], label = LABELS.UNKNOWN) {
  try {
    const typeMap = {
      [LABELS.VERIFIED]: "runtime_verified",
      [LABELS.PARTIAL]: "single_source",
      [LABELS.ESTIMATE]: "manual_verification",
      [LABELS.PLANNED]: "manual_verification",
      [LABELS.UNKNOWN]: "single_source",
      [LABELS.BLOCKED]: "test_fail",
      [LABELS.CONTRADICTED]: "contradicted",
      [LABELS.FOUNDER_JUDGMENT]: "founder_approval",
    };
    const items = evidence.map((e) => typeMap[e.label] || "manual_verification");
    if (evidence.some((e) => e.note === "STALE_SNAPSHOT")) items.push("stale_evidence");
    if (evidence.length >= 3) items.push("multiple_sources");
    const raw = confidenceEngine.calculateConfidence({
      sourceAgent: "founder_intelligence",
      evidence: items,
      timestamp: new Date().toISOString(),
    });
    // Honest banding — engine score is CAPPED by the evidence label class
    // so a lexicon analysis can never masquerade as CANONICAL certainty.
    const caps = {
      [LABELS.VERIFIED]: 0.9,
      [LABELS.PARTIAL]: 0.7,
      [LABELS.ESTIMATE]: 0.6,
      [LABELS.PLANNED]: 0.5,
      [LABELS.FOUNDER_JUDGMENT]: 0.7,
      [LABELS.CONTRADICTED]: 0.49,
      [LABELS.UNKNOWN]: 0.29,
      [LABELS.BLOCKED]: 0.29,
    };
    let score = Math.min(raw.confidence, caps[label] ?? 0.7);
    let level = confidenceEngine.classifyConfidence(score);
    return {
      score: Math.round(score * 100) / 100,
      level,
      engine: "garudaIntelligence.confidenceEngine (reused, label-capped)",
      evidenceCount: evidence.length,
      labelAligned: label,
    };
  } catch {
    return { score: null, level: "UNKNOWN", engine: "garudaIntelligence.confidenceEngine (reused)", evidenceCount: evidence.length, labelAligned: label };
  }
}

/**
 * §2/§3 next-question suggestions — deterministic, derived from missing
 * inputs only. Fixed phrasing (safe for customer-screen reuse).
 */
function suggestNextQuestions(missing = []) {
  const rules = [
    [/scope\./i, "Scope kitna hai — pages ya features kitne?"],
    [/timeline|deadline/i, "Delivery deadline kya hai?"],
    [/budget/i, "Budget range kitni hai?"],
    [/headcount|user \+ customer/i, "Team aur customers ki approximate count kitni?"],
    [/integration|vendor/i, "Exact integration kaunsa chahiye (gateway/API)?"],
    [/business category/i, "Business category kya hai?"],
    [/meetingSessionId/i, "Meeting session start karein pehle?"],
    [/calc\b/i, "Kaunsa calculation chahiye (margin/break-even/discount)?"],
    [/title\|requirements/i, "Proposal title aur requirements likh dein?"],
  ];
  const out = [];
  for (const m of missing) {
    for (const [re, q] of rules) {
      if (re.test(String(m)) && !out.includes(q)) out.push(q);
    }
  }
  return out.slice(0, 4);
}

/**
 * §2 INTELLIGENCE PANEL — 10 deterministic sections for the right rail.
 * Founder-facing (this response is never exposed to customers).
 */
function buildPanel({ intent, result, evidence, sources, research, clientMemory, label, warnings, unknownFields, nextQuestions }) {
  const panel = {
    recommendation: null,
    pricing: null,
    evidence: evidence || [],
    sources: sources || [],
    assumptions: [],
    missing: [...(unknownFields || [])],
    risks: [],
    negotiation: null,
    nextAction: null,
    clientContext: null,
  };

  const q = result?.quote;
  if (result?.derived) {
    panel.pricing = {
      quote: q || null,
      derived: result.derived,
      lineItems: result.lineItems || [],
      methodology: result.methodology || null,
      label: result.label || label,
    };
    panel.assumptions = result.derived.assumptions || [];
  }

  switch (intent) {
    case INTENTS.PRICING:
      panel.recommendation = q
        ? `Quote ₹${q.minINR.toLocaleString("en-IN")} – ₹${q.maxINR.toLocaleString("en-IN")} (${label})`
        : `Quote unavailable (${label}) — inputs missing`;
      panel.nextAction = q ? "Scope confirm karo → proposal draft karo" : "Missing inputs bharo → dobara quote";
      panel.missing.push(...(result?.missingInputs || []));
      break;
    case INTENTS.ANALYZE: {
      const a = result?.analysis || {};
      panel.recommendation = a.business?.value
        ? `${(Array.isArray(a.business.value) ? a.business.value.join(", ") : a.business.value)} — complexity ${a.technicalComplexity?.value?.complexity || "unknown"} (${a.technicalComplexity?.label || "UNKNOWN"})`
        : `Analysis incomplete (${result?.label || label})`;
      panel.risks = a.risks?.value || [];
      panel.missing.push(...(a.missingInformation?.value || []));
      panel.assumptions = result?.assumptions || [];
      panel.nextAction = "Missing inputs fill karo → pricing";
      break;
    }
    case INTENTS.NEGOTIATION:
      panel.recommendation = result?.privateGuidance?.[0]?.guidance
        ? `Top guidance: ${result.privateGuidance[0].guidance}`
        : `Negotiation analysis ready (${label})`;
      panel.negotiation = {
        unknowns: result?.unknowns || [],
        closeProbability: result?.closeProbability || null,
        privateGuidance: result?.privateGuidance || [],
        recommendedCounter: result?.recommendedCounter || null,
        walkAwayINR: result?.walkAwayINR ?? null,
      };
      panel.nextAction = "Counter confirm → customer ko reply";
      break;
    case INTENTS.PROPOSAL:
      panel.recommendation = result?.created
        ? `Proposal ${result.proposalId} created — ₹${(result.proposedAmountINR || 0).toLocaleString("en-IN")}`
        : `Proposal not created: ${result?.reason || label}`;
      panel.nextAction = result?.created ? "Proposal review → PDF → send" : `Blocked: ${(result?.missingInputs || []).join(", ") || label}`;
      panel.missing.push(...(result?.missingInputs || []));
      break;
    case INTENTS.RESEARCH:
      panel.recommendation = `Research ${research?.findings?.length || 0} findings, ${research?.sourceCount || 0} sources (${label})`;
      panel.sources = sources || [];
      panel.nextAction = "Sources review → pricing me apply";
      break;
    case INTENTS.FEASIBILITY:
      panel.recommendation = result?.success
        ? `Calculator ${result.calcType} done (${result.label})`
        : `Calculation blocked: ${result?.reason || (result?.missingInputs || []).join(",") || label}`;
      panel.missing.push(...(result?.missingInputs || []));
      panel.nextAction = "Inputs complete karo → recheck";
      break;
    case INTENTS.CLIENT_MEMORY:
      panel.recommendation = clientMemory?.found
        ? `${clientMemory.clients.length} client match(es) in memory`
        : "No client memory match";
      panel.clientContext = clientMemory?.found ? clientMemory.clients : null;
      panel.nextAction = clientMemory?.found ? "History review → continue conversation" : "Client profile create karo";
      break;
    default:
      panel.recommendation = result?.answer
        ? String(result.answer).slice(0, 240)
        : `Ready (${label})`;
      panel.nextAction = nextQuestions?.length ? `Next: ${nextQuestions[0]}` : "Command mode use karo";
  }

  if (warnings?.length) panel.risks = [...panel.risks, ...warnings.map((w) => ({ risk: w, label: LABELS.PARTIAL }))];
  panel.nextAction = panel.nextAction || (nextQuestions?.length ? `Next: ${nextQuestions[0]}` : null);
  return panel;
}

function detectCalcType(text) {
  const t = String(text).toLowerCase();
  if (t.includes("break") && t.includes("even")) return "breakEven";
  if (t.includes("discount")) return "discountImpact";
  if (t.includes("milestone") || t.includes("deposit")) return "milestoneSplit";
  if (t.includes("monthly vs annual") || (t.includes("monthly") && t.includes("annual"))) return "monthlyVsAnnual";
  if (t.includes("setup") && (t.includes("recurring") || t.includes("monthly"))) return "setupRecurring";
  if (t.includes("infrastructure") || t.includes("server cost")) return "infrastructureCost";
  if (t.includes("support") && t.includes("cost")) return "supportCost";
  if (t.includes("acv") || t.includes("annual contract")) return "acv";
  if (t.includes("recurring") || t.includes("annual revenue")) return "recurringRevenue";
  if (t.includes("margin") || t.includes("profit")) return "margin";
  return null;
}

function buildCustomerSafeAnswer(context, quotePayload) {
  if (!quotePayload || quotePayload.success === false || quotePayload.label === LABELS.UNKNOWN) {
    return "Scope pehle confirm karte hain — uske baad exact quote share kiya jayega.";
  }
  return `GARUDA scope ke basis par list quote ₹${quotePayload.quote.minINR.toLocaleString("en-IN")} – ₹${quotePayload.quote.maxINR.toLocaleString("en-IN")} (${quotePayload.label} evidence).`;
}

module.exports = {
  handle,
  classifyIntent,
  extractContext,
  detectCalcType,
  INTENTS,
  appendAudit,
  motherMissionContext,
};
