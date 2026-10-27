/**
 * 🦅 GARUDA SOVEREIGN AUTONOMOUS DISPATCH ENGINE
 * Sends high-conversion surgical proposals directly to hot buyers who posted active hiring calls.
 * 100% Autonomous — Zero manual clicks from Founder Praveen.
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOG_FILE = path.join(__dirname, '..', 'data', 'active-buyer-dispatch-log.json');

const SMTP_CONFIG = {
  host: process.env.GARUDA_EMAIL_HOST || 'smtp.zoho.in',
  port: parseInt(process.env.GARUDA_EMAIL_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.GARUDA_EMAIL_USER || 'praveen@garudaos.in',
    pass: process.env.GARUDA_EMAIL_PASS
  }
};

const FROM_HEADER = `"Praveen Mahawar — GARUDA OS" <${SMTP_CONFIG.auth.user}>`;

const FRESH_BUYERS = [
  {
    buyerId: 'buyer_8xenergy_ai',
    name: 'John Dukes (8xEnergy)',
    email: 'john.dukes@8xenergy.com',
    source: 'HackerNews Ask HN Who is Hiring',
    subject: 'Production AI Systems & High-Reliability Architecture [GARUDA OS]',
    text: `Hi John,

I saw your hiring opening at 8xEnergy for senior engineers experienced in production AI systems.

At GARUDA OS, we engineer autonomous, high-reliability AI operating systems and production software pipelines designed for zero hallucination, strict boundary governance, and sub-second execution.

Our production architecture highlights:
1. Production Multi-Agent Systems: Deterministic state machines, typed APIs, and real-time event streaming.
2. Verified Zero-Custody & Financial Integrity: SHA-256 evidence logging and immutable transactional ledgers.
3. Rapid Execution Bench: One founder + an autonomous AI workforce shipping verified code without agency bureaucracy.

Live architecture proof: https://www.garudaos.in

I would welcome the opportunity to discuss how our engineering bench can accelerate 8xEnergy's roadmap.

Best regards,
Praveen Mahawar
Founder & Chief AI Architect — GARUDA OS
Official Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  },
  {
    buyerId: 'buyer_detections_security',
    name: 'Detections.ai Hiring Team',
    email: 'jobs@detections.ai',
    source: 'HackerNews Ask HN Who is Hiring',
    subject: 'Security & Production Systems Engineering Capacity [GARUDA OS]',
    text: `Hi Team at Detections.ai,

I saw your hiring call for experienced remote engineers working directly with customers and security practitioners.

At GARUDA OS, we engineer security-hardened web applications, multi-tenant compliance systems, and automated threat defense layers with zero-compromise architectural rigor.

Our capabilities:
- OWASP ASVS-compliant architectures, strict IDOR prevention, and tenant data isolation.
- Sub-second frontend interfaces and resilient, type-safe backends (Node.js / Python / PostgreSQL).
- Direct founder-level engineering accountability and rapid delivery cadence.

Live production proof: https://www.garudaos.in

Happy to connect and explore how we can support your technical team immediately.

Best regards,
Praveen Mahawar
Founder & Chief Architect — GARUDA OS
Official Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  },
  {
    buyerId: 'buyer_vlm_run',
    name: 'VLM Run Team',
    email: 'hiring@vlm.run',
    source: 'HackerNews Ask HN Who is Hiring',
    subject: 'High-Throughput Vision & AI Infrastructure Capacity [GARUDA OS]',
    text: `Hi VLM Run Team,

I saw your hiring opening for scalable systems engineering and AI workflow capacity.

At GARUDA OS, we build production software and high-throughput AI pipelines designed for real-world enterprise deployments.

How we deliver:
1. Sub-second model inference routing and asynchronous job orchestration.
2. Clean, typed, production codebases with end-to-end integration testing.
3. Rapid deployment cycles with verified SHA-256 delivery proof.

Live reference: https://www.garudaos.in

Let's connect if you need high-velocity senior engineering firepower to scale your platform.

Best regards,
Praveen Mahawar
Founder & Chief Architect — GARUDA OS
Official Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  }
];

async function dispatchAll() {
  console.log('🦅 ========================================================');
  console.log('🦅 GARUDA SOVEREIGN AUTONOMOUS PROPOSAL DISPATCHER');
  console.log('🦅 Zero manual clicking — 100% Autonomous execution');
  console.log('🦅 ========================================================\n');

  let log = [];
  if (fs.existsSync(LOG_FILE)) {
    try {
      log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch (e) {
      log = [];
    }
  }

  const alreadySent = new Set(log.map(item => item.email.toLowerCase()));
  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  for (const buyer of FRESH_BUYERS) {
    if (alreadySent.has(buyer.email.toLowerCase())) {
      console.log(`⏩ [SKIP] Already dispatched to: ${buyer.email}`);
      continue;
    }

    console.log(`🚀 Dispatching autonomous proposal to ${buyer.name} (${buyer.email})...`);

    const mailOptions = {
      from: FROM_HEADER,
      to: buyer.email,
      replyTo: 'praveen@garudaos.in',
      subject: buyer.subject,
      text: buyer.text
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`   ✔ DELIVERED! MessageId: ${info.messageId} | Response: ${info.response}`);

      const entry = {
        buyerId: buyer.buyerId,
        email: buyer.email,
        name: buyer.name,
        subject: buyer.subject,
        source: buyer.source,
        status: 'DELIVERED',
        providerResponseId: info.response,
        messageId: info.messageId,
        sha256: crypto.createHash('sha256').update(buyer.text).digest('hex'),
        dispatchedAt: new Date().toISOString()
      };

      log.push(entry);
      fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf8');
      alreadySent.add(buyer.email.toLowerCase());

      console.log(`   🔒 Logged to ${LOG_FILE} with verified SHA-256.`);
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`   ❌ Failed to send to ${buyer.email}:`, err.message);
    }
  }

  console.log('\n========================================================');
  console.log('🦅 [DISPATCH RUN COMPLETE] All queued proposals processed!');
  console.log('========================================================');
}

dispatchAll().catch(err => {
  console.error('Fatal dispatch error:', err);
  process.exit(1);
});
