#!/usr/bin/env node
/**
 * 🦅 GARUDA Bounty Autonomous Daemon — 24/7 Background Hunter
 * Version: 1.0.0 | Persistent Memory | Circuit Breaker | Telegram Alerts
 *
 * Requires: scripts/bug-bounty-hunter.js + src/services/telegramBotService.js
 * State: data/bounty-scan-memory.json (atomic writes) + data/bounty-targets.txt
 * Authorized use only on in-scope targets.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Reuse hunter engine + uncensored adapter for flywheel
const hunter = require("./bug-bounty-hunter");
let openCodeAdapter = null;
try { openCodeAdapter = require("../src/services/smartModelRouter/openCodeAdapter"); } catch { openCodeAdapter = null; }

// ──────────────────────────────────────────────────────────────────────────────
// 0. ANSI + LOG
// ──────────────────────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m", gray: "\x1b[90m",
};
function log(c, ...a) { console.log(c + a.join(" ") + C.reset); }

// ──────────────────────────────────────────────────────────────────────────────
// 1. CONFIG
// ──────────────────────────────────────────────────────────────────────────────
const MEMORY_PATH = path.join(__dirname, "..", "data", "bounty-scan-memory.json");
const TARGETS_PATH = path.join(__dirname, "..", "data", "bounty-targets.txt");
const QUARANTINE_MS = 2 * 60 * 60 * 1000; // 2h
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const CRT_TIMEOUT_MS = 10000;
let jitterDelay = 300; // adaptive 300-1500ms
let quarantineMap = new Map(); // rootDomain -> { until, consecutiveBlocks }
let shuttingDown = false;
let startTime = Date.now();

// ──────────────────────────────────────────────────────────────────────────────
// 2. SUBDOMAIN AUTO-RECON (crt.sh)
// ──────────────────────────────────────────────────────────────────────────────
async function discoverSubdomains(rootDomain) {
  const clean = String(rootDomain).trim().replace(/^https?:\/\//, "").replace(/^.*@/, "").split("/")[0].replace(/^\*\./, "");
  if (!clean || !clean.includes(".")) return [ `https://${clean}` ];
  const url = `https://crt.sh/?q=%25.${encodeURIComponent(clean)}&output=json`;
  log(C.cyan, `  🔍 crt.sh recon for ${clean} → ${url}`);
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), CRT_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "GARUDA-Bounty-Daemon/1.0" } });
    if (!res.ok) throw new Error(`crt.sh HTTP ${res.status}`);
    const data = await res.json().catch(() => []);
    if (!Array.isArray(data) || data.length === 0) throw new Error("crt.sh empty");
    const set = new Set();
    for (const entry of data) {
      const raw = String(entry.common_name || entry.name_value || "").trim();
      // name_value may contain multiple lines
      for (const part of raw.split("\n")) {
        let h = part.trim().toLowerCase();
        if (!h || h.startsWith("*.") || h.includes("*")) continue;
        // filter wildcards, keep only subdomains of root
        if (!h.endsWith(clean.toLowerCase())) continue;
        // normalize
        h = h.replace(/^\*\./, "");
        if (h === clean) continue; // root already covered separately
        set.add(`https://${h}`);
      }
    }
    // Always include root
    set.add(`https://${clean}`);
    const list = [...set].slice(0, 80); // cap to prevent explosion
    log(C.green, `    → Discovered ${list.length} live candidates for ${clean} (deduped, filtered)`);
    return list;
  } catch (e) {
    log(C.yellow, `    ⚠ crt.sh failed for ${clean}: ${e.message} — fallback to root only`);
    return [`https://${clean}`];
  } finally {
    clearTimeout(t);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. PERSISTENT MEMORY — atomic writes
// ──────────────────────────────────────────────────────────────────────────────
function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_PATH)) return {};
    const raw = fs.readFileSync(MEMORY_PATH, "utf8");
    const j = JSON.parse(raw);
    if (typeof j !== "object" || j === null) return {};
    return j;
  } catch {
    log(C.yellow, `  ⚠ Memory corrupt or unreadable — starting fresh: ${MEMORY_PATH}`);
    return {};
  }
}
function saveMemoryAtomic(memory) {
  try {
    const dir = path.dirname(MEMORY_PATH);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = MEMORY_PATH + ".tmp." + Date.now();
    fs.writeFileSync(tmp, JSON.stringify(memory, null, 2), "utf8");
    fs.renameSync(tmp, MEMORY_PATH);
  } catch (e) {
    log(C.red, `  ✗ Memory save failed: ${e.message}`);
  }
}
function sha256(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

// ──────────────────────────────────────────────────────────────────────────────
// 4. CIRCUIT BREAKER & WAF THROTTLING
// ──────────────────────────────────────────────────────────────────────────────
function getRootDomain(target) {
  try { return new URL(target).hostname.toLowerCase(); } catch { return target; }
}
function checkQuarantine(root) {
  const q = quarantineMap.get(root);
  if (!q) return false;
  if (Date.now() < q.until) return q;
  quarantineMap.delete(root);
  return false;
}
function recordResponse(root, status) {
  if (status === 429 || status === 403) {
    const q = quarantineMap.get(root) || { consecutiveBlocks: 0, until: 0 };
    q.consecutiveBlocks += 1;
    // WAF adaptive jitter: increase 300→1500ms
    jitterDelay = Math.min(1500, jitterDelay + 200);
    log(C.yellow, `  ⚠ WAF signal ${status} on ${root} — consecutiveBlocks=${q.consecutiveBlocks} jitter→${jitterDelay}ms`);
    if (status === 429 || q.consecutiveBlocks >= 3) {
      q.until = Date.now() + QUARANTINE_MS;
      quarantineMap.set(root, q);
      log(C.red, `  🚨 Circuit breaker TRIPPED for ${root} — quarantine 2h until ${new Date(q.until).toISOString()}`);
      return true;
    }
    quarantineMap.set(root, q);
  } else if (status >= 200 && status < 400) {
    // success resets blocks but keep jitter elevated for a bit
    const q = quarantineMap.get(root);
    if (q) {
      q.consecutiveBlocks = Math.max(0, q.consecutiveBlocks - 1);
      if (q.consecutiveBlocks === 0) quarantineMap.delete(root);
      else quarantineMap.set(root, q);
    }
    // slowly decay jitter back to 300ms on success
    jitterDelay = Math.max(300, jitterDelay - 20);
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. TELEGRAM ALERT DISPATCHER
// ──────────────────────────────────────────────────────────────────────────────
let telegram = null;
try { telegram = require("../src/services/telegramBotService"); } catch { telegram = null; }

async function dispatchTelegramAlert({ target, vuln, reportPath, evidenceHash, curl }) {
  if (!telegram || typeof telegram.sendMessage !== "function") {
    log(C.yellow, `  ⚠ Telegram not configured — skipping alert for ${vuln.name}`);
    return null;
  }
  if (!telegram.isConfigured || !telegram.isConfigured()) {
    log(C.yellow, `  ⚠ Telegram botToken/founderChatId missing — set TELEGRAM_BOT_TOKEN + TELEGRAM_FOUNDER_CHAT_ID`);
    return null;
  }
  const text = [
    `🚨 [GARUDA BOUNTY HUNTER ALERT] 🚨`,
    `🎯 Target: ${target}`,
    `💥 Vulnerability: ${vuln.name || vuln.type || vuln.header} (${vuln.cwe || "CWE-?"})`,
    `🔥 Severity: ${vuln.severity || "?"} | CVSS: ${vuln.cvss ?? "?"}`,
    `📄 PoC File: ${reportPath ? path.relative(process.cwd(), reportPath) : "N/A"}`,
    `🔑 SHA-256: ${evidenceHash ? evidenceHash.slice(0, 16) + "..." : "n/a"}`,
    `⚡ Reproduction: ${curl || `curl -i -s -H "Origin: https://attacker-origin.com" "${target}"`}`,
  ].join("\n");
  try {
    const res = await telegram.sendMessage(text);
    if (res && res.ok === false) log(C.yellow, `  ⚠ Telegram send failed: ${JSON.stringify(res).slice(0, 200)}`);
    else log(C.green, `  ✉ Telegram alert sent for ${vuln.name} → ${target}`);
    return res;
  } catch (e) {
    log(C.yellow, `  ⚠ Telegram dispatch error: ${e.message}`);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. SINGLE TARGET WRAPPER WITH MEMORY + CIRCUIT BREAKER
// ──────────────────────────────────────────────────────────────────────────────
async function processTarget(target, memory, now) {
  const root = getRootDomain(target);
  const q = checkQuarantine(root);
  if (q) {
    log(C.gray, `  ⏸ Quarantined ${target} (root ${root} until ${new Date(q.until).toISOString()}) — skipping`);
    return { skipped: true, reason: "quarantine" };
  }
  const mem = memory[target];
  if (mem && mem.lastScanned && (now - mem.lastScanned) < COOLDOWN_MS) {
    const hrs = ((COOLDOWN_MS - (now - mem.lastScanned)) / 3600000).toFixed(1);
    log(C.gray, `  ⏸ Cooldown ${target} — last ${new Date(mem.lastScanned).toISOString()} (${hrs}h left) — skipping`);
    return { skipped: true, reason: "cooldown" };
  }

  // Adaptive jitter before request burst
  await new Promise(r => setTimeout(r, jitterDelay));

  const result = await hunter.auditSingleTarget(target, { concurrency: 1 });

  // ── Autonomous Bounty Revenue Flywheel: delegate complex endpoints to OpenCode ──
  const complexHints = result.findings.filter(f => f.verdict === "CONFIRMED_EXPOSED" || /graphql|api-docs|swagger|openapi|actuator/i.test(f.name || f.path || "")).slice(0, 2);
  if (openCodeAdapter && complexHints.length > 0) {
    for (const hint of complexHints) {
      try {
        const cweResult = await openCodeAdapter.executeSecurityTask({
          taskType: "security_audit",
          target,
          url: hint.url || target,
          rawHeaders: hint.rawHeaders || JSON.stringify(hint).slice(0, 1000),
          rawBody: hint.bodySnippet || hint.value || "",
          options: { model: "qwen2.5-coder:3b" },
        });
        // Enrich finding with OpenCode CWE/CVSS if heuristic was low but OpenCode found higher
        if (cweResult && cweResult.cvss > (hint.cvss || 0)) {
          hint.cwe = cweResult.cwe;
          hint.cvss = cweResult.cvss;
          hint.severity = cweResult.severity;
          hint.openCodeAnalysis = cweResult.analysis;
          hint.openCodeReportPath = cweResult.reportPath;
        }
      } catch {}
    }
  }

  // Record WAF signals from findings status codes
  let tripped = false;
  for (const f of result.findings || []) {
    if (f.status === 429 || f.status === 403) tripped = recordResponse(root, f.status) || tripped;
  }
  // Also check raw 429/403 in exposed filesStatuses
  // If no high findings, still record success to decay jitter
  if (!tripped) recordResponse(root, 200);

  // Update memory atomically
  const findingCount = result.findings ? result.findings.length : 0;
  const hasHighCritical = result.findings ? result.findings.some(f => f.severity === "Critical" || f.severity === "High") : false;
  const status = hasHighCritical ? "VULNERABLE" : findingCount === 0 ? "CLEAN" : "LOW";
  memory[target] = {
    firstSeen: mem ? mem.firstSeen : new Date(now).toISOString(),
    lastScanned: now,
    sha256: result.evidenceHash || sha256(JSON.stringify(result.findings)),
    status,
    findingsCount: findingCount,
    consecutiveBlocks: (quarantineMap.get(root)?.consecutiveBlocks || 0),
  };
  saveMemoryAtomic(memory);

  // Telegram dispatch for Critical/High only
  if (hasHighCritical) {
    for (const f of result.findings.filter(v => v.severity === "Critical" || v.severity === "High")) {
      // Find matching report path
      const rep = result.reports.find(r => r.filePath && r.filePath.includes((f.name || f.header || "").slice(0, 10))) || result.reports[0];
      const curl = `curl -i -s -H "Origin: https://attacker-origin.com" -H "User-Agent: Mozilla/5.0" "${f.url || target}"`;
      await dispatchTelegramAlert({
        target,
        vuln: f,
        reportPath: rep ? rep.filePath : null,
        evidenceHash: result.evidenceHash,
        curl,
      });
    }
  }

  return { skipped: false, result };
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. DAEMON LOOP & CLI
// ──────────────────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { watch: false, once: false, discover: false, interval: 30, target: null, file: null };
  // Default is --watch if no mode given
  let modeGiven = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--watch") { opts.watch = true; modeGiven = true; }
    else if (args[i] === "--once") { opts.once = true; modeGiven = true; }
    else if (args[i] === "--discover") { opts.discover = true; }
    else if (args[i] === "--interval" && args[i+1]) { opts.interval = parseInt(args[++i], 10) || 30; }
    else if (args[i] === "--target" && args[i+1]) { opts.target = args[++i]; }
    else if (args[i] === "--file" && args[i+1]) { opts.file = args[++i]; }
    else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
🦅 GARUDA Bounty Autonomous Daemon v1.0.0
Usage:
  node scripts/bounty-autonomous-daemon.js --watch              # Default continuous mode (30m interval)
  node scripts/bounty-autonomous-daemon.js --once               # Single pass then exit
  node scripts/bounty-autonomous-daemon.js --once --target https://www.garudaos.in
  node scripts/bounty-autonomous-daemon.js --discover           # Subdomain expansion via crt.sh then scan
  node scripts/bounty-autonomous-daemon.js --interval 30        # Sleep interval in minutes (default 30)
  node scripts/bounty-autonomous-daemon.js --watch --interval 15 --file data/bounty-targets.txt
`);
      process.exit(0);
    }
  }
  if (!modeGiven) opts.watch = true; // default continuous
  if (opts.once && opts.watch) opts.watch = false; // once takes precedence
  return opts;
}

async function loadTargetsForDaemon(opts) {
  let raw = [];
  if (opts.target) raw = [opts.target];
  else if (opts.file) {
    const p = path.resolve(opts.file);
    if (!fs.existsSync(p)) { log(C.red, `Target file not found: ${p}`); process.exit(1); }
    raw = fs.readFileSync(p, "utf8").split(/\r?\n/).map(s => s.trim()).filter(Boolean).filter(l => !l.startsWith("#"));
  } else {
    const p = TARGETS_PATH;
    if (fs.existsSync(p)) raw = fs.readFileSync(p, "utf8").split(/\r?\n/).map(s => s.trim()).filter(Boolean).filter(l => !l.startsWith("#"));
    else raw = ["https://www.garudaos.in"];
  }
  let targets = hunter.loadTargets(raw);
  if (opts.discover) {
    log(C.cyan, `🔍 Discover mode — expanding ${targets.length} roots via crt.sh...`);
    const expanded = new Set(targets);
    for (const t of targets) {
      const root = new URL(t).hostname;
      const subs = await discoverSubdomains(root);
      subs.forEach(s => expanded.add(s));
      await new Promise(r => setTimeout(r, 500)); // polite delay per crt.sh
    }
    targets = [...expanded];
    log(C.green, `  → Total after discover: ${targets.length} targets`);
  }
  return [...new Set(targets)];
}

async function runOnce(opts) {
  const memory = loadMemory();
  const now = Date.now();
  const targets = await loadTargetsForDaemon(opts);
  log(C.bold + C.cyan, `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(C.bold, `🦅 GARUDA Daemon — Single Pass | Targets: ${targets.length} | Jitter: ${jitterDelay}ms`);
  log(C.dim, `Memory entries: ${Object.keys(memory).length} | Quarantined roots: ${quarantineMap.size}`);
  let scanned = 0, skipped = 0, reports = 0, high = 0;
  for (const t of targets) {
    if (shuttingDown) { log(C.yellow, `  ⏹ Shutdown requested — finishing current target ${t} then saving...`); break; }
    const res = await processTarget(t, memory, now);
    if (res.skipped) skipped++; else { scanned++; reports += res.result.reports.length; high += res.result.summary.high; }
  }
  const uptime = ((Date.now() - startTime) / 1000).toFixed(0);
  log(C.bold + C.cyan, `\n📊 Round complete — Scanned: ${scanned} | Skipped: ${skipped} | Reports: ${reports} | High: ${high} | Uptime: ${uptime}s | Jitter: ${jitterDelay}ms`);
  log(C.dim, `Memory saved: ${MEMORY_PATH} (${Object.keys(memory).length} entries)`);
  return { scanned, skipped, reports, high };
}

async function watchLoop(opts) {
  let round = 0;
  log(C.bold, `\n🦅 GARUDA Bounty Autonomous Daemon — 24/7 WATCH MODE (interval ${opts.interval}m)`);
  log(C.dim, `Press Ctrl+C to gracefully shutdown (saves memory). Discover: ${opts.discover ? "ON" : "OFF"}`);
  while (!shuttingDown) {
    round++;
    const memBefore = Object.keys(loadMemory()).length;
    log(C.cyan + C.bold, `\n◆◆◆ ROUND #${round} — ${new Date().toISOString()} — uptime ${((Date.now()-startTime)/3600000).toFixed(2)}h ◆◆◆`);
    await runOnce(opts);
    if (shuttingDown) break;
    const waitMs = opts.interval * 60 * 1000;
    log(C.gray, `  💤 Sleeping ${opts.interval}m until next round... (Ctrl+C to stop)`);
    // interruptible sleep
    for (let slept = 0; slept < waitMs && !shuttingDown; slept += 1000) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  log(C.green, `\n✓ Daemon shutdown clean — memory saved, quarantine preserved. Uptime: ${((Date.now()-startTime)/1000).toFixed(0)}s`);
}

async function main() {
  const opts = parseArgs();
  // Graceful shutdown
  process.on("SIGINT", () => { log(C.yellow, "\n⚠ SIGINT — graceful shutdown..."); shuttingDown = true; });
  process.on("SIGTERM", () => { log(C.yellow, "\n⚠ SIGTERM — graceful shutdown..."); shuttingDown = true; });
  log(C.bold, `🦅 GARUDA Bounty Autonomous Daemon v1.0.0`);
  log(C.dim, `Mode: ${opts.once ? "ONCE" : opts.watch ? "WATCH" : "ONCE"} | Interval: ${opts.interval}m | Discover: ${opts.discover} | Targets: ${opts.target || opts.file || TARGETS_PATH}`);
  if (opts.once) {
    await runOnce(opts);
    log(C.green, `✓ Once pass complete — exiting.`);
    process.exit(0);
  } else {
    await watchLoop(opts);
  }
}

if (require.main === module) { main().catch(e => { log(C.red, "Fatal daemon:", e.stack || e.message); process.exit(1); }); }
module.exports = { discoverSubdomains, loadMemory, saveMemoryAtomic, checkQuarantine: checkQuarantine, recordResponse, dispatchTelegramAlert, runOnce, watchLoop };
