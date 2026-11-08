/**
 * 🦅 GARUDA Autonomous 1-Hour Outbound Flywheel Daemon
 * Mission: Continuous, zero-spam, precision client hunting for early-stage AI startups.
 * Governance:
 *  - Rule 15: Zero-Bounce, Strict Pre-Flight MX Verification Engine
 *  - Executive Visual Standard | Founder Privacy Shield
 *  - Duplicate Suppression: Never hits the same prospect twice.
 *  - Non-stop loop mode or single-sprint execution.
 */

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const { verifyEmail } = require("../governance/verify-email-preflight");

const LOG_FILE = path.join(__dirname, "../../reports/autonomous-flywheel-dispatches.jsonl");
const STATE_FILE = path.join(__dirname, "../../data/radar/autonomous-flywheel-state.json");

function loadDispatchedSet() {
  const set = new Set();
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        if (item.target) set.add(item.target.toLowerCase());
      } catch (e) {}
    }
  }
  return set;
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    } catch (e) {}
  }
  return { totalRuns: 0, lastRun: null, totalDispatched: 0 };
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

async function runFlywheelSprint() {
  const state = loadState();
  state.totalRuns += 1;
  state.lastRun = new Date().toISOString();

  console.log("\n===============================================================");
  console.log(`🦅 GARUDA AUTONOMOUS FLYWHEEL SPRINT #${state.totalRuns}`);
  console.log(`Timestamp: ${state.lastRun}`);
  console.log("===============================================================\n");

  const alreadyDispatched = loadDispatchedSet();
  console.log(`[STATE] Historical dispatched targets: ${alreadyDispatched.size}`);

  // Pool of high-intent, direct startup opportunities
  // In addition to the first 3 dispatched, here is the verified queue
  const CANDIDATE_POOL = [
    {
      key: "assume_ai",
      to: "hello@assume-ai.com",
      company: "AssumeAI Team",
      subject: "Contract AI Engineering Bench — Production Agentic Pipelines",
      headline: "Scalable Engineering Bench for Claude Skills & SME Automations",
      body: "<p>Hi AssumeAI Engineering Team,</p><p>We are a sovereign AI systems engineering practice specializing in high-throughput agent orchestration, Supabase/Vercel pipelines, and deterministic error-handling. Available for immediate sprint support to accelerate your SME deployment roadmap.</p>"
    },
    {
      key: "nesting_navigator",
      to: "founders@nestingnavigator.com",
      company: "Nesting Navigator",
      subject: "Conversational Financial AI Platform Architecture — GARUDA-AI",
      headline: "Autonomous Financial Agents & Next.js Full-Stack Architecture",
      body: "<p>Hello Nesting Navigator Founders,</p><p>Saw your mission building an AI-guided conversational financial platform. We build full-duplex conversational agents, local vector retrieval, and deterministic financial workflows with zero-hallucination guardrails.</p>"
    }
  ];

  const host = process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in";
  const port = parseInt(process.env.GARUDA_EMAIL_PORT || "465", 10);
  const user = process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in";
  const pass = process.env.GARUDA_EMAIL_PASS;

  if (!pass) {
    console.error("❌ Missing GARUDA_EMAIL_PASS in environment.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  let dispatchedInThisSprint = 0;

  for (const item of CANDIDATE_POOL) {
    const cleanEmail = item.to.toLowerCase().trim();

    if (alreadyDispatched.has(cleanEmail)) {
      console.log(`[SKIP] Already dispatched previously to: ${cleanEmail}`);
      continue;
    }

    console.log(`\n▶ [PRE-FLIGHT] Checking Rule 15 DNS MX for ${cleanEmail}...`);
    const preflight = await verifyEmail(cleanEmail);
    if (!preflight.valid) {
      console.log(`❌ [QUARANTINE] Rejected ${cleanEmail}: ${preflight.reason}`);
      continue;
    }
    console.log(`✔ [PRE-FLIGHT PASS] ${cleanEmail} (MX: ${preflight.primaryMx})`);

    const html = `
<!DOCTYPE html>
<html>
<body style="background:#0B0F19;color:#E2E8F0;font-family:-apple-system,sans-serif;padding:30px 15px;">
  <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#111827;border:1px solid #1F2937;border-radius:12px;padding:25px;">
    <tr><td>
      <div style="font-size:18px;font-weight:800;color:#fff;">🦅 GARUDA<span style="color:#38BDF8;">-AI</span></div>
      <div style="font-size:11px;color:#9CA3AF;letter-spacing:1px;margin-bottom:20px;">AUTONOMOUS AI SYSTEMS PRACTICE</div>
      <div style="font-size:14px;line-height:1.7;color:#D1D5DB;">
        ${item.body}
        <div style="margin:20px 0;background:#0F172A;border-left:3px solid #38BDF8;padding:12px 16px;border-radius:4px;font-size:13px;color:#94A3B8;">
          • Sub-second latency LLM tool-calling & RAG<br>
          • 100% client code ownership with cryptographic deploy proof<br>
          • Rapid 48-hour pilot turnaround
        </div>
        <p style="margin-top:20px;color:#fff;">
          Praveen Mahawar<br>
          <span style="font-size:12px;color:#9CA3AF;">Founder & AI Systems Architect | GARUDA-AI</span><br>
          <a href="https://www.garudaos.in" style="color:#38BDF8;text-decoration:none;font-size:12px;">https://www.garudaos.in</a>
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      console.log(`[DISPATCH] Delivering to ${cleanEmail} (${item.company})...`);
      const info = await transporter.sendMail({
        from: `"${process.env.GARUDA_EMAIL_FROM_NAME || 'Praveen Mahawar | Founder, GARUDA-AI'}" <${user}>`,
        to: cleanEmail,
        subject: item.subject,
        html: html
      });

      console.log(`✔ DELIVERED! MessageId: ${info.messageId}`);

      const record = {
        target: cleanEmail,
        company: item.company,
        subject: item.subject,
        messageId: info.messageId,
        smtpResponse: info.response,
        sha256: crypto.createHash("sha256").update(html).digest("hex"),
        timestamp: new Date().toISOString()
      };

      fs.appendFileSync(LOG_FILE, JSON.stringify(record) + "\n", "utf8");
      alreadyDispatched.add(cleanEmail);
      dispatchedInThisSprint++;
      state.totalDispatched++;
    } catch (err) {
      console.error(`❌ Send error for ${cleanEmail}:`, err.message);
    }
  }

  saveState(state);
  console.log(`\n✔ Sprint complete. Dispatched in this run: ${dispatchedInThisSprint}. Total lifetime: ${state.totalDispatched}`);
}

// Check arguments
const isDaemon = process.argv.includes("--daemon");

if (isDaemon) {
  console.log("🦅 STARTING 1-HOUR CONTINUOUS FLYWHEEL DAEMON (Interval: 3600s)...");
  runFlywheelSprint().catch(console.error);
  setInterval(() => {
    runFlywheelSprint().catch(console.error);
  }, 3600 * 1000);
} else {
  runFlywheelSprint().catch(console.error);
}
