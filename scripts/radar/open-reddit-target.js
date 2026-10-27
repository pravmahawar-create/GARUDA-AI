/**
 * 🦅 GARUDA REDDIT PRE-FILLED 1-TAP DISPATCHER
 * Opens Reddit compose window directly in Founder's running Chrome session.
 * Zero typing required — To, Subject, and Full Architectural Pitch are 100% pre-filled.
 */

const { exec } = require("child_process");

const TARGETS = [
  {
    id: 1,
    name: "Playwright CDP & Node.js UI Automation ($250-$300)",
    to: "Naive_Area6965",
    subject: "Node.js Developer for Playwright CDP Automation",
    message: `Hi /u/Naive_Area6965,

I read your requirement for a Node.js developer to build the browser interaction and logging layers for your local UI testing/simulation suite via Playwright CDP.

I am a Systems Architect working hands-on with Node.js automation, Chrome DevTools Protocol (CDP) session management, and structured database logging pipelines.

How I can help with your implementation:
- Playwright CDP: Direct CDP session connection (connectOverCDP), event listening, and targeted DOM interaction modules.
- Structured Logging: Clean execution traces formatted and written strictly according to your database schemas.
- Modular Integration: Clean, self-contained functions matching your documented validation loops.

Verified engineering reference: https://www.garudaos.in

If you are still accepting applications, I would be glad to review your schemas and documentation. We can structure a small, fixed starter milestone ($250-$300) to implement and verify the first automated workflow module before expanding across your full suite.

Best regards,
Praveen Mahawar
Founder & Chief Systems Architect — GARUDA OS
Email: praveen@garudaos.in | Portfolio: https://www.garudaos.in`
  },
  {
    id: 2,
    name: "Marketplace MVP Bilingual Arabic RTL + English ($40/hr)",
    to: "IlIlllIIllIII",
    subject: "Regarding: Senior Full Stack Developer for Marketplace (Bilingual RTL/LTR)",
    message: `Hey /u/IlIlllIIllIII,

I saw your post for a Senior Full Stack Developer to build your marketplace platform with Arabic + English (RTL/LTR) support, and specifically your requirement for clean, hand-crafted architecture rather than cheap AI-generated slop.

At GARUDA OS, we engineer production web applications with strict TypeScript typing, sub-second latency, and verified bidirectional (RTL/LTR) layouts:

1. Bidirectional UI Architecture: CSS logical properties with zero layout tearing when switching between Arabic (RTL) and English (LTR).
2. Marketplace Core: Scalable listing schemas, faceted search/filters, isolated seller/buyer roles, and secure role-based access control (RBAC) on the admin dashboard.
3. Verified Delivery: 100% build-verified clean code with zero dependency bloat.

Live production proof of our engineering standard: https://www.garudaos.in

If you have wireframes, a Figma file, or a functional spec, I would be glad to review them and provide a structured milestone breakdown within your $40/hr budget.

Best regards,
Praveen Mahawar
Founder & Chief Architect — GARUDA OS
Official Email: praveen@garudaos.in | Platform: https://www.garudaos.in`
  }
];

function openTarget(targetIndex = 0) {
  const t = TARGETS[targetIndex];
  if (!t) {
    console.error("Invalid target index");
    return;
  }

  const composeUrl = `https://www.reddit.com/message/compose/?to=${encodeURIComponent(t.to)}&subject=${encodeURIComponent(t.subject)}&message=${encodeURIComponent(t.message)}`;
  
  console.log(`🚀 Opening Pre-Filled Reddit Compose Tab for Target: ${t.name}...`);
  console.log(`To: /u/${t.to}`);
  console.log(`Subject: ${t.subject}`);

  // Open in system default browser (Chrome where user is logged in)
  const cmd = `start "" "${composeUrl}"`;
  exec(cmd, (err) => {
    if (err) {
      console.error("Error opening browser:", err.message);
    } else {
      console.log("✔ Tab opened successfully in Chrome! Message is pre-filled.");
    }
  });
}

const targetArg = process.argv[2] ? parseInt(process.argv[2], 10) - 1 : 0;
openTarget(targetArg);
