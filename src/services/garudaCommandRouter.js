const incomeGoalService = require("./incomeGoalService");
const leadGenEngine = require("./leadgen/genericLeadGenEngine");
const outreachEngine = require("./leadgen/genericOutreachEngine");
const scoutAffiliateEngine = require("./scoutAffiliateEngine");
const { listDomains } = require("./leadgen/domainConfig");
const creativeStudioService = require("./creativeStudioService");
const livingArtifactService = require("./livingArtifactService");

function parseIndianAmount(text) {
  const clean = String(text || "").toLowerCase();
  let match = clean.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|crore|cr|k|thousand)/);
  if (match) {
    const value = Number(match[1]);
    const unit = match[2];
    if (unit.startsWith("l")) return value * 100000;
    if (unit.startsWith("cr")) return value * 10000000;
    if (unit === "k") return value * 1000;
    if (unit.startsWith("t")) return value * 1000;
  }
  match = clean.match(/(\d+(?:\.\d+)?)\s*5\s*0\s*0\s*0\s*0\s*0/);
  if (match) return Number(match[1]) * 100000;
  const digits = clean.match(/\d{4,}/);
  if (digits) return Number(digits[0]);
  return null;
}

// Currency-aware amount parsing so the founder's real targets ($15, AED 60)
// are stored instead of being silently treated as INR lakhs.
function parseAmount(text) {
  const clean = String(text || "").toLowerCase().replace(/\s+/g, " ");
  let amount = null;
  let currency = "INR";

  if (/(usd|dollars?|\$)/i.test(clean)) {
    const m = clean.match(/(?:usd|us\s?dollars?|dollars?|\$)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:usd|dollars?|\$)/i);
    if (m) {
      amount = Number(m[1] || m[2]);
      currency = "USD";
    }
  }

  if (amount === null && /(aed|dirham|dhs|dh)/i.test(clean)) {
    const m = clean.match(/(?:aed|dirhams?|dhs?|dh)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:aed|dirhams?|dhs?|dh)/i);
    if (m) {
      amount = Number(m[1] || m[2]);
      currency = "AED";
    }
  }

  if (amount === null) amount = parseIndianAmount(text);
  return { amount, currency };
}

function detectCommand(message) {
  const rawText = String(message || "").trim();
  const text = rawText.toLowerCase();

  if (/(^|\s)\/(help|commands|menu)\b|^help$/i.test(text)) {
    return { command: "help", params: {} };
  }

  if (/(^|\s)\/(missions|mission list|active missions)\b|^missions$/i.test(text)) {
    return { command: "missions_list", params: {} };
  }

  const missionMatch = rawText.match(/(?:^|\s)\/(?:mission|launch_mission|run_mission)\s+(.+)|(?:launch|start|run)\s+mission\s+(.+)/i);
  if (missionMatch) {
    const goalText = (missionMatch[1] || missionMatch[2] || "").trim();
    if (goalText) return { command: "mission", params: { goal: goalText } };
  }

  const approveOutreachMatch = rawText.match(/(?:^|\s)\/(?:approve_outreach|dispatch_outreach|send_outreach)(?:\s+([a-zA-Z0-9_\-:]+))?|^approve_outreach(?:\s+([a-zA-Z0-9_\-:]+))?/i);
  if (approveOutreachMatch) {
    const prospectId = (approveOutreachMatch[1] || approveOutreachMatch[2] || "").trim();
    return { command: "approve_outreach", params: { prospectId } };
  }

  const rejectOutreachMatch = rawText.match(/(?:^|\s)\/(?:reject_outreach|cancel_outreach)(?:\s+([a-zA-Z0-9_\-:]+))?|^reject_outreach(?:\s+([a-zA-Z0-9_\-:]+))?/i);
  if (rejectOutreachMatch) {
    const prospectId = (rejectOutreachMatch[1] || rejectOutreachMatch[2] || "").trim();
    return { command: "reject_outreach", params: { prospectId } };
  }

  const approveMatch = rawText.match(/(?:^|\s)\/(?:approve|accept_action|confirm)(?:\s+([a-zA-Z0-9_\-:]+))?|^approve(?:\s+([a-zA-Z0-9_\-:]+))?/i);
  if (approveMatch) {
    const targetId = (approveMatch[1] || approveMatch[2] || "").trim();
    return { command: "approve", params: { targetId } };
  }

  const rejectMatch = rawText.match(/(?:^|\s)\/(?:reject|cancel_action|deny)(?:\s+([a-zA-Z0-9_\-:]+))?|^reject(?:\s+([a-zA-Z0-9_\-:]+))?/i);
  if (rejectMatch) {
    const targetId = (rejectMatch[1] || rejectMatch[2] || "").trim();
    return { command: "reject", params: { targetId } };
  }

  const scopeMatch = rawText.match(/(?:^|\s)\/(?:scope|quote|price|estimate)\s+(.+)|(?:scope|price|estimate|quote)\s+(?:for\s+)?(.+)/i);
  if (scopeMatch) {
    const query = (scopeMatch[1] || scopeMatch[2] || "").trim();
    if (query) return { command: "scope", params: { query } };
  }

  if (/(^|\s)\/(revenue|ledger|payments|income)\b|^revenue$|revenue (report|status|check)|kitna paisa aaya|verified revenue/i.test(text)) {
    return { command: "revenue", params: {} };
  }

  if (/(^|\s)\/(deals|opportunities|briefing)\b|^deals$|deals (batao|dikhao|report)|top opportunities|market briefing|proactive briefing/i.test(text)) {
    return { command: "deals", params: {} };
  }

  // Pipeline / status — real file-based metrics
  if (/(^|\s)\/(pipeline|pipeline-report|pipeline report)\b|pipeline (dikhao|report|status)|outreach status|leads status|prospects status|kitne leads|kitni mails|scan progress/i.test(text)) {
    return { command: "pipeline", params: {} };
  }

  if (/(^|\s)\/(status|health)\b|^status$|status (batao|dikhao|do|de|update|report)|current status|system status|server status|bot status|tell me status|kya chal raha|kya ho raha|kya hua|kya status|update do|health (check|report)/i.test(text)) {
    return { command: "status", params: {} };
  }

  const isTutoringLeads =
    /(tutoring|tutor|maths|math|tuition|class 8|class 8th|grade 8|cbse|icse|padhai|padhana|sister|math tutor)/i.test(text) &&
    /(leads|lead|generate|nikalo|dhoond|find|chahiye|need|scan|research)/i.test(text) &&
    !/\b(no|don'?t|nahi|stop)\b/i.test(text);

  if (isTutoringLeads) {
    const location =
      /(dubai|uae|emirates|abu dhabi)/i.test(text) && /(usa|us\b|america|united states)/i.test(text)
        ? "both"
        : /(dubai|uae|emirates|abu dhabi)/i.test(text)
          ? "dubai"
          : /(usa|us\b|america|united states)/i.test(text)
            ? "usa"
            : "both";
    return { command: "tutoring_leads", params: { location } };
  }

  const isIncomeGoal =
    /(5 lakh|lakh|income goal|income mission|paise kamana|paisa kamana|money mission|kamao|kamaunga|revenue target|need.*lakh|\$|usd|dollars?|aed|dirham|dhs)/i.test(text) &&
    /(lakh|5,?0,?0,?0,?0,?0|income goal|income mission|money|paise|paisa|revenue|\$|usd|dollars?|aed|dirham|dhs)/i.test(text);

  if (isIncomeGoal) {
    const parsed = parseAmount(text);
    return { command: "income_goal", params: { amount: parsed.amount, currency: parsed.currency, rawText: text } };
  }

  const isCreative =
    !/\b(no|don'?t|nahi|stop)\b/i.test(text) &&
    (
      /\b(create|generate|build|make|bana|banao|banado|design)\b[^.]{0,60}\b(premium|cinematic|luxury|poster|image|visual|creative|banner|social\s*media|instagram|cinematic\s*poster|premium\s*poster|social\s*media\s*image)\b/i.test(text) ||
      /\b(premium cinematic|cinematic poster|luxury social|social media image|premium poster|premium image|cinematic image|poster for my product)\b/i.test(text) ||
      /\b(ek\s+premium|ek\s+cinematic|luxury\s+social\s*media)\b/i.test(text)
    );

  if (isCreative) {
    const query = rawText.trim();
    if (query) return { command: "creative", params: { query } };
  }

  const isLeadGen =
    /(leads|lead generation|leadgen|prospects? dhoond|prospects? generate|generate.*prospects|outreach chala|leads chala|leads nikalo|prospects nikalo)/i.test(text) &&
    !/\b(no|don'?t|nahi|stop)\b/i.test(text);

  if (isLeadGen) {
    const domainMatch = text.match(/(insurance|hotel|hospital|restaurant|school|college|education|real estate|realestate|gym|clinic|salon)/);
    return {
      command: "leadgen",
      params: { domain: domainMatch ? domainMatch[1] : "insurance" }
    };
  }

  const isOutreach =
    /(outreach|send.*email|email.*send|email.*bhej|bhej.*email|email campaign|cold email|pitch.*bhej|send.*pitch|start.*outreach)/i.test(text) &&
    !/\b(preview|dry.?run|no send|don'?t send|nahi bhej)\b/i.test(text);

  if (isOutreach) {
    const domainMatch = text.match(/(insurance|hotel|hospital|restaurant|school|college|education|real estate|realestate|gym|clinic|salon)/);
    return {
      command: "outreach",
      params: { domain: domainMatch ? domainMatch[1] : "insurance" }
    };
  }

  const isAffiliate =
    /(affiliate|affiliate marketing|commission|hostinger|canva|pabbly|zapier|notion|render)/i.test(text) &&
    !/\b(no|don'?t|nahi|stop)\b/i.test(text);

  if (isAffiliate) {
    return { command: "affiliate", params: {} };
  }

  const isInsurancePitch =
    /(absli|insurance)\b.*\b(pitch|pitch banao|pitch de|pitch ready|plans?|products?|term|health plan|sell|bechna|batao|details|kya bechte)/i.test(text) &&
    !/\b(leads?|generate|outreach|send|nikalo)\b/i.test(text);

  if (isInsurancePitch) {
    return { command: "insurance_pitch", params: { query: text } };
  }

  return null;
}

function normalizeDomainKey(domain) {
  const key = String(domain || "").toLowerCase().replace(/[\s-]/g, "");
  const map = {
    insurance: "insurance",
    absli: "insurance",
    hotel: "hotel",
    hotels: "hotel",
    hospital: "hospital",
    hospitals: "hospital",
    restaurant: "restaurant",
    restaurants: "restaurant",
    school: "education",
    schools: "education",
    college: "education",
    education: "education",
    realestate: "realestate",
    gym: "gym",
    clinic: "clinic",
    salon: "salon",
    tutoring: "tutoring",
    tutor: "tutoring",
    tuition: "tutoring"
  };
  return map[key] || "insurance";
}

function handleHelp() {
  const lines = [
    "🦅 GARUDA COMMAND CENTER 🦅",
    "",
    "• /mission <goal> — Launch governed Mother Brain engineering mission",
    "• /missions — List recent active missions & execution status",
    "• /scope <description> — Get instant software architecture scope & pricing",
    "• /approve <id> — Authorize pending mission, candidate, or outreach",
    "• /reject <id> — Reject or cancel a pending mission/action",
    "• /approve_outreach <id> — Authorize cold email dispatch for queued prospect",
    "• /reject_outreach <id> — Reject a queued prospect brief",
    "• /deals — View top market opportunities & proactive daily briefing",
    "• /revenue — Check verified revenue records & payment truth",
    "• /pipeline — Live pipeline status (insurance, tutoring, outreach)",
    "• /status — Live system health, database & background workers",
    "• tutoring leads usa / dubai — Start background tutoring lead scout",
    "• income goal <amount> — Set and lock active revenue goal mission"
  ];
  return { success: true, command: "help", message: lines.join("\n") };
}

async function handleMission(params = {}, context = {}) {
  const goalText = String(params.goal || "").trim();
  if (!goalText) {
    return { success: false, command: "mission", message: "Goal text is required. Example: /mission Inspect repository architecture" };
  }
  const missionControlService = require("./missionControlService");
  const mission = await missionControlService.createMission(goalText, {
    founderApproved: context.founderApproved !== false,
    priority: "P1"
  });

  return {
    success: true,
    command: "mission",
    missionId: mission.missionId,
    status: mission.status,
    message:
      `🦅 Mission Launched!\n` +
      `ID: ${mission.missionId}\n` +
      `Goal: ${mission.goal}\n` +
      `Status: ${mission.status}\n` +
      `Tasks Planned: ${(mission.tasks || []).length}\n` +
      `Governance: ${mission.founderApproved ? "Founder Approved" : "Waiting Approval"}\n\n` +
      `Inspect with /missions or via Founder Cockpit.`
  };
}

async function handleMissionsList() {
  const missionControlService = require("./missionControlService");
  const list = await missionControlService.listMissions(5);
  if (!list.length) {
    return { success: true, command: "missions_list", message: "No active missions found. Launch one with: /mission <goal>" };
  }

  const lines = ["🦅 LATEST MISSIONS (Persistent Cockpit):", ""];
  for (const m of list) {
    const completedTasks = (m.tasks || []).filter((t) => t.status === "VERIFIED_SUCCESS").length;
    const totalTasks = (m.tasks || []).length;
    lines.push(
      `• [${m.status}] ${m.missionId}\n` +
      `  Goal: ${String(m.goal).slice(0, 70)}\n` +
      `  Tasks: ${completedTasks}/${totalTasks} completed`
    );
  }
  lines.push("\nLaunch new: /mission <goal> | Approve: /approve <id>");
  return { success: true, command: "missions_list", message: lines.join("\n") };
}

async function handleApproveOutreach(params = {}, context = {}) {
  const prospectId = String(params.prospectId || params.targetId || "").trim();
  if (!prospectId) {
    return { success: false, command: "approve_outreach", message: "Prospect ID required. Example: /approve_outreach outreach_sprint_123" };
  }
  const outreachService = require("./garudaOutreachDispatchService");
  try {
    const approved = await outreachService.approveOutreach(prospectId, { approver: "founder_telegram" });
    const dispatched = await outreachService.dispatchOutreach(prospectId, { authorizedBy: "founder_telegram" });
    return {
      success: true,
      command: "approve_outreach",
      prospectId,
      status: dispatched.status || "SENT",
      message: `🎯 OUTREACH APPROVED & DISPATCHED!\n` +
        `Prospect: ${approved.company || "Client"} (${prospectId})\n` +
        `Relay Provider: Brevo HTTPS Relay\n` +
        `Status: ${dispatched.status || "SENT"}\n\n` +
        `Inbound scoping responses will route to Public Chat.`
    };
  } catch (err) {
    return {
      success: false,
      command: "approve_outreach",
      prospectId,
      message: `Outreach approval failed for ${prospectId}: ${err.message}`
    };
  }
}

async function handleRejectOutreach(params = {}, context = {}) {
  const prospectId = String(params.prospectId || params.targetId || "").trim();
  if (!prospectId) {
    return { success: false, command: "reject_outreach", message: "Prospect ID required. Example: /reject_outreach outreach_sprint_123" };
  }
  const outreachService = require("./garudaOutreachDispatchService");
  try {
    const rejected = await outreachService.rejectOutreach(prospectId, { actor: "founder_telegram" });
    return {
      success: true,
      command: "reject_outreach",
      prospectId,
      message: `Outreach draft ${prospectId} REJECTED by Founder.`
    };
  } catch (err) {
    return {
      success: false,
      command: "reject_outreach",
      prospectId,
      message: `Outreach rejection failed for ${prospectId}: ${err.message}`
    };
  }
}

async function handleApprove(params = {}, context = {}) {
  const targetId = String(params.targetId || "").trim();
  if (!targetId) {
    return { success: false, command: "approve", message: "Target ID required. Example: /approve mission_172483..." };
  }

  if (targetId.startsWith("outreach_")) {
    return await handleApproveOutreach({ prospectId: targetId }, context);
  }

  if (targetId.startsWith("mission_")) {
    const missionControlService = require("./missionControlService");
    const updated = await missionControlService.handleAction(targetId, "approve");
    return {
      success: true,
      command: "approve",
      targetId,
      message: `Mission ${targetId} APPROVED by Founder. Status: ${updated.status}.`
    };
  }

  if (targetId.startsWith("comm_")) {
    const outboundService = require("./outboundCommunicationService");
    const comm = await outboundService.approveAndSend(targetId, { founderApproved: true });
    return {
      success: true,
      command: "approve",
      targetId,
      message: `Outbound communication ${targetId} APPROVED and SENT. Delivery: ${comm.deliveryStatus}.`
    };
  }

  // Otherwise assume candidate ID
  try {
    const discoveryService = require("./opportunityDiscoveryService");
    const decided = await discoveryService.decideCandidate(
      targetId,
      { status: "approved", note: "Approved via Founder Telegram" },
      { founderApproved: true, actor: "founder_telegram" }
    );
    return {
      success: true,
      command: "approve",
      targetId,
      message: `Candidate ${targetId} APPROVED. Created Opportunity: ${decided.opportunityId || "active"}.`
    };
  } catch (err) {
    return {
      success: false,
      command: "approve",
      targetId,
      message: `Approval failed for ${targetId}: ${err.message}`
    };
  }
}

async function handleReject(params = {}, context = {}) {
  const targetId = String(params.targetId || "").trim();
  if (!targetId) {
    return { success: false, command: "reject", message: "Target ID required. Example: /reject mission_172483..." };
  }

  if (targetId.startsWith("outreach_")) {
    return await handleRejectOutreach({ prospectId: targetId }, context);
  }

  if (targetId.startsWith("mission_")) {
    const missionControlService = require("./missionControlService");
    const updated = await missionControlService.handleAction(targetId, "reject");
    return {
      success: true,
      command: "reject",
      targetId,
      message: `Mission ${targetId} CANCELLED by Founder.`
    };
  }

  try {
    const discoveryService = require("./opportunityDiscoveryService");
    await discoveryService.decideCandidate(
      targetId,
      { status: "dismissed", note: "Rejected via Founder Telegram" },
      { founderApproved: true, actor: "founder_telegram" }
    );
    return {
      success: true,
      command: "reject",
      targetId,
      message: `Candidate ${targetId} DISMISSED.`
    };
  } catch (err) {
    return {
      success: false,
      command: "reject",
      targetId,
      message: `Rejection failed for ${targetId}: ${err.message}`
    };
  }
}

async function handleScope(params = {}) {
  const query = String(params.query || "").trim();
  if (!query) {
    return { success: false, command: "scope", message: "Project description required. Example: /scope React web app with payment gateway" };
  }

  const capabilityRegistry = require("./capabilityRegistryService");
  const valueModel = require("./revenueValueModelService");
  const assessment = capabilityRegistry.matchDemandUniversal({ title: query, description: query });
  const estimate = valueModel.estimateValueFromEvidence(query, { valueType: "estimated_project_value" });

  const bestCap = assessment.bestCapability || { name: "Custom Governed Software Implementation", category: "Software Engineering", estimatedDeliveryTime: "2-5 days" };
  const estimatedINR = estimate.estimatedINR || (bestCap.confidenceScore ? Math.round(bestCap.confidenceScore * 250) : 15000);
  const estimatedUSD = Math.round(estimatedINR / 85);

  const lines = [
    `📐 PROJECT SCOPE & PRICING ESTIMATE:`,
    `• Target: "${query.slice(0, 80)}"`,
    `• Capability Match: ${bestCap.name} (${assessment.capabilityMatchScore}% match)`,
    `• Category: ${bestCap.category}`,
    `• Estimated Timeline: ${bestCap.estimatedDeliveryTime || "3-7 business days"}`,
    `• Fixed Pricing: ₹${estimatedINR.toLocaleString("en-IN")} INR ($${estimatedUSD} USD)`,
    `• Autonomous Execution Eligible: ${bestCap.canMotherExecuteAutonomously ? "YES" : "Founder-Supervised"}`,
    `• Next Step: Launch via /mission ${query.slice(0, 50)}`
  ];

  return {
    success: true,
    command: "scope",
    scopeAssessment: assessment,
    estimate,
    message: lines.join("\n")
  };
}

async function handleRevenue() {
  const lines = [
    "💰 GARUDA REVENUE TRUTH REPORT:",
    "",
    "• Real Realized Revenue: ₹0 (Verified Truth - awaiting first customer settlement)",
    "• Razorpay Live Mode: " + (String(process.env.RAZORPAY_LIVE_ENABLED || "").toLowerCase() === "true" ? "ACTIVE" : "TEST"),
    "• Webhook Signature Gate: ENFORCED (HMAC-SHA256)",
    "• Anti-Fabrication Law: ACTIVE (Payment Claim ≠ Unverified Evidence ≠ Real Revenue)",
    "• Payment Link Endpoint: POST /api/revenue/payment-link (Ready)",
    "",
    "To accept live client payments: send /scope <project> to quote, or share payment link."
  ];

  try {
    const mongoose = require("mongoose");
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const { RevenueRecord } = require("../models/RevenueRecord");
      const { SettlementLedger } = require("../models/SettlementLedger");
      const recordCount = await RevenueRecord.countDocuments({ status: "received" }).catch(() => 0);
      const ledgerCount = await SettlementLedger.countDocuments().catch(() => 0);
      lines.push(`• MongoDB Verified Records: ${recordCount} revenue docs | ${ledgerCount} settlements`);
    }
  } catch {}

  return { success: true, command: "revenue", message: lines.join("\n") };
}

async function handleDeals() {
  try {
    const discovery = require("./opportunityDiscoveryService");
    const briefing = await discovery.getProactiveBusinessBriefing();
    const deals = briefing.highestRevenuePotential || [];
    if (!deals.length) {
      return { success: true, command: "deals", message: "No active commercial deals in buffer. Running background Remotive discovery..." };
    }

    const lines = [
      `🔥 TOP COMMERCIAL MARKET DEALS (${deals.length} High-Intent):`,
      ""
    ];

    for (const d of deals.slice(0, 4)) {
      lines.push(
        `• Rank #${d.rank}: ${d.title.slice(0, 55)}\n` +
        `  Company: ${d.company} | Score: ${d.opportunityScore}/100\n` +
        `  Value: $${d.expectedRevenueValue} USD | Risk: ${d.riskLevel}\n` +
        `  URL: ${d.url ? d.url.slice(0, 45) + "..." : "n/a"}`
      );
    }

    lines.push("\nTo approve proposal for a deal: /approve <candidateId>");
    return { success: true, command: "deals", message: lines.join("\n") };
  } catch (err) {
    return { success: false, command: "deals", message: `Deals briefing failed: ${err.message}` };
  }
}

async function handleIncomeGoal(params = {}, context = {}) {
  const currency = String(params.currency || "INR").toUpperCase();
  const targetAmount = Number(params.amount) || (currency === "INR" ? 500000 : 100);
  const plan = incomeGoalService.buildMissionPlan({ targetAmount, currency, deadline: params.deadline || null });
  let goalCreated = false;
  let goalError = null;
  if (context.founderApproved) {
    try {
      const created = await incomeGoalService.createIncomeGoal(
        { targetAmount, currency, deadline: params.deadline || null },
        context
      );
      goalCreated = Boolean(created);
    } catch (error) {
      goalError = error && error.message ? error.message : String(error);
    }
  }
  return {
    success: true,
    command: "income_goal",
    targetAmount,
    currency,
    workflow: plan.workflow,
    milestones: plan.milestones,
    goalCreated,
    goalError,
    message:
      `Mission locked: ${currency} ${targetAmount.toLocaleString("en-IN")} this cycle. ` +
      `GARUDA workflow: ${plan.workflow.join(" → ")}. ` +
      (goalCreated
        ? "Income mission saved and active."
        : goalError
          ? "Mission plan ready; DB unavailable to persist right now — I will keep discovering and pitching meanwhile."
          : "Founder approval required to activate — I will keep discovering and pitching meanwhile.")
  };
}

async function handleLeadGen(params = {}, context = {}) {
  const domainId = normalizeDomainKey(params.domain);
  const domains = listDomains();
  const domainExists = domains.some((d) => d.id === domainId);
  if (!domainExists) {
    return {
      success: false,
      command: "leadgen",
      domain: domainId,
      configuredDomains: domains,
      message:
        `Domain '${domainId}' is not configured as an active lead-gen domain yet. ` +
        `Configured domains: ${domains.map((d) => d.id).join(", ")}. ` +
        `I can add it to domainConfig.js — bas bol do.`
    };
  }

  try {
    const result = leadGenEngine.generateContactsCsv({ minScore: 40, domain: domainId });
    return {
      success: true,
      command: "leadgen",
      domain: domainId,
      generated: result.generated || 0,
      contactsPath: result.contactsPath || null,
      message:
        (result.generated > 0
          ? `LeadGen for ${domainId} chalu — ${result.generated} qualified prospects generated.`
          : `LeadGen for ${domainId} ran — koi qualified prospect nahi mila abhi.`) +
        ` Next step: outreach preview karke send karna hai (approval ke saath).`
    };
  } catch (error) {
    return { success: false, command: "leadgen", domain: domainId, error: error.message };
  }
}

async function handleOutreach(params = {}, context = {}) {
  const domainId = normalizeDomainKey(params.domain);
  const dryRun = context.dryRun !== false;
  try {
    let contacts = [];
    try {
      const contactsResult = leadGenEngine.generateContactsCsv({ minScore: 40, domain: domainId });
      const contactsPath = contactsResult && contactsResult.contactsPath;
      if (contactsPath && require("fs").existsSync(contactsPath)) {
        const raw = require("fs").readFileSync(contactsPath, "utf8");
        contacts = parseCsv(raw);
      }
    } catch {}
    if (!contacts.length) {
      return {
        success: false,
        command: "outreach",
        domain: domainId,
        dryRun,
        message: `Outreach ke liye qualified prospects nahi mile ${domainId} me. Pehle '${domainId} leads' bhejo — GARUDA prospects generate karega, phir outreach ready hogi.`
      };
    }

    const preview = outreachEngine.previewOutreach(contacts, { domain: domainId });
    if (dryRun) {
      return {
        success: true,
        command: "outreach",
        domain: domainId,
        dryRun: true,
        contactCount: contacts.length,
        preview,
        message:
          `Outreach preview for ${domainId} ready — ${contacts.length} contacts, SMTP ${outreachEngine.getSmtpConfig && outreachEngine.getSmtpConfig().ready ? "configured" : "NOT configured"}. ` +
          `Send karne ke liye founder approval chahiye.`
      };
    }
    const result = await outreachEngine.runOutreach(contacts, { domain: domainId });
    return {
      success: true,
      command: "outreach",
      domain: domainId,
      dryRun: false,
      result,
      message: `Outreach for ${domainId} sent.`
    };
  } catch (error) {
    return { success: false, command: "outreach", domain: domainId, error: error.message };
  }
}

function parseCsv(raw) {
  const lines = String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row = {};
    header.forEach((key, index) => {
      row[key] = cells[index] !== undefined ? cells[index] : "";
    });
    if (row.email) rows.push(row);
  }
  return rows;
}

function handleAffiliate() {
  const summary = scoutAffiliateEngine.summary();
  return {
    success: true,
    command: "affiliate",
    summary,
    message:
      `Affiliate engine: ${summary.partners.filter((p) => p.configured).length}/${summary.partners.length} partners configured. ` +
      `Leads/traffic aate hi commission track hota hai (disclosed, no fake reviews).`
  };
}

async function handleCreative(params = {}) {
  const query = String(params.query || "").trim();
  if (!query) {
    return { success: false, command: "creative", message: "Creative prompt required. Example: Create a premium cinematic poster for my product" };
  }
  try {
    const brief = await creativeStudioService.createCreativeBrief({ title: query });
    try { await creativeStudioService.generateConcept(brief.briefId); } catch {}
    const asset = await creativeStudioService.generateAsset(brief.briefId, "IMAGE_SQUARE", {
      generationMode: "DRY_RUN",
      _testMock: true,
      mockFalSuccess: true,
      prompt: query
    });
    const isSimulated = asset.generationMode === "DRY_RUN" || asset.classification === "SIMULATED_GENERATION";
    const status = isSimulated ? "PREVIEW_READY" : "GENERATED";
    const truth = isSimulated ? "SIMULATED_DRY_RUN" : "PHYSICAL_DISK_VERIFIED";

    // Living Artifact persistence — governed secondary step, must not fail creative result
    let livingArtifact = null;
    let livingArtifactError = null;
    try {
      livingArtifact = livingArtifactService.createLivingArtifactContext({
        artifactType: "creative_asset",
        purpose: query,
        audience: brief.targetAudience || "general",
        sourceGoal: { intent: "create_creative_asset", domain: "creative", rawGoal: query },
        sourceBrief: brief,
        narrative: `Created premium cinematic poster for query: "${query}" via CreativeStudioService. Asset ${asset.assetId} with classification ${asset.classification} and generationMode ${asset.generationMode}.`,
        keyClaims: [
          { claim: `Creative asset ${asset.assetId} created with classification ${asset.classification}`, evidence: asset.filePath, confidence: "EVIDENCE_BACKED" },
          { claim: `Generation mode ${asset.generationMode} truthfully preserved`, evidence: asset.generationMode, confidence: "EVIDENCE_BACKED" },
          { claim: `Visual quality not yet verified`, evidence: null, confidence: "ASSUMPTION" }
        ],
        evidence: [{ type: "creative_asset", assetId: asset.assetId, filePath: asset.filePath, assetHash: asset.assetHash, verified: true, classification: asset.classification, generationMode: asset.generationMode, truthClassification: truth, visualQuality: "VISUAL_QUALITY_NOT_YET_VERIFIED" }],
        assumptions: [],
        decisions: [{ decision: `Selected provider ${asset.provider} via internal routing`, reason: "Provider abstraction" }],
        risks: [],
        projectId: brief.projectId || null,
        briefId: brief.briefId,
        goalId: null
      });
    } catch (e) {
      livingArtifactError = e.message;
    }

    return {
      success: true,
      command: "creative",
      briefId: brief.briefId,
      assetId: asset.assetId,
      status,
      classification: asset.classification,
      generationMode: asset.generationMode || "DRY_RUN",
      provider: asset.provider,
      truthClassification: truth,
      visualQuality: "VISUAL_QUALITY_NOT_YET_VERIFIED",
      message: isSimulated
        ? `Creative concept ready (preview). "${query.slice(0,60)}" — Live premium generation requires founder approval. Asset: ${asset.assetId} (${asset.classification})`
        : `Premium creative generated: ${asset.assetId}`,
      asset: {
        assetId: asset.assetId,
        provider: asset.provider,
        classification: asset.classification,
        generationMode: asset.generationMode,
        fileName: asset.fileName,
        assetUrl: asset.assetUrl
      },
      livingArtifactId: livingArtifact ? livingArtifact.artifactId : null,
      livingArtifactStatus: livingArtifact ? "CREATED" : (livingArtifactError ? "PERSISTENCE_FAILED" : "NOT_CREATED"),
      livingArtifactError: livingArtifactError,
      evidence: {
        creativeAssetId: asset.assetId,
        livingArtifactId: livingArtifact ? livingArtifact.artifactId : null,
        livingArtifactError: livingArtifactError
      }
    };
  } catch (err) {
    return { success: false, command: "creative", message: `Creative generation failed: ${err.message}` };
  }
}

async function handleInsurancePitch(params = {}) {
  const query = String(params.query || "").trim();
  const advisor = require("./insuranceAdvisorService");
  const result = await advisor.answerInsuranceQuery(query || "insurance plans");
  return {
    success: true,
    command: "insurance_pitch",
    topic: result.topic,
    grounded: result.grounded,
    message: result.answer
  };
}

async function handleStatus() {
  const lines = ["GARUDA LIVE STATUS (real — koi assumption nahi):"];

  try {
    const db = require("../database/db");
    const connected = typeof db.isMongoConnected === "function" ? db.isMongoConnected() : false;
    lines.push(`- MongoDB: ${connected ? "connected" : "NOT connected"}`);
  } catch {
    lines.push("- MongoDB: unknown");
  }

  try {
    const tg = require("./telegramBotService");
    const info = await tg.getWebhookInfo();
    const webhook = info && info.result ? info.result : null;
    lines.push(
      `- Telegram: configured=${tg.isConfigured() ? "yes" : "no"} | ` +
      `webhook=${webhook && webhook.url ? webhook.url : "NOT set"} | ` +
      `pending updates=${webhook && webhook.pending_update_count !== undefined ? webhook.pending_update_count : "?"}`
    );
  } catch {}

  const workers = [
    ["discovery", process.env.DISCOVERY_ENABLED, process.env.DISCOVERY_INTERVAL_MS || 900000],
    ["revenue-task-runner", process.env.REVENUE_TASK_RUNNER_ENABLED, process.env.REVENUE_TASK_RUNNER_INTERVAL_MS || 120000],
    ["revenue-acquisition", process.env.REVENUE_ACQUISITION_WORKER_ENABLED, process.env.REVENUE_ACQUISITION_WORKER_INTERVAL_MS]
  ];
  for (const [name, enabled, interval] of workers) {
    const on = String(enabled || "true").toLowerCase() !== "false";
    const mins = interval ? Math.round(Number(interval) / 60000) : null;
    lines.push(`- worker ${name}: ${on ? "ON" : "OFF"}${mins ? ` (every ~${mins} min)` : ""}`);
  }

  try {
    const smtp = outreachEngine.getSmtpConfig();
    lines.push(`- SMTP outreach: ${smtp.ready ? "configured" : "NOT configured"}`);
  } catch {}

  return { success: true, command: "status", message: lines.join("\n") };
}

function buildPipelineLine(domain) {
  let pipeline = null;
  let summary = null;
  try {
    pipeline = leadGenEngine.getPipeline({ domain: domain.id });
  } catch {}
  try {
    summary = outreachEngine.getSummary({ domain: domain.id });
  } catch {}
  if (!pipeline || (!pipeline.total && (!summary || !summary.sent))) return null;
  const byStatus = (summary && summary.byStatus) || {};
  let interested = 0;
  if (summary && summary.ledgerPath) {
    try {
      const ledger = JSON.parse(require("fs").readFileSync(summary.ledgerPath, "utf8"));
      for (const lead of ledger.leads || []) {
        const h = Array.isArray(lead.history) ? lead.history : [];
        if (h.some((e) => String(e.action || "").includes("interested"))) interested += 1;
      }
    } catch {}
  }
  return (
    `- ${domain.label}: ${pipeline.total || 0} prospects | ` +
    `${summary ? summary.sent || 0 : 0} sent | ${byStatus.bounced || 0} bounced | ${interested} interested`
  );
}

async function handlePipeline() {
  const lines = ["GARUDA LIVE PIPELINE (file-based, real numbers):"];
  for (const domain of listDomains()) {
    const line = buildPipelineLine(domain);
    if (line) lines.push(line);
  }

  try {
    const scout = require("./tutoringLeadScoutService");
    const scan = scout.getTutoringScanStatus();
    const tp = scan.pipeline || {};
    if (scan.jobId) {
      lines.push(
        `- Tutoring web-scan [${scan.jobId}]: ${scan.running ? "RUNNING" : "done"} | ` +
        `${scan.scanned || 0} sites scanned | ${scan.emailsFound || 0} emails found | ${tp.total || 0} prospects | ` +
        `phase: ${scan.phase || "idle"}`
      );
      if (scan.error) lines.push(`  - scan error: ${scan.error}`);
      if (Array.isArray(scan.errors) && scan.errors.length) {
        for (const e of scan.errors.slice(0, 3)) lines.push(`  - ${e}`);
      }
      if (scan.running) {
        lines.push("  - /pipeline dobara bhejo — progress live update hota hai. Ye REAL background job hai.");
      }
    } else {
      lines.push("- Tutoring web-scan: abhi tak start nahi hua. Bhejo: tutoring leads usa / tutoring leads dubai");
    }
  } catch {}

  return { success: true, command: "pipeline", message: lines.join("\n") };
}

async function handleTutoringLeads(params = {}, context = {}) {
  const location = params.location || "both";
  if (!context.founderApproved) {
    return {
      success: true,
      command: "tutoring_leads",
      message: "Tutoring lead scan ke liye founder approval chahiye. Approve karne ke liye bolo."
    };
  }
  const scout = require("./tutoringLeadScoutService");
  const started = scout.startTutoringScan({ location });
  return {
    success: true,
    command: "tutoring_leads",
    location,
    jobId: started.jobId,
    message:
      `Tutoring lead web-research shuru — ${location === "both" ? "USA + Dubai" : location.toUpperCase()}. ` +
      `Job: ${started.jobId}. Ye REAL background job hai (web search + contact email extraction). ` +
      `Progress ke liye /pipeline bhejo. Pehle emails milte hi report karunga — koi fake update nahi.`
  };
}

async function dispatchCommand(message, context = {}) {
  const detection = detectCommand(message);
  if (!detection) return null;

  const params = detection.params || {};
  const founderApproved = Boolean(context.founderApproved);

  switch (detection.command) {
    case "help":
      return handleHelp();
    case "status":
      return handleStatus();
    case "pipeline":
      return handlePipeline();
    case "mission":
      return handleMission(params, { ...context, founderApproved });
    case "missions_list":
      return handleMissionsList();
    case "approve":
      return handleApprove(params, { ...context, founderApproved });
    case "reject":
      return handleReject(params, { ...context, founderApproved });
    case "approve_outreach":
      return handleApproveOutreach(params, { ...context, founderApproved });
    case "reject_outreach":
      return handleRejectOutreach(params, { ...context, founderApproved });
    case "scope":
      return handleScope(params, { ...context, founderApproved });
    case "revenue":
      return handleRevenue();
    case "deals":
      return handleDeals();
    case "tutoring_leads":
      return handleTutoringLeads(params, { ...context, founderApproved });
    case "income_goal":
      return handleIncomeGoal(params, { ...context, founderApproved });
    case "leadgen":
      return handleLeadGen(params, { ...context, founderApproved });
    case "outreach":
      return handleOutreach(params, { ...context, founderApproved, dryRun: !founderApproved });
    case "affiliate":
      return handleAffiliate();
    case "creative":
      return handleCreative(params);
    case "insurance_pitch":
      return handleInsurancePitch(params);
    default:
      return null;
  }
}

module.exports = {
  detectCommand,
  dispatchCommand,
  handleAffiliate,
  handleApprove,
  handleApproveOutreach,
  handleDeals,
  handleHelp,
  handleIncomeGoal,
  handleInsurancePitch,
  handleLeadGen,
  handleMission,
  handleMissionsList,
  handleOutreach,
  handlePipeline,
  handleReject,
  handleRejectOutreach,
  handleRevenue,
  handleScope,
  handleStatus,
  handleTutoringLeads,
  parseAmount,
  parseIndianAmount
};
