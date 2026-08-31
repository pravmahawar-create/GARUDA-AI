const fs = require("fs");
const path = require("path");

function generateResponse(commandResult, context = {}) {
  const { command, args } = commandResult;

  switch (command) {
    case "empty": return "Bolo, kya karna hai?";
    case "help": return getHelp();
    case "status": return getStatus(context);
    case "health": return getHealth(context);
    case "capabilities": return getCapabilities(context);
    case "memory": return getMemory(context);
    case "review": return getReview(args[0], context);
    case "plan": return getPlan(args[0], context);
    case "fix": return getFix(args[0], context);
    case "find": return getFind(args[0], context);
    case "explain": return getExplain(args[0], context);
    case "generate": return getGenerate(args[0], context);
    case "remember": return getRemember(args[0], context);
    case "learn": return getLearn(args[0], context);
    case "goals": return getGoals(context);
    case "quit": return "Alvida! GARUDA ready hai jab bhi bulao.";
    case "chat": return getChat(args[0], context);
    default: return "Samajh nahi aaya. 'help' likh ke dekho.";
  }
}

function getHelp() {
  return `
GARUDA Commands:
  help          — Ye help dikhao
  status        — GARUDA ka status
  health        — System health check
  capabilities  — Kya kya kar sakta hai
  memory        — Yaadein dikhao
  review <file> — Code review karo
  plan <goal>   — Goal plan karo
  fix <file>    — File fix karo
  find <query>  — Code dhundho
  explain <file>— File explain karo
  generate <type> — Code generate karo
  remember <msg>— Yaad mein rakho
  learn <goal>  — Goal se seekho
  goals         — Active goals dikhao
  quit          — Band karo

Hindi mein bhi bol sakte ho:
  kya haal hai  — Status
  kya kar sakta hai — Capabilities
  yaad         — Memory
  sudhar       — Fix
  dhundh       — Find
  bana         — Generate
`;
}

function getStatus(context) {
  const caps = context.capabilities || 0;
  const lessons = context.lessons || 0;
  const health = context.healthStatus || "unknown";
  return `GARUDA Status:
  Capabilities: ${caps}
  Lessons Learned: ${lessons}
  Health: ${health}
  Mode: Independent (bina LLM ke)
  Ready: Haan`;
}

function getHealth(context) {
  const h = context.health || {};
  return `System Health:
  Disk: ${h.disk || "unknown"} (${h.diskUsage || "?"}% used)
  Memory: ${h.memory || "unknown"} (${h.memoryUsage || "?"}% used)
  Process: ${h.process || "unknown"}
  Overall: ${h.overall || "checking..."}`;
}

function getCapabilities(context) {
  const caps = context.capabilityList || [];
  if (caps.length === 0) return "Koi capabilities registered nahi hain.";
  let msg = "GARUDA Capabilities:\n";
  for (const c of caps) {
    msg += `  [${c.maturity}] ${c.name} — ${c.category}\n`;
  }
  return msg;
}

function getMemory(context) {
  const stats = context.memoryStats || {};
  return `Memory:
  Experiences: ${stats.experiences || 0}
  Lessons: ${stats.lessons || 0}
  Total: ${stats.total || 0}`;
}

function getReview(filePath, context) {
  if (!filePath) return "File batao: review <filename>";
  const review = context.reviewResult;
  if (!review) return `Review kar raha hoon: ${filePath}...`;
  let msg = `Review: ${filePath}\n  Verdict: ${review.verdict}\n  Score: ${review.score}/100\n`;
  if (review.issues && review.issues.length > 0) {
    msg += `  Issues:\n`;
    for (const i of review.issues.slice(0, 5)) {
      msg += `    [${i.severity}] ${i.message}\n`;
    }
  }
  return msg;
}

function getPlan(goalText, context) {
  if (!goalText) return "Goal batao: plan <goal description>";
  const plan = context.planResult;
  if (!plan) return `Plan bana raha hoon: ${goalText}...`;
  let msg = `Plan: ${goalText}\n  Steps:\n`;
  for (const s of plan.steps || []) {
    msg += `    ${s.type}: ${s.description}\n`;
  }
  if (plan.reasoning && plan.reasoning.length > 0) {
    msg += `  Reasoning: ${plan.reasoning.join("; ")}\n`;
  }
  return msg;
}

function getFix(filePath, context) {
  if (!filePath) return "File batao: fix <filename>";
  return `Fix kar raha hoon: ${filePath}\nPehle review karunga, phir fix karunga.`;
}

function getFind(query, context) {
  if (!query) return "Kya dhundhna hai? find <query>";
  const results = context.findResults || [];
  if (results.length === 0) return `"${query}" ke liye kuch nahi mila.`;
  let msg = `"${query}" ke results:\n`;
  for (const r of results.slice(0, 5)) {
    msg += `  ${r.path || r}\n`;
  }
  return msg;
}

function getExplain(filePath, context) {
  if (!filePath) return "File batao: explain <filename>";
  const info = context.fileInfo;
  if (!info) return `Samajh raha hoon: ${filePath}...`;
  return `File: ${filePath}\n  Lines: ${info.lines || "?"}\n  Type: ${info.type || "?"}\n  Exports: ${info.exports || "?"}`;
}

function getGenerate(type, context) {
  if (!type) return "Kya generate karna hai? generate <type>\n  Types: function, module, test, api, component";
  const code = context.generatedCode;
  if (!code) return `Bana raha hoon: ${type}...`;
  return `Generated ${type}:\n\`\`\`javascript\n${code}\n\`\`\``;
}

function getRemember(msg, context) {
  if (!msg) return "Kya yaad rakhna hai? remember <message>";
  return `Yaad mein rakh liya: "${msg}"`;
}

function getLearn(goalText, context) {
  if (!goalText) return "Kya seekhna hai? learn <goal description>";
  const lessons = context.newLessons || [];
  if (lessons.length === 0) return `"${goalText}" se seekh raha hoon...`;
  let msg = `"${goalText}" se seekha:\n`;
  for (const l of lessons) {
    msg += `  - ${l.lesson}\n`;
  }
  return msg;
}

function getGoals(context) {
  const goals = context.goals || [];
  if (goals.length === 0) return "Koi active goals nahi hain.";
  let msg = "Active Goals:\n";
  for (const g of goals) {
    msg += `  [${g.status}] ${g.title} (${g.type})\n`;
  }
  return msg;
}

function getChat(input, context) {
  const lower = input.toLowerCase();
  if (lower.includes("namaste") || lower.includes("hello") || lower.includes("hi")) {
    return "Namaste! Main GARUDA hoon. Kya kar sakta hoon aapke liye?";
  }
  if (lower.includes("kaun hai") || lower.includes("who are you")) {
    return "Main GARUDA hoon — duniya ka pehla self-evolving AI OS. Bina kisi bahari LLM ke kaam karta hoon.";
  }
  if (lower.includes("kya kar") || lower.includes("what can")) {
    return "Code review, fix, plan, generate, yaad rakhna, seekhna — sab kar sakta hoon. 'help' likh ke dekho.";
  }
  return `"${input}" — Samajh gaya. Aur kuch?`;
}

module.exports = { generateResponse };
