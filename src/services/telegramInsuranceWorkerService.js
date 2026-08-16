// GARUDA Telegram Insurance Worker Service
//
// Public-facing insurance Q&A worker for the Telegram bot. Any user may ask
// insurance questions; GARUDA answers from canonical governed ABSLI knowledge
// (MongoDB Knowledge -> verified file chunks) WITHOUT fabricating facts.
//
// Flow:
//   USER -> QUESTION -> INTENT -> GROUNDED ANSWER -> FOLLOW-UP QUESTION
//   -> CONVERSATION MEMORY -> NEED DETECTION -> QUALIFICATION
//   -> INSURANCE LEAD -> OPPORTUNITY / FOUNDER GATE
//
// Governance:
//   - Answer first; never force a sales pitch.
//   - Only minimal necessary info is collected (name, contact, age band, goal).
//   - InsuranceLead is created with source=telegram, conversation context,
//     detected intent, qualification state, timestamp.
//   - InsuranceLead -> Opportunity handoff is FOUNDER-GATED (founderApproval).
//   - No automatic sales messages.
//   - No fabricated insurance facts: when a fact cannot be verified the bot
//     says so and asks for clarification instead of guessing.
const { InsuranceLead, LEAD_STATUSES } = require("../models/InsuranceLead");
const { Opportunity } = require("../models/Opportunity");
const mongoose = require("mongoose");
const insuranceAdvisorService = require("./insuranceAdvisorService");
const conversationService = require("./conversationService");

const MIN_INITIAL_NAME_LENGTH = 2;

// ---- Conversation memory (per Telegram chat) ----
function threadIdForChat(chatId) {
  return `telegram:${String(chatId)}`;
}

async function loadMemory(chatId) {
  try {
    const threadId = threadIdForChat(chatId);
    return await conversationService.getOrCreateThread(threadId);
  } catch {
    return { threadId: threadIdForChat(chatId), messages: [] };
  }
}

async function remember(chatId, role, text, meta = {}) {
  const threadId = threadIdForChat(chatId);
  const messages = [{
    role,
    text: String(text || "").slice(0, 2000),
    mode: "telegram_insurance",
    evidence: meta.evidence || null,
    timestamp: new Date()
  }];
  return conversationService.appendMessages(threadId, messages);
}

async function recentContext(chatId, limit = 6) {
  const thread = await loadMemory(chatId);
  const messages = Array.isArray(thread.messages) ? thread.messages : [];
  return messages
    .filter((m) => m && m.mode !== QUALIFICATION_STATE_MODE)
    .slice(-limit)
    .map((m) => ({
      role: m.role,
      text: m.text
    }));
}

// ---- Qualification state persistence (Mongo ConversationThread; per-chat) ----
// The multi-turn qualification context (name, coverageType, contact, signals,
// leadId) is persisted as a control message inside the chat's own thread, so it
// survives separate updates, worker restarts (where the thread store is Mongo),
// and is isolated per Telegram chat. No shared in-memory singleton is used.
const QUALIFICATION_STATE_MODE = "telegram_insurance_state";

async function loadQualificationState(chatId) {
  try {
    const thread = await loadMemory(chatId);
    const messages = Array.isArray(thread.messages) ? thread.messages : [];
    const lastState = [...messages].reverse().find((m) => m && m.mode === QUALIFICATION_STATE_MODE);
    if (lastState && typeof lastState.text === "string" && lastState.text.trim()) {
      const parsed = JSON.parse(lastState.text);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // Corrupt/missing state => start fresh
  }
  return null;
}

async function saveQualificationState(chatId, ctx) {
  const stateText = JSON.stringify(ctx || {});
  if (!stateText || stateText.length > 2000) return false;
  return conversationService.appendMessages(threadIdForChat(chatId), [{
    role: "system",
    text: stateText,
    mode: QUALIFICATION_STATE_MODE,
    timestamp: new Date()
  }]);
}

// ---- Intent & need detection ----
function detectInsuranceIntent(text) {
  return insuranceAdvisorService.detectInsuranceIntent(text);
}

// Signals that a user is expressing an actual insurance need (vs. just asking).
function detectNeedSignals(text) {
  const t = String(text || "").toLowerCase();
  const signals = [];
  if (/\b(need|chahiye|want|batao|interested|le lunga|ke liye|apply|shuru|buy|khareedna|quote|plan batao)\b/.test(t)) signals.push("explicit_interest");
  if (/\b(name|mera naam|i am|main hoon|my name)\b/.test(t)) signals.push("name_provided");
  if (/(@|gmail|yahoo|outlook|hotmail|\b[0-9]{10}\b)/.test(t)) signals.push("contact_provided");
  if (/\b(age|age\s*\d+|saal|years old|year old)\b/.test(t)) signals.push("age_provided");
  if (/\b(budget|kitna|amount|premium|cost|price|monthly|per month)\b/.test(t)) signals.push("budget_context");
  if (/\b(term|health|child|education|cancer|retirement|pension|savings|investment|life)\b/.test(t)) signals.push("coverage_type");
  return signals;
}

// ---- Qualification (collect only minimal necessary info) ----
const QUESTION_SEQUENCE = [
  {
    key: "name",
    test: (ctx) => !ctx.name || String(ctx.name).trim().length < MIN_INITIAL_NAME_LENGTH,
    ask: (ctx) => `Aapka naam kya hai? (Bas pahla naam kaafi hai.)`
  },
  {
    key: "coverageType",
    test: (ctx) => !ctx.coverageType,
    ask: (ctx) => `Aap kis type ka coverage dekh rahe hain? (Term protection, health/medical, child education, ya savings/retirement?)`
  },
  {
    key: "contact",
    test: (ctx) => !ctx.contact,
    ask: (ctx) => `Ek contact chahiye taaki GARUDA aapko sahi plan details bhej sake — mobile number ya email? (Optional bhi hai, skip karein toh chalta hai.)`
  }
];

function parseQualificationAnswer(text, current = {}) {
  const t = String(text || "").trim();
  const next = { ...current };
  if (!next.name) {
    const nameMatch = t.match(/^(?:mera naam|my name|i am|main hoon|name is|ye raha)\s+([A-Za-z]{2,})/i) || t.match(/^([A-Za-z]{2,})/);
    if (nameMatch && nameMatch[1] && !/^(yes|no|term|health|savings|retirement|skip|nahi|ok|theek)$/i.test(nameMatch[1])) {
      next.name = nameMatch[1].replace(/[,.\s]+$/, "");
    }
  }
  if (!next.coverageType) {
    const coverage = t.match(/\b(term|health|child education|education|savings|retirement|pension|life|critical illness|cancer)\b/i);
    if (coverage) next.coverageType = coverage[1].toLowerCase();
  }
  if (!next.contact) {
    const emailMatch = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    const phoneMatch = t.match(/\b(\+?\d{10,15})\b/);
    if (emailMatch) next.contact = emailMatch[0];
    else if (phoneMatch) next.contact = phoneMatch[1];
  }
  return next;
}

function qualificationComplete(ctx) {
  return Boolean(ctx && ctx.name && String(ctx.name).trim().length >= MIN_INITIAL_NAME_LENGTH && ctx.coverageType);
}

// ---- Lead creation (founder-gated handoff) ----
async function createInsuranceLeadFromConversation(chatId, ctx, options = {}) {
  const firstName = String(ctx.name || "").trim().split(/\s+/)[0];
  const contact = String(ctx.contact || "").trim();
  const email = /@/.test(contact) ? contact : "";
  const phone = /@/.test(contact) ? "" : contact;

  // Emails are unique on InsuranceLead; if a matching lead already exists, reuse.
  let existing = null;
  if (email) {
    existing = await InsuranceLead.findOne({ email });
  } else if (phone) {
    existing = await InsuranceLead.findOne({ phone });
  }
  if (existing) {
    existing.source = "telegram";
    existing.status = "qualified";
    existing.tags = Array.from(new Set([...(existing.tags || []), "telegram", ctx.coverageType].filter(Boolean)));
    existing.notes = (existing.notes ? `${existing.notes}\n` : "") + `Telegram chat ${chatId}: ${ctx.coverageType} interest.`;
    existing.audit = existing.audit || [];
    existing.audit.push({ action: "telegram_qualified", at: new Date(), detail: `chatId=${chatId}, intent=${ctx.coverageType}` });
    await existing.save();
    return { lead: existing.toJSON(), reused: true };
  }

  const lead = await InsuranceLead.create({
    email: email || `telegram:${chatId}@garuda.local`,
    firstName,
    source: "telegram",
    status: "qualified",
    phone,
    tags: ["telegram", ctx.coverageType].filter(Boolean),
    notes: `Telegram chat ${chatId}. Coverage interest: ${ctx.coverageType}. Detected signals: ${(ctx.signals || []).join(", ")}`,
    audit: [{ action: "telegram_qualified", at: new Date(), detail: `chatId=${chatId}, intent=${ctx.coverageType}` }]
  });
  return { lead: lead.toJSON(), reused: false };
}

// Foundered-gated InsuranceLead -> Opportunity handoff. Never runs without
// explicit founder approval.
async function promoteLeadToOpportunity(leadId, context = {}) {
  const approved = context.founderApproved === true || String(context.founderApproved || "").trim().toLowerCase() === "true";
  if (!approved) {
    return { promoted: false, reason: "founder_approval_required" };
  }
  if (!mongoose.Types.ObjectId.isValid(String(leadId || ""))) {
    return { promoted: false, reason: "invalid_lead_id" };
  }
  const lead = await InsuranceLead.findById(leadId);
  if (!lead) return { promoted: false, reason: "lead_not_found" };

  const opportunity = await Opportunity.create({
    title: `Insurance opportunity — ${lead.coverageType || "qualified"}`,
    client: lead.firstName || lead.email,
    source: "telegram_insurance_lead",
    stage: "prospect",
    potentialValue: 0,
    currency: "INR",
    probability: 25,
    notes: `From InsuranceLead ${lead._id} via Telegram chat. Detected intent: ${lead.coverageType || "qualified"}. Founder-approved handoff.`,
    tags: ["insurance", "telegram", lead.coverageType || "qualified"].filter(Boolean),
    priority: "UNMEASURED",
    valueModel: {
      status: "UNKNOWN",
      estimatedINR: null,
      valueType: "insurance_opportunity_value",
      note: "Insurance deal value is UNMEASURED until a quote/approval establishes it. Never mixed with received revenue."
    },
    origin: "insurance_lead"
  });

  lead.status = "qualified";
  lead.audit = lead.audit || [];
  lead.audit.push({ action: "founder_approved_opportunity", at: new Date(), detail: `opportunityId=${opportunity._id}` });
  await lead.save();

  return { promoted: true, opportunityId: opportunity.id, leadId: lead.id };
}

// ---- Main conversation handler ----
async function handleInsuranceMessage(chatId, text, options = {}) {
  const clean = String(text || "").trim();
  if (!clean) return { handled: false, reason: "empty_message" };

  const ctxKey = `tg:${chatId}`;
  const stateStore = options.stateStore || null;
  let current;
  if (stateStore) {
    current = (stateStore.get(ctxKey) || { name: "", coverageType: "", contact: "", signals: [] });
  } else {
    const persisted = await loadQualificationState(chatId);
    current = persisted || { name: "", coverageType: "", contact: "", signals: [] };
  }
  const persistState = async (ctx) => {
    if (stateStore) stateStore.set(ctxKey, ctx);
    else await saveQualificationState(chatId, ctx);
  };

  const signals = detectNeedSignals(clean);
  current.signals = Array.from(new Set([...(current.signals || []), ...signals]));
  const updated = parseQualificationAnswer(clean, current);

  await remember(chatId, "user", clean, { evidence: { signals } });

  // 1) Grounded answer first (answer-first governance; no pitch).
  let advisor = null;
  try {
    advisor = await insuranceAdvisorService.answerInsuranceQuery(clean);
  } catch {
    advisor = null;
  }

  // 2) Need detection: if the user expresses interest, start qualification.
  const needs = signals.length > 0 || detectInsuranceIntent(clean);
  let reply = advisor && advisor.answer ? advisor.answer : null;
  let qualificationStep = null;

  if (needs) {
    qualificationStep = QUESTION_SEQUENCE.find((step) => step.test(updated));
    if (qualificationStep) {
      reply = `${reply ? reply + "\n\n" : ""}${qualificationStep.ask(updated)}`;
    } else if (qualificationComplete(updated)) {
      if (updated.leadId) {
        reply = `${reply ? reply + "\n\n" : ""}${updated.name}, aapka interest pehle hi note ho chuka hai. Koi aur insurance sawal ho toh zaroor poochhiye.`;
        await persistState(updated);
        await remember(chatId, "garuda", reply);
        return {
          handled: true,
          mode: "qualified",
          reply,
          leadId: updated.leadId,
          conversationState: updated
        };
      }
      const leadResult = await createInsuranceLeadFromConversation(chatId, updated, options);
      reply = `${reply ? reply + "\n\n" : ""}Dhanyavaad ${updated.name}! GARUDA ne aapka interest note kar liya. Aapke plan details ke liye ek GARUDA advisor jald hi aapko guide karega. ${options.referenceLink ? `Detail: ${options.referenceLink}` : ""}`;
      updated.leadId = leadResult.lead.id;
      updated.leadReused = leadResult.reused;
      await persistState(updated);
      await remember(chatId, "garuda", reply);
      return {
        handled: true,
        mode: "qualified",
        reply,
        leadId: leadResult.lead.id,
        conversationState: updated
      };
    }
  }

  if (!reply) {
    reply = "GARUDA yahan aapke insurance sawalon ke liye hai. Term, health, child education, savings/retirement — kisi bhi topic par puchhiye. Koi figure main bina source ke nahi bataunga.";
  }

  await persistState(updated);
  await remember(chatId, "garuda", reply);
  return {
    handled: true,
    mode: qualificationStep ? "qualifying" : "answered",
    reply,
    advisorGrounded: advisor ? advisor.grounded : false,
    signals,
    qualificationStep: qualificationStep ? qualificationStep.key : null,
    conversationState: updated
  };
}

module.exports = {
  MIN_INITIAL_NAME_LENGTH,
  QUESTION_SEQUENCE,
  QUALIFICATION_STATE_MODE,
  createInsuranceLeadFromConversation,
  detectInsuranceIntent,
  detectNeedSignals,
  handleInsuranceMessage,
  loadMemory,
  loadQualificationState,
  parseQualificationAnswer,
  promoteLeadToOpportunity,
  qualificationComplete,
  recentContext,
  remember,
  saveQualificationState,
  threadIdForChat
};