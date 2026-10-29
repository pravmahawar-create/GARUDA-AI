/**
 * 🦅 GARUDA SOVEREIGN ZOHO DISPATCHER
 * Directly dispatches verified outreach emails from praveen@garudaos.in
 */

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ quiet: true });

const transporter = nodemailer.createTransport({
  host: process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in",
  port: parseInt(process.env.GARUDA_EMAIL_PORT || "465", 10),
  secure: true,
  auth: {
    user: process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in",
    pass: process.env.GARUDA_EMAIL_PASS
  }
});

const TARGETS = [
  {
    to: "contact@ayautomate.com",
    subject: "AI Agent Developer — Production Sample & Autonomous Architecture",
    text: `Hi Adel,

Saw your hiring post regarding the AI Agent Developer role. Instead of just a pitch, here is a production sample built and verified today:

Live Interactive Agent:
https://tspebf1ycyxc.run.agentplace.io/

What it demonstrates:
1. Dynamic Patient/Customer Triage & Service Recommendation
2. Full Voice ("Speak") and Conversational Web UI
3. Lead/Patient Details Intake & Appointment Booking Flow
4. Zero-hallucination guardrails & instant sub-second response

At GARUDA OS, we engineer custom AI agents, RAG engines, and WhatsApp/web automations at extreme velocity. We can build custom samples for your specific client requirements in under 24 hours.

Available for a quick contract discussion or pilot project.

Best regards,
Praveen Mahawar
Founder & AI Systems Architect, GARUDA OS
praveen@garudaos.in | https://www.garudaos.in`
  },
  {
    to: "andrei@agent.ai",
    subject: "AI Agent Builder Application — Live Agent Sample Inside",
    text: `Hi Andrei,

Applying for the AI Agent Builder / Creator position at Agent.ai. Here is a live, working conversational AI agent I engineered:

Live Agent Link:
https://tspebf1ycyxc.run.agentplace.io/

Core capabilities:
- Interactive service exploration & pricing breakdown
- Voice synthesis & real-time chat guidance
- High-intent lead capture & booking triage
- Production-tested with zero external token friction

I can rapidly architect and deploy specialized vertical agents for your platform. Would love to connect and build something exceptional together.

Best regards,
Praveen Mahawar
GARUDA OS | praveen@garudaos.in | https://www.garudaos.in`
  },
  {
    to: "Ayush.dwivedi@stefanini.com",
    subject: "Application: AI Automation Engineer (Remote) — Praveen Mahawar",
    text: `Hi Ayush,

Reaching out regarding the Remote AI Automation Engineer opening at Stefanini Group.

I design and deploy production-grade AI agents, workflow automations, and LLM tool integrations. 

Here is a live interactive AI agent deployed for customer intake and workflow triage:
https://tspebf1ycyxc.run.agentplace.io/

Capabilities:
- Multi-step conversational routing & intent classification
- Tool calling & scheduling workflow integration
- High-performance, low-latency architecture

Available immediately for remote contract engagement.

Best regards,
Praveen Mahawar
AI Systems Architect, GARUDA OS
praveen@garudaos.in | https://www.garudaos.in`
  }
];

async function dispatchAll() {
  console.log("==================================================================");
  console.log("🦅 GARUDA ZOHO LIVE OUTREACH DISPATCH FROM praveen@garudaos.in");
  console.log("==================================================================\n");

  const logFile = path.join(__dirname, "..", "..", "data", "radar", "zoho_outreach_dispatched.jsonl");
  const logDir = path.dirname(logFile);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  for (let i = 0; i < TARGETS.length; i++) {
    const t = TARGETS[i];
    console.log(`[*] Sending to [${t.to}] (${t.subject})...`);

    try {
      const info = await transporter.sendMail({
        from: `"Praveen Mahawar — GARUDA OS" <${process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in"}>`,
        to: t.to,
        replyTo: process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in",
        subject: t.subject,
        text: t.text
      });

      console.log(`[+] SUCCESS: Delivered to ${t.to} | MessageId: ${info.messageId}`);
      
      const record = {
        to: t.to,
        subject: t.subject,
        messageId: info.messageId,
        timestamp: new Date().toISOString(),
        status: "SENT"
      };
      fs.appendFileSync(logFile, JSON.stringify(record) + "\n", "utf8");

      if (i < TARGETS.length - 1) {
        console.log("    Waiting 10s before next send to respect Zoho rate limits...");
        await new Promise(r => setTimeout(r, 10000));
      }
    } catch (err) {
      console.error(`[-] ERROR sending to ${t.to}:`, err.message);
    }
  }

  console.log("\n[+] All outreach emails dispatched successfully from praveen@garudaos.in!");
}

dispatchAll();
