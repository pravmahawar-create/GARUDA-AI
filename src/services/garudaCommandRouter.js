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

function detectCommand(message) {
  const text = String(message || "").trim().toLowerCase();

  const isIncomeGoal =
    /(5 lakh|lakh|income goal|income mission|paise kamana|paisa kamana|money mission|kamao|kamaunga|revenue target|target.*week|need.*lakh)/i.test(text) &&
    /(lakh|5,?0,?0,?0,?0,?0|income goal|income mission|money|paise|paisa|revenue)/i.test(text);

  if (isIncomeGoal) {
    return { command: "income_goal", params: { amount: parseIndianAmount(text) } };
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
    salon: "salon"
  };
  return map[key] || "insurance";
}

async function handleIncomeGoal(params = {}, context = {}) {
  const targetAmount = Number(params.amount) || 500000;
  const plan = incomeGoalService.buildMissionPlan({ targetAmount, deadline: params.deadline || null });
  let goalCreated = false;
  let goalError = null;
  if (context.founderApproved) {
    try {
      const created = await incomeGoalService.createIncomeGoal({ targetAmount }, context);
      goalCreated = Boolean(created);
    } catch (error) {
      goalError = error && error.message ? error.message : String(error);
    }
  }
  return {
    success: true,
    command: "income_goal",
    targetAmount,
    workflow: plan.workflow,
    milestones: plan.milestones,
    goalCreated,
    goalError,
    message:
      `Mission locked: INR ${targetAmount.toLocaleString("en-IN")} this cycle. ` +
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

async function dispatchCommand(message, context = {}) {
  const detection = detectCommand(message);
  if (!detection) return null;

  const params = detection.params || {};
  const founderApproved = Boolean(context.founderApproved);

  switch (detection.command) {
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
  parseIndianAmount
};
