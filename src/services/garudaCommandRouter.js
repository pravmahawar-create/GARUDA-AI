const incomeGoalService = require("./incomeGoalService");
const leadGenEngine = require("./leadgen/genericLeadGenEngine");
const outreachEngine = require("./leadgen/genericOutreachEngine");
const scoutAffiliateEngine = require("./scoutAffiliateEngine");
const { listDomains } = require("./leadgen/domainConfig");

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
  const text = String(message || "").trim().toLowerCase();

  // Pipeline / status first — these return REAL file-based numbers so the
  // bot never guesses "status" from a conversational reply.
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
    case "status":
      return handleStatus();
    case "pipeline":
      return handlePipeline();
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
  handleIncomeGoal,
  handleInsurancePitch,
  handleLeadGen,
  handleOutreach,
  handlePipeline,
  handleStatus,
  handleTutoringLeads,
  parseAmount,
  parseIndianAmount
};
