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
  if (/\b(age|age\s*\d+|saal|saal ka|years old|year old|umar|umra)\b/.test(t)) signals.push("age_provided");
  if (/\b(budget|kitna|amount|premium|cost|price|monthly|per month|haz\w*\s*(\/|per)?\s*month)\b/.test(t)) signals.push("budget_context");
  if (/\b(goal|target|soch raha|soch rahi|plan karna|karna chahta|karana hai)\b/.test(t)) signals.push("goal_provided");
  if (/\b(term|health|child|education|cancer|retirement|pension|savings|investment|life)\b/.test(t)) signals.push("coverage_type");
  if (/(4\s*wheeler|four\s*wheeler|4-wheeler|four-wheel|car\b|hatchback|suv|sedan)/.test(t)) signals.push("car_owner");
  if (/\b(graduate|graduation|completed\s*(my)?\s*graduation|degree complete)\b/.test(t)) signals.push("graduation_provided");
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
  if (!next.age) {
    const ageMatch = t.match(/\b(\d{1,2})\s*(?:saal|years old|year old|years|age)\b/i) || t.match(/\bage\s*[:=]?\s*(\d{1,2})\b/i);
    if (ageMatch) {
      const age = Number(ageMatch[1]);
      if (age >= 18 && age <= 80) next.age = age;
    }
  }
  if (!next.budget) {
    const budgetMatch = t.match(/(?:premium|budget|monthly|per month|amount|kitna|cost|price)\s*[:=]?\s*(?:rs\.?|inr|₹)?\s*([\d,]{4,})/i) || t.match(/\b(?:rs\.?|inr|₹)\s*([\d,]{4,})\b/i);
    if (budgetMatch) next.budget = Number(String(budgetMatch[1]).replace(/,/g, ""));
  }
  if (!next.goal) {
    const goalMatch = t.match(/\b(?:goal|target)\s*[:=]?\s*([a-z ,]+)/i);
    if (goalMatch && goalMatch[1].trim().length > 1) next.goal = goalMatch[1].trim().replace(/[.!?]+$/, "");
  }
  if (next.hasCar === undefined) {
    if (/(4\s*wheeler|four\s*wheeler|4-wheeler|four-wheel|hatchback|suv|sedan|i\s+own\s+a\s+car|mere\s+paas\s+car|car\s+hai|car\s+rakhta)/i.test(t)) next.hasCar = true;
    else if (/\bno car|car nahi|koi car nahi|nahi hai car\b/i.test(t)) next.hasCar = false;
  }
  if (next.hasCar && next.carOwnershipYears === undefined) {
    const yearsMatch = t.match(/(\d{1,2})\s*(?:saal|years|year|yr)s?\s*(?:se|since|ke)?/i);
    if (yearsMatch && Number(yearsMatch[1]) >= 2) next.carOwnershipYears = Number(yearsMatch[1]);
  }
  if (next.hasCar && next.carInsuranceValue === undefined) {
    const valueMatch = t.match(/(?:insurance\s*value|cover|value|sum)\s*[:=]?\s*(?:rs\.?|inr|₹)?\s*([\d,]{4,})/i) || t.match(/\b(?:rs\.?|inr|₹)\s*([\d,]{4,})\b/i) || t.match(/(\d{1,2}(?:\.\d+)?)\s*lakh/i);
    if (valueMatch) {
      let value = Number(String(valueMatch[1]).replace(/,/g, ""));
      if (/lakh/i.test(valueMatch[0])) value = value * 100000;
      if (value >= 200000) next.carInsuranceValue = value;
    }
  }
  if (next.isGraduate === undefined && /\b(graduate|graduation|completed\s*(my)?\s*graduation|degree complete|post.?graduate|b\.com|b\.tech|b\.sc|ba\b|m\.com|m\.tech)\b/i.test(t)) {
    next.isGraduate = true;
  }
  return next;
}

function qualificationComplete(ctx) {
  return Boolean(ctx && ctx.name && String(ctx.name).trim().length >= MIN_INITIAL_NAME_LENGTH && ctx.coverageType);
}

// Natural, no-pressure follow-up after a grounded answer. Uses whatever context
// the user already shared (coverage type, age, budget, name) to ask one relevant
// question that moves toward qualification — without forcing a sales pitch.
function buildFollowUp(ctx = {}, advisor = null) {
  const topic = (advisor && advisor.topic) || String(ctx.coverageType || "").toLowerCase();
  const budget = Number(ctx.budget) || null;
  const age = Number(ctx.age) || null;

  if (budget && budget >= 30000) {
    return `Aapka budget around ₹${budget.toLocaleString("en-IN")} per month rakha hai — is level par ₹30,000+ se shuru hone wale investment-first plans perfect fit hain. Aapka naam bata dein taaki main aapke hisaab se exact details tayyar kar sakun.`;
  }
  if (budget && budget > 0 && budget < 30000) {
    return `Thoda context — ₹30,000 se upar ke investment-first plans start hote hain. Aap monthly kitna set karna chahenge, aur aapki umar kya hai? Isse main sahi ballpark bata sakta hoon.`;
  }

  if (topic === "child_education" || topic === "child" || topic === "education") {
    return age ? `Aapki umar ${age} hai — bachchon ke liye education planning mein time aapka sabse bada advantage hai. Bachcha kitne saal ka hai aur kitna corpus soch rahe hain?` : `Bachchon ki education planning mein time sabse badi cheez hai. Aapka naam aur target amount bata dein taaki main ek clean picture de sakun?`;
  }
  if (topic === "retirement" || topic === "pension" || topic === "savings" || topic === "savings_investment") {
    return `Savings/retirement ke liye long-term consistency sabse zaroori hai. Aapki umar aur monthly savings budget kya hai? Us hisaab se main growth + suraksha balance dikha sakta hoon.`;
  }
  if (topic === "health" || topic === "cancer" || topic === "cancer_health") {
    return `Health cover ki planning mein age aur existing family history matter karti hai. Aapki umar kya hai, aur aap kis city mein hain? Isse main relevant health plan points bata sakta hoon.`;
  }
  if (topic === "term" || topic === "life" || topic === "family_protection") {
    if (ctx.hasCar === true && ctx.isGraduate === true) {
      return `Perfect — graduation complete hai. Agar car 2+ saal ki ownership ke saath hai aur uski insurance value ₹2 lakh+ hai, toh aap term cover ke simple eligibility route ke liye qualify karte hain. Aapki car kitne saal se hai aur uski insurance value kitni hai?`;
    }
    if (ctx.hasCar === true && ctx.isGraduate === undefined) {
      return `Bade point — agar aapke paas 4-wheeler car hai jo 2+ saal se hai aur uski insurance value ₹2 lakh+ hai, toh term cover ke liye ek simple eligibility route bhi hai. Kya aapne graduation complete ki hai? (Graduation complete hona is route ki pehli shart hai.)`;
    }
    return `Term cover ki planning mein aapki monthly income aur family liabilities sabse important hain. Aapka naam aur age bata dein taaki main aapke hisaab se cover amount ka idea de sakun.`;
  }
  if (topic === "tax") {
    return `Tax planning asaan ho sakti hai sahi product ke saath. Aapki annual income slab kya hai, aur aapne kisi tax-saving plan ke baare mein socha hai?`;
  }
  if (ctx.userName) {
    return `${ctx.userName}, koi aur sawal jo aapke mann mein ho — bilkul freely puchhiye. Aur agar aap chaahen toh aapka naam, age, aur budget batakar plan details le sakte hain.`;
  }
  return "Agar aap chaahin toh main aapke hisaab se plan details tayyar kar sakta hoon — bas naam, age, aur budget batayein.";
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

  // Conversation context (prior turns) so the bot can follow up naturally
  // instead of treating each message as an isolated question.
  const context = await recentContext(chatId, 8);
  const contextPack = {
    userName: updated.name || null,
    age: updated.age || null,
    budget: updated.budget || null,
    goal: updated.goal || null,
    coverageType: updated.coverageType || null,
    hasCar: updated.hasCar === undefined ? null : updated.hasCar,
    carOwnershipYears: updated.carOwnershipYears || null,
    carInsuranceValue: updated.carInsuranceValue || null,
    isGraduate: updated.isGraduate === undefined ? null : updated.isGraduate,
    priorTopics: (context || []).filter((m) => m.role === "user").map((m) => m.text).slice(-3)
  };

  // 1) Grounded answer first (answer-first governance; no pitch).
  let advisor = null;
  try {
    advisor = await insuranceAdvisorService.answerInsuranceQuery(clean, contextPack);
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
      reply = `${reply ? reply + "\n\n" : ""}Dhanyavaad ${updated.name}, aapne itni baat meri suni — iske liye shukriya! GARUDA ne aapka interest bahut dhyan se note kar liya hai. Aapke plan details ke liye ek GARUDA advisor jald hi aapko guide karega, bilkul aaram se. ${options.referenceLink ? `Detail: ${options.referenceLink}` : ""}`;
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

  // 3) After a grounded answer, a natural follow-up keeps the conversation
  //    warm and moves it toward qualification without any pressure.
  if (reply && !qualificationStep && needs) {
    const followUp = buildFollowUp(updated, advisor);
    if (followUp) reply = `${reply}\n\n${followUp}`;
  }

  if (!reply) {
    reply = "Koi baat nahi, main yahan hoon aapke liye. GARUDA aapke insurance sawalon ka jawab dene ke liye hai — term, health, child education, savings/retirement, jo bhi aapke mann mein ho, khul ke puchhiye. Aur koi figure main bina source ke nahi bataunga, kyunki aapka bharosa mere liye sabse important hai.";
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
  buildFollowUp,
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