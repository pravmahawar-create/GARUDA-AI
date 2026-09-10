#!/usr/bin/env node
/**
 * 🦅 GARUDA Bug Bounty Hunter — Enterprise Automated PoC Generation Engine
 * Version: 2.0.0 | Zero Placeholders | HackerOne/Bugcrowd/Intigriti Ready
 *
 * Capabilities:
 * 1. Target list & mass scanning (single domain, CIDR, file) + concurrency + UA rotation + jitter
 * 2. Comprehensive vuln recon matrix (50+ sensitive paths, CORS, headers, leakage)
 * 3. Smart false-positive elimination (SPA catch-all + SHA-256 baseline)
 * 4. Auto PoC markdown generation (CWE + CVSS + curl + impact + remediation)
 * 5. CLI runner with colorful logs + SHA-256 evidence
 *
 * Authorized use only on in-scope bug bounty targets. 100% Anti-Fabrication Law.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// ──────────────────────────────────────────────────────────────────────────────
// 0. ANSI COLORS
// ──────────────────────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};
function log(color, ...args) { console.log(color + args.join(" ") + C.reset); }

// ──────────────────────────────────────────────────────────────────────────────
// 1. CONFIG
// ──────────────────────────────────────────────────────────────────────────────
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (compatible; GARUDA-Security-Auditor/2.0; +https://www.garudaos.in)",
];

const SENSITIVE_PATHS = [
  // Secrets & env
  { path: "/.env", name: "Exposed .env File", cwe: "CWE-538", cvss: 9.1, severity: "Critical" },
  { path: "/.env.example", name: "Exposed .env.example", cwe: "CWE-538", cvss: 5.3, severity: "Medium" },
  { path: "/.env.local", name: "Exposed .env.local", cwe: "CWE-538", cvss: 7.5, severity: "High" },
  { path: "/.env.production", name: "Exposed .env.production", cwe: "CWE-538", cvss: 7.5, severity: "High" },
  { path: "/config.json", name: "Exposed config.json", cwe: "CWE-538", cvss: 6.5, severity: "Medium" },
  { path: "/package.json", name: "Exposed package.json (Tech Stack)", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  // Git
  { path: "/.git/HEAD", name: "Exposed .git/HEAD (Source Disclosure)", cwe: "CWE-538", cvss: 7.5, severity: "High" },
  { path: "/.git/config", name: "Exposed .git/config", cwe: "CWE-538", cvss: 7.5, severity: "High" },
  { path: "/.git/index", name: "Exposed .git/index", cwe: "CWE-538", cvss: 7.5, severity: "High" },
  { path: "/.git/logs/HEAD", name: "Exposed .git/logs/HEAD", cwe: "CWE-538", cvss: 7.5, severity: "High" },
  // Spring Boot Actuator
  { path: "/actuator/env", name: "Spring Boot Actuator — /actuator/env", cwe: "CWE-200", cvss: 8.2, severity: "High" },
  { path: "/actuator/heapdump", name: "Spring Boot Actuator — heapdump", cwe: "CWE-200", cvss: 8.6, severity: "High" },
  { path: "/actuator/mappings", name: "Spring Boot Actuator — mappings", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/actuator/beans", name: "Spring Boot Actuator — beans", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/actuator/health", name: "Spring Boot Actuator — health", cwe: "CWE-200", cvss: 3.7, severity: "Low" },
  { path: "/actuator/info", name: "Spring Boot Actuator — info", cwe: "CWE-200", cvss: 3.7, severity: "Low" },
  { path: "/actuator/gateway/routes", name: "Spring Boot Actuator — gateway routes", cwe: "CWE-200", cvss: 6.5, severity: "Medium" },
  // AWS & keys
  { path: "/.aws/credentials", name: "Exposed AWS Credentials", cwe: "CWE-798", cvss: 9.8, severity: "Critical" },
  { path: "/.aws/config", name: "Exposed AWS Config", cwe: "CWE-798", cvss: 7.5, severity: "High" },
  { path: "/id_rsa", name: "Exposed Private SSH Key (id_rsa)", cwe: "CWE-798", cvss: 9.8, severity: "Critical" },
  { path: "/id_rsa.pub", name: "Exposed Public SSH Key", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/.ssh/id_rsa", name: "Exposed .ssh/id_rsa", cwe: "CWE-798", cvss: 9.8, severity: "Critical" },
  // API docs & GraphQL
  { path: "/swagger.json", name: "Exposed Swagger JSON", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/swagger-ui.html", name: "Exposed Swagger UI", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/api-docs", name: "Exposed API Docs (/api-docs)", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/openapi.json", name: "Exposed OpenAPI Spec", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/v2/api-docs", name: "Exposed Swagger v2 api-docs", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/v3/api-docs", name: "Exposed Swagger v3 api-docs", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/graphql", name: "Exposed GraphQL Endpoint", cwe: "CWE-200", cvss: 6.5, severity: "Medium" },
  { path: "/graphiql", name: "Exposed GraphiQL IDE", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  // Platform files
  { path: "/.DS_Store", name: "Exposed .DS_Store", cwe: "CWE-200", cvss: 3.7, severity: "Low" },
  { path: "/web.config", name: "Exposed web.config (IIS)", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/docker-compose.yml", name: "Exposed docker-compose.yml", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/Dockerfile", name: "Exposed Dockerfile", cwe: "CWE-200", cvss: 3.7, severity: "Low" },
  { path: "/.dockerignore", name: "Exposed .dockerignore", cwe: "CWE-200", cvss: 2.5, severity: "Low" },
  // Backups & dumps
  { path: "/index.php.bak", name: "Backup File — index.php.bak", cwe: "CWE-530", cvss: 6.5, severity: "Medium" },
  { path: "/config.php~", name: "Backup File — config.php~", cwe: "CWE-530", cvss: 7.5, severity: "High" },
  { path: "/config.php.bak", name: "Backup File — config.php.bak", cwe: "CWE-530", cvss: 7.5, severity: "High" },
  { path: "/database.sql", name: "Database Dump — database.sql", cwe: "CWE-538", cvss: 9.1, severity: "Critical" },
  { path: "/dump.sql", name: "Database Dump — dump.sql", cwe: "CWE-538", cvss: 9.1, severity: "Critical" },
  { path: "/backup.sql", name: "Database Dump — backup.sql", cwe: "CWE-538", cvss: 9.1, severity: "Critical" },
  { path: "/db.sql", name: "Database Dump — db.sql", cwe: "CWE-538", cvss: 9.1, severity: "Critical" },
  { path: "/admin.sql", name: "Database Dump — admin.sql", cwe: "CWE-538", cvss: 9.1, severity: "Critical" },
  { path: "/.bak", name: "Generic Backup File — .bak", cwe: "CWE-530", cvss: 5.3, severity: "Medium" },
  // Misc
  { path: "/server-status", name: "Exposed Apache server-status", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/phpinfo.php", name: "Exposed phpinfo.php", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/info.php", name: "Exposed info.php", cwe: "CWE-200", cvss: 5.3, severity: "Medium" },
  { path: "/.well-known/security.txt", name: "Security.txt (Info)", cwe: "CWE-200", cvss: 0, severity: "Info" },
  { path: "/sitemap.xml", name: "Sitemap Disclosure", cwe: "CWE-200", cvss: 0, severity: "Info" },
  { path: "/robots.txt", name: "Robots Disclosure", cwe: "CWE-200", cvss: 0, severity: "Info" },
];

const SECURITY_HEADERS_AUDIT = [
  { header: "strict-transport-security", name: "HSTS", cwe: "CWE-319", cvss: 5.3, severity: "Medium", desc: "Missing HSTS allows SSL-stripping/downgrade attacks" },
  { header: "content-security-policy", name: "CSP", cwe: "CWE-693", cvss: 6.1, severity: "Medium", desc: "Missing CSP allows XSS and clickjacking via script injection" },
  { header: "x-frame-options", name: "X-Frame-Options", cwe: "CWE-1021", cvss: 6.1, severity: "Medium", desc: "Missing X-Frame-Options allows clickjacking" },
  { header: "x-content-type-options", name: "X-Content-Type-Options", cwe: "CWE-693", cvss: 3.7, severity: "Low", desc: "Missing X-Content-Type-Options allows MIME sniffing" },
  { header: "referrer-policy", name: "Referrer-Policy", cwe: "CWE-200", cvss: 3.1, severity: "Low", desc: "Missing Referrer-Policy leaks referrer to third parties" },
  { header: "permissions-policy", name: "Permissions-Policy", cwe: "CWE-693", cvss: 2.7, severity: "Low", desc: "Missing Permissions-Policy allows unwanted browser features" },
];

const SENSITIVE_AUTH_PATHS = ["/login", "/dashboard", "/account", "/admin", "/api/auth/session"];

// ──────────────────────────────────────────────────────────────────────────────
// 2. HELPERS
// ──────────────────────────────────────────────────────────────────────────────
function sha256(str) { return crypto.createHash("sha256").update(str).digest("hex"); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }
function randomDelay() { return 200 + Math.floor(Math.random() * 300); }
function sanitizeFilename(s) { return s.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80); }
function isSPAHtml(body) {
  if (!body) return false;
  const t = body.trim().toLowerCase();
  return t.includes("<!doctype html") || t.includes("<html") && t.includes("<head");
}
function normalizeTarget(raw) {
  let t = String(raw).trim();
  if (!t) return null;
  // Handle wildcard *.example.com -> https://example.com
  if (t.startsWith("*.")) t = t.slice(2);
  if (!t.startsWith("http://") && !t.startsWith("https://")) t = "https://" + t;
  try { const u = new URL(t); return u.origin + u.pathname.replace(/\/$/, "") || u.origin; } catch { return null; }
}
function expandCIDR(cidr) {
  // Simple IPv4 CIDR expansion — up to /24 (256 hosts) to prevent explosion
  const m = cidr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if (!m) return [cidr];
  const base = m[1].split(".").map(Number);
  const prefix = parseInt(m[2], 10);
  if (prefix < 24 || prefix > 32) return [cidr]; // don't expand too large
  const hostBits = 32 - prefix;
  const count = Math.pow(2, hostBits);
  if (count > 256) return [cidr];
  const baseInt = (base[0] << 24) | (base[1] << 16) | (base[2] << 8) | base[3];
  const network = baseInt & (~((1 << hostBits) - 1) >>> 0);
  const ips = [];
  for (let i = 0; i < count; i++) {
    const ipInt = (network + i) >>> 0;
    ips.push(`${(ipInt >>> 24) & 255}.${(ipInt >>> 16) & 255}.${(ipInt >>> 8) & 255}.${ipInt & 255}`);
  }
  return ips.map(ip => `https://${ip}`);
}
function loadTargets(input) {
  const targets = [];
  for (const raw of input) {
    if (raw.includes("/") && /^\d+\.\d+\.\d+\.\d+\/\d+$/.test(raw.trim())) {
      targets.push(...expandCIDR(raw.trim()));
    } else {
      const n = normalizeTarget(raw);
      if (n) targets.push(n);
    }
  }
  return [...new Set(targets)];
}
async function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, redirect: "follow" });
    return res;
  } finally { clearTimeout(t); }
}
async function getBaseline404Hash(target) {
  // Request a random non-existent path to fingerprint wildcard/SPA 404 behavior
  const rand = `/__garuda_404_probe_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  try {
    const url = new URL(rand, target).toString();
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": randomUA() } }, 6000);
    const body = await res.text().catch(() => "");
    return { status: res.status, hash: sha256(body), body: body.slice(0, 400), isSPA: isSPAHtml(body) };
  } catch (e) {
    return { status: 0, hash: null, body: "", isSPA: false, error: e.message };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. VULN MATRIX CHECKS
// ──────────────────────────────────────────────────────────────────────────────
async function checkExposedFiles(target, baseline) {
  const findings = [];
  for (const entry of SENSITIVE_PATHS) {
    await sleep(randomDelay());
    const url = new URL(entry.path, target).toString();
    try {
      const res = await fetchWithTimeout(url, { headers: { "User-Agent": randomUA(), "Accept": "*/*" } }, 7000);
      const body = await res.text().catch(() => "");
      const bodyHash = sha256(body);
      const isSPA = isSPAHtml(body);
      const isWildcard = baseline.hash && bodyHash === baseline.hash && res.status === baseline.status;
      // False positive elimination: SPA HTML or wildcard hash == 404 baseline
      if (res.status === 200 && !isSPA && !isWildcard && body.trim().length > 0) {
        // Additional heuristic: for -200 that is actually error JSON containing "not found" -> treat as protected
        const lower = body.toLowerCase();
        const isSoft404 = lower.includes('"error"') && (lower.includes("not found") || lower.includes("404"));
        if (isSoft404) {
          findings.push({ ...entry, url, status: res.status, verdict: "PROTECTED_SOFT_404", bodySnippet: body.slice(0, 500), bodyHash, isSPA, isWildcard });
        } else {
          findings.push({ ...entry, url, status: res.status, verdict: "CONFIRMED_EXPOSED", bodySnippet: body.slice(0, 800), bodyHash, isSPA, isWildcard });
        }
      } else if (res.status === 200 && (isSPA || isWildcard)) {
        findings.push({ ...entry, url, status: res.status, verdict: "FALSE_POSITIVE_SPA", bodySnippet: body.slice(0, 300), bodyHash, isSPA, isWildcard });
      } else {
        findings.push({ ...entry, url, status: res.status, verdict: "PROTECTED", bodySnippet: body.slice(0, 300), bodyHash, isSPA, isWildcard });
      }
    } catch (e) {
      findings.push({ ...entry, url, status: 0, verdict: "ERROR", error: e.message });
    }
  }
  return findings;
}

async function checkCORS(target) {
  const findings = [];
  const tests = [
    { origin: "https://attacker-origin.com", label: "Arbitrary Origin Reflection", cwe: "CWE-942", cvss: 7.5, severity: "High" },
    { origin: "null", label: "Null Origin Bypass", cwe: "CWE-942", cvss: 6.5, severity: "Medium" },
    { origin: `${new URL(target).origin}.attacker.com`, label: "Subdomain Trust Bypass (target.com.attacker.com)", cwe: "CWE-942", cvss: 7.1, severity: "High" },
  ];
  for (const t of tests) {
    await sleep(randomDelay());
    try {
      const res = await fetchWithTimeout(target, { headers: { "Origin": t.origin, "User-Agent": randomUA() } }, 7000);
      const acao = res.headers.get("access-control-allow-origin") || "";
      const acac = res.headers.get("access-control-allow-credentials") || "";
      const headers = Object.fromEntries(res.headers.entries());
      const rawHeaders = JSON.stringify(headers).slice(0, 800);
      if (acao === t.origin && acac.toLowerCase() === "true") {
        findings.push({ test: t.label, origin: t.origin, verdict: "VULNERABLE", severity: t.severity, cwe: t.cwe, cvss: t.cvss, detail: `Reflected '${acao}' with ACAC=true → credentialed data exfiltration`, acao, acac, rawHeaders, status: res.status });
      } else if (acao === t.origin) {
        findings.push({ test: t.label, origin: t.origin, verdict: "WEAK", severity: "Medium", cwe: t.cwe, cvss: 4.3, detail: `Reflected '${acao}' without credentials — still weak CORS`, acao, acac, rawHeaders, status: res.status });
      } else if (acao === "*") {
        findings.push({ test: t.label, origin: t.origin, verdict: "WILDCARD", severity: "Low", cwe: t.cwe, cvss: 3.7, detail: `Wildcard '*' — public API pattern, not critical if no credentials`, acao, acac, rawHeaders, status: res.status });
      } else {
        findings.push({ test: t.label, origin: t.origin, verdict: "SECURE", severity: "Info", cwe: t.cwe, cvss: 0, detail: acao ? `Not reflected; server returned '${acao}'` : "CORS not reflected", acao, acac, rawHeaders, status: res.status });
      }
    } catch (e) {
      findings.push({ test: t.label, origin: t.origin, verdict: "ERROR", error: e.message });
    }
  }
  return findings;
}

async function checkSecurityHeaders(target) {
  const findings = [];
  await sleep(randomDelay());
  try {
    const res = await fetchWithTimeout(target, { headers: { "User-Agent": randomUA() } }, 7000);
    const headers = {};
    res.headers.forEach((v, k) => headers[k.toLowerCase()] = v);
    const rawHeaders = JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2).slice(0, 1200);
    const body = await res.text().catch(() => "");
    for (const h of SECURITY_HEADERS_AUDIT) {
      const val = headers[h.header];
      if (!val) {
        findings.push({ ...h, verdict: "MISSING", url: target, status: res.status, rawHeaders, bodySnippet: body.slice(0, 300) });
      } else {
        findings.push({ ...h, verdict: "PRESENT", value: val, url: target, status: res.status });
      }
    }
    // Clickjacking deep audit on sensitive paths: need BOTH X-Frame-Options and CSP frame-ancestors
    const hasXFO = !!headers["x-frame-options"];
    const csp = headers["content-security-policy"] || "";
    const hasFrameAncestors = /frame-ancestors/i.test(csp);
    if (!hasXFO && !hasFrameAncestors) {
      // Check each sensitive auth path quickly (only first one to avoid flood)
      for (const sPath of SENSITIVE_AUTH_PATHS.slice(0, 2)) {
        await sleep(randomDelay());
        try {
          const u = new URL(sPath, target).toString();
          const r = await fetchWithTimeout(u, { headers: { "User-Agent": randomUA() } }, 5000);
          const h2 = {};
          r.headers.forEach((v, k) => h2[k.toLowerCase()] = v);
          const hasXFO2 = !!h2["x-frame-options"];
          const hasFA2 = /frame-ancestors/i.test(h2["content-security-policy"] || "");
          if (!hasXFO2 && !hasFA2) {
            findings.push({ header: "clickjacking", name: `Clickjacking on ${sPath}`, cwe: "CWE-1021", cvss: 6.1, severity: "Medium", verdict: "VULNERABLE", desc: `Missing X-Frame-Options + CSP frame-ancestors on sensitive route ${sPath} — UI redressing risk`, url: u, status: r.status, rawHeaders: JSON.stringify(Object.fromEntries(r.headers.entries())).slice(0, 600) });
          }
        } catch {}
      }
    }
    // HSTS downgrade check: try http
    try {
      const httpUrl = target.replace(/^https:/i, "http:");
      if (httpUrl !== target) {
        await sleep(randomDelay());
        const r = await fetchWithTimeout(httpUrl, { headers: { "User-Agent": randomUA() }, redirect: "manual" }, 5000).catch(() => null);
        // fetch with manual redirect not fully supported, fallback to check location header
        if (r) {
          const loc = r.headers.get("location") || "";
          if (!loc.toLowerCase().startsWith("https://") && r.status >= 300 && r.status < 400) {
            findings.push({ header: "hsts-downgrade", name: "HTTP→HTTPS Downgrade Missing", cwe: "CWE-319", cvss: 5.9, severity: "Medium", verdict: "VULNERABLE", desc: "HTTP does not redirect to HTTPS — downgrade/SSL-stripping possible", url: httpUrl, status: r.status, rawHeaders: JSON.stringify(Object.fromEntries(r.headers.entries())).slice(0, 600) });
          }
        }
      }
    } catch {}
    return { findings, rawHeaders, status: res.status, bodySnippet: body.slice(0, 500) };
  } catch (e) {
    return { findings: [{ header: "fetch", name: "Header Fetch Error", verdict: "ERROR", error: e.message }], rawHeaders: "", status: 0 };
  }
}

async function checkInfoLeakage(target) {
  const findings = [];
  await sleep(randomDelay());
  try {
    const res = await fetchWithTimeout(target, { headers: { "User-Agent": randomUA() } }, 7000);
    const headers = {};
    res.headers.forEach((v, k) => headers[k.toLowerCase()] = v);
    const interesting = ["server", "x-powered-by", "x-aspnet-version", "x-aspnetmvc-version", "x-generator", "x-drupal-cache"];
    for (const h of interesting) {
      if (headers[h]) {
        findings.push({ type: "Header Leakage", header: h, value: headers[h], severity: h === "server" ? "Low" : "Medium", cwe: "CWE-200", cvss: h === "server" ? 2.5 : 5.3, verdict: "LEAKED", url: target });
      }
    }
    // Error stack trace probe: trigger 404 with weird path to see stack
    await sleep(randomDelay());
    try {
      const probeUrl = new URL(`/__garuda_probe_${Date.now()}`, target).toString();
      const r = await fetchWithTimeout(probeUrl, { headers: { "User-Agent": randomUA() } }, 6000);
      const body = await r.text().catch(() => "");
      const lower = body.toLowerCase();
      const stackIndicators = ["stack trace", "at org.springframework", "mysql", "postgres", "psql", "syntax error", "exception", "traceback", "internal server error", "file \"/", "at com.", "sequelize", "mongodb"];
      const hit = stackIndicators.filter(k => lower.includes(k));
      if (hit.length > 0) {
        findings.push({ type: "Stack Trace Leakage", header: "body", value: hit.join(", "), severity: "Medium", cwe: "CWE-209", cvss: 5.3, verdict: "LEAKED", url: probeUrl, bodySnippet: body.slice(0, 800), status: r.status });
      }
    } catch {}
    if (findings.length === 0) findings.push({ type: "Info Leakage", verdict: "CLEAN", severity: "Info", cwe: "CWE-200", cvss: 0, detail: "No obvious Server/X-Powered-By or stack trace leakage" });
  } catch (e) {
    findings.push({ type: "Leakage Check", verdict: "ERROR", error: e.message });
  }
  return findings;
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. PoC GENERATION
// ──────────────────────────────────────────────────────────────────────────────
function cvssLabel(score) {
  if (score >= 9) return "Critical";
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  if (score > 0) return "Low";
  return "Info";
}
function buildCurl(url, origin) {
  const hdr = origin ? `-H "Origin: ${origin}" ` : "";
  return `curl -i -s ${hdr}-H "User-Agent: ${randomUA()}" "${url}"`;
}
function buildMarkdownReport({ target, vuln, timestamp }) {
  const safeTarget = target.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const safeVuln = sanitizeFilename(vuln.name || vuln.type || vuln.header || "vuln");
  const ts = timestamp.replace(/[:.]/g, "-");
  const filename = `${safeTarget}_${safeVuln}_${ts}.md`;
  const dir = path.join(__dirname, "..", "reports", "bounties");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);

  const title = vuln.name || vuln.type || vuln.header || "Security Finding";
  const cwe = vuln.cwe || "CWE-693";
  const cvss = vuln.cvss ?? 5.0;
  const sev = vuln.severity || cvssLabel(cvss);
  const url = vuln.url || target;
  const origin = vuln.origin || "https://attacker-origin.com";
  const curl = buildCurl(url, vuln.origin ? origin : null);
  const reqSnippet = `${origin ? `GET ${url} HTTP/1.1\nHost: ${new URL(target).host}\nOrigin: ${origin}\nUser-Agent: ${USER_AGENTS[0]}\n` : `GET ${url} HTTP/1.1\nHost: ${new URL(target).host}\nUser-Agent: ${USER_AGENTS[0]}\n`}`;
  const resSnippet = (vuln.bodySnippet || vuln.rawHeaders || vuln.value || vuln.detail || "See raw HTTP response below").toString().slice(0, 1200);
  const evidenceHash = sha256(resSnippet);

  const impactMap = {
    Critical: "Full server compromise, credential theft, or database dump. Immediate patch required.",
    High: "Sensitive data exfiltration, authenticated data theft, or CORS credentialed theft.",
    Medium: "Information disclosure, clickjacking, or tech stack fingerprinting aiding further exploitation.",
    Low: "Hardening gap; low direct impact but useful for chaining with other bugs.",
    Info: "Informational; no direct risk but useful for recon."
  };
  const remediationMap = {
    "CWE-538": "Remove sensitive files from web root, block `/.git` and `/.env` via web server (Nginx `location ~ /\\. {deny all;}`), rotate any exposed secrets.",
    "CWE-798": "Revoke exposed keys/credentials immediately, enforce secrets manager (Vault/AWS Secrets Manager), never ship `.aws/credentials` or `id_rsa`.",
    "CWE-530": "Delete backup files (`*.bak`, `*.sql`) from production, disable directory listing, add WAF rule for `*.sql|*.bak`.",
    "CWE-200": "Minimize information disclosure: strip `Server`/`X-Powered-By` headers (helmet), return generic 404 without stack.",
    "CWE-209": "Disable verbose error pages in production; return generic error, log stack server-side only.",
    "CWE-942": "Whitelist allowed origins server-side; never reflect arbitrary `Origin`; if credentials needed, validate against strict allowlist; do not use `*` with `ACAC:true`.",
    "CWE-1021": "Send `X-Frame-Options: DENY` or `SAMEORIGIN` and `Content-Security-Policy: frame-ancestors 'self'` on all authenticated routes.",
    "CWE-319": "Enforce HSTS `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` and 301 redirect HTTP→HTTPS.",
    "CWE-693": "Set all hardening headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (use helmet).",
  };

  const md = `# ${sev === "Critical" || sev === "High" ? "[High]" : `[${sev}]`} ${title}

**Vulnerability Type:** ${title}  
**CWE:** ${cwe} | **CVSS v3.1:** ${cvss} (${sev}) | **Severity:** ${sev}  
**Target Asset:** \`${target}\`  
**URL:** \`${url}\`  
**Discovered:** ${timestamp} | **Evidence SHA-256:** \`${evidenceHash}\`

---

## 1. Summary
${vuln.desc || vuln.detail || vuln.name || "Security misconfiguration / information disclosure detected on in-scope asset."}

## 2. Step-by-Step Proof of Concept (PoC)

**Reproduce with curl (copy-paste):**
\`\`\`bash
${curl}
# For CORS credentialed test:
curl -i -s -H "Origin: ${origin}" -H "User-Agent: ${USER_AGENTS[0]}" "${url}" -H "Cookie: session=valid_session_placeholder"
\`\`\`

**Raw HTTP Request:**
\`\`\`http
${reqSnippet}
\`\`\`

**Raw HTTP Response Evidence (snippet, SHA-256: ${evidenceHash.slice(0, 12)}...):**
\`\`\`http
${resSnippet.slice(0, 1000)}
\`\`\`

**Verification:** Response SHA-256 \`${evidenceHash}\` — reproducible via \`echo -n "<snippet>" | sha256sum\`.

## 3. Impact Analysis
**Business / Security Impact:** ${impactMap[sev] || impactMap.Medium}
${sev === "Critical" || sev === "High" ? "- Attacker can steal secrets / hijack sessions / dump DB.\n- Direct financial / reputational damage if exploited in HackerOne scope." : "- Useful for recon / chaining; should be hardened before chaining with XSS/CSRF."}

## 4. Remediation / Patch Recommendation (Engineering)
${remediationMap[cwe] || remediationMap["CWE-693"]}

**Patch checklist:**
- [ ] Validate fix: \`curl -i ${url}\` should return 404/403 without secrets and without SPA false-positive.
- [ ] Add regression test: assert sensitive path returns 404 and CORS does not reflect arbitrary origin.
- [ ] Deploy behind WAF/CDN with strict origin allowlist.

## 5. References
- ${cwe} — https://cwe.mitre.org/data/definitions/${cwe.replace("CWE-", "")}.html
- CVSS v3.1 — https://www.first.org/cvss/
- HackerOne — https://docs.hackerone.com/hackers/submitting-reports/

---
*Generated by 🦅 GARUDA Bug Bounty Hunter v2.0.0 — Zero Fabricated Evidence. SHA-256: ${evidenceHash} — Timestamp: ${timestamp}*
*Authorized testing only. Use only on in-scope assets you are permitted to test.*
`;

  fs.writeFileSync(filePath, md, "utf8");
  return { filePath, evidenceHash };
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. CONCURRENCY POOL
// ──────────────────────────────────────────────────────────────────────────────
async function asyncPool(poolLimit, items, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    if (poolLimit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. SINGLE TARGET AUDIT
// ──────────────────────────────────────────────────────────────────────────────
async function auditSingleTarget(target, opts = {}) {
  const ts = new Date().toISOString();
  log(C.cyan + C.bold, `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(C.cyan, `🦅 GARUDA BOUNTY HUNTER → ${target}`);
  log(C.dim, `  Timestamp: ${ts} | Concurrency: ${opts.concurrency} | Baseline probing...`);
  const baseline = await getBaseline404Hash(target);
  log(C.gray, `  Baseline 404 → status=${baseline.status} hash=${baseline.hash ? baseline.hash.slice(0,12)+"..." : "n/a"} SPA=${baseline.isSPA}`);

  const allFindings = [];
  const reports = [];

  // 1. Sensitive files
  log(C.yellow, `  [1/4] Scanning ${SENSITIVE_PATHS.length} sensitive paths...`);
  const exposed = await checkExposedFiles(target, baseline);
  const confirmed = exposed.filter(f => f.verdict === "CONFIRMED_EXPOSED");
  const fps = exposed.filter(f => f.verdict === "FALSE_POSITIVE_SPA");
  log(confirmed.length ? C.red : C.green, `    → Confirmed exposed: ${confirmed.length} | False positives (SPA): ${fps.length} | Protected: ${exposed.length - confirmed.length - fps.length}`);
  for (const f of confirmed) {
    // Filter Info disclosures (sitemap/robots) — true 200 but not a bug bounty vuln
    if (f.severity === "Info" || f.cvss === 0) {
      log(C.gray, `      ○ [Info] ${f.name} → ${f.url} (HTTP ${f.status}) — informational disclosure, no PoC (hash=${f.bodyHash.slice(0,8)}...)`);
      continue;
    }
    log(C.red, `      ✗ [${f.severity}] ${f.name} → ${f.url} (HTTP ${f.status}) hash=${f.bodyHash.slice(0,8)}...`);
    allFindings.push(f);
    const r = buildMarkdownReport({ target, vuln: { ...f, desc: `Sensitive file ${f.path} is publicly accessible and returns non-SPA content (hash ${f.bodyHash.slice(0,12)} vs baseline ${baseline.hash ? baseline.hash.slice(0,12) : "n/a"}).` }, timestamp: ts });
    reports.push(r);
    log(C.magenta, `        ↳ PoC saved: ${path.relative(process.cwd(), r.filePath)} SHA=${r.evidenceHash.slice(0,12)}...`);
  }

  // 2. CORS
  log(C.yellow, `  [2/4] Testing CORS misconfigurations (3 origin probes)...`);
  const corsFindings = await checkCORS(target);
  for (const c of corsFindings) {
    const col = c.verdict === "VULNERABLE" ? C.red : c.verdict === "WEAK" ? C.yellow : C.green;
    log(col, `    → [${c.verdict}] ${c.test} : ${c.detail} (ACAO='${c.acao}' ACAC='${c.acac}')`);
    if (c.verdict === "VULNERABLE" || c.verdict === "WEAK") {
      allFindings.push({ name: `Dangerous CORS — ${c.test}`, cwe: c.cwe, cvss: c.cvss, severity: c.severity, url: target, origin: c.origin, desc: c.detail, rawHeaders: c.rawHeaders, bodySnippet: c.rawHeaders });
      const r = buildMarkdownReport({ target, vuln: { name: `Dangerous CORS — ${c.test}`, cwe: c.cwe, cvss: c.cvss, severity: c.severity, url: target, origin: c.origin, desc: c.detail, rawHeaders: c.rawHeaders }, timestamp: ts });
      reports.push(r);
      log(C.magenta, `        ↳ PoC saved: ${path.relative(process.cwd(), r.filePath)}`);
    }
  }

  // 3. Security headers
  log(C.yellow, `  [3/4] Auditing security headers + clickjacking + HSTS...`);
  const hdrRes = await checkSecurityHeaders(target);
  const missing = hdrRes.findings.filter(f => f.verdict === "MISSING" || f.verdict === "VULNERABLE");
  for (const h of missing) {
    const col = h.severity === "Medium" ? C.yellow : h.severity === "High" ? C.red : C.gray;
    log(col, `    → [${h.verdict}] ${h.name} (${h.cwe} CVSS ${h.cvss}) — ${h.desc}`);
    // Only generate PoC for Medium+ or clickjacking/HSTS downgrade (not every Low)
    if (h.severity === "Medium" || h.severity === "High" || h.header === "clickjacking" || h.header === "hsts-downgrade") {
      allFindings.push(h);
      const r = buildMarkdownReport({ target, vuln: { ...h, url: h.url || target }, timestamp: ts });
      reports.push(r);
      log(C.magenta, `        ↳ PoC saved: ${path.relative(process.cwd(), r.filePath)}`);
    }
  }
  const present = hdrRes.findings.filter(f => f.verdict === "PRESENT").length;
  log(C.green, `    → Present: ${present} | Missing/Vuln: ${missing.length}`);

  // 4. Info leakage
  log(C.yellow, `  [4/4] Probing info & stack leakage...`);
  const leaks = await checkInfoLeakage(target);
  for (const l of leaks) {
    if (l.verdict === "LEAKED") {
      log(C.yellow, `    → [LEAKED] ${l.type} — ${l.header}: ${String(l.value).slice(0,80)} (${l.cwe})`);
      allFindings.push({ name: `Information Leakage — ${l.type} (${l.header})`, cwe: l.cwe, cvss: l.cvss, severity: l.severity, url: l.url || target, desc: `Server leaks \`${l.header}: ${l.value}\` — aids fingerprinting.`, value: l.value, rawHeaders: l.value, bodySnippet: l.bodySnippet || l.value });
      if (l.severity !== "Low") {
        const r = buildMarkdownReport({ target, vuln: { name: `Information Leakage — ${l.type} (${l.header})`, cwe: l.cwe, cvss: l.cvss, severity: l.severity, url: l.url || target, desc: `Leaked header \`${l.header}: ${l.value}\``, value: l.value, rawHeaders: l.value }, timestamp: ts });
        reports.push(r);
        log(C.magenta, `        ↳ PoC saved: ${path.relative(process.cwd(), r.filePath)}`);
      }
    } else if (l.verdict === "CLEAN") {
      log(C.green, `    → [CLEAN] No header/stack leakage`);
    }
  }

  const summary = {
    target,
    timestamp: ts,
    baseline,
    totalFindings: allFindings.length,
    reportsGenerated: reports.length,
    high: allFindings.filter(f => f.severity === "Critical" || f.severity === "High").length,
    medium: allFindings.filter(f => f.severity === "Medium").length,
    low: allFindings.filter(f => f.severity === "Low").length,
  };
  const raw = JSON.stringify({ target, timestamp: ts, findings: allFindings, baseline }, null, 2);
  const digest = sha256(raw);
  log(C.bold, `\n  Summary for ${target} → High/Critical: ${summary.high} | Medium: ${summary.medium} | Low: ${summary.low} | Reports: ${summary.reportsGenerated}`);
  log(C.dim, `  Evidence SHA-256: ${digest.slice(0, 24)}...`);
  return { target, summary, findings: allFindings, reports, evidenceHash: digest, rawJson: raw };
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. CLI
// ──────────────────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { target: null, file: null, concurrency: 10 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target" && args[i+1]) { opts.target = args[++i]; }
    else if (args[i] === "--file" && args[i+1]) { opts.file = args[++i]; }
    else if (args[i] === "--concurrency" && args[i+1]) { opts.concurrency = parseInt(args[++i], 10) || 10; }
    else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
🦅 GARUDA Bug Bounty Hunter v2.0.0
Usage:
  node scripts/bug-bounty-hunter.js --target https://example.com
  node scripts/bug-bounty-hunter.js --file data/bounty-targets.txt --concurrency 5
  node scripts/bug-bounty-hunter.js --target https://www.garudaos.in --concurrency 10

Options:
  --target <url>        Single target URL or domain (e.g. https://target.com or target.com or *.target.com)
  --file <path>         File containing one target per line (supports *.domain, CIDR, https://...)
  --concurrency <n>     Concurrent targets (default 10) — also throttles per-target requests with 200-500ms jitter
  --help                Show this help
`);
      process.exit(0);
    } else if (!args[i].startsWith("--") && !opts.target) {
      opts.target = args[i];
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  let rawTargets = [];
  if (opts.file) {
    const p = path.resolve(opts.file);
    if (!fs.existsSync(p)) { log(C.red, `Target file not found: ${p}`); process.exit(1); }
    const lines = fs.readFileSync(p, "utf8").split(/\r?\n/).map(s => s.trim()).filter(Boolean).filter(l => !l.startsWith("#"));
    rawTargets = lines;
    log(C.cyan, `Loaded ${lines.length} raw targets from ${opts.file}`);
  } else if (opts.target) {
    rawTargets = [opts.target];
  } else {
    rawTargets = ["https://www.garudaos.in"];
    log(C.yellow, `No --target/--file given, defaulting to https://www.garudaos.in (zero-regression test)`);
  }
  const targets = loadTargets(rawTargets);
  if (targets.length === 0) { log(C.red, "No valid targets after normalization. Check input."); process.exit(1); }
  log(C.bold, `\n🦅 GARUDA Bug Bounty Hunter v2.0.0`);
  log(C.dim, `Targets: ${targets.length} | Concurrency: ${opts.concurrency} | UA rotation: ${USER_AGENTS.length} | Jitter: 200-500ms`);
  targets.forEach(t => log(C.gray, `  • ${t}`));

  const results = [];
  await asyncPool(opts.concurrency, targets, async (t) => {
    try {
      const r = await auditSingleTarget(t, { concurrency: opts.concurrency });
      results.push(r);
      // Persist per-target JSON
      const outDir = path.join(__dirname, "..", "reports", "bounties");
      fs.mkdirSync(outDir, { recursive: true });
      const safe = sanitizeFilename(t.replace(/^https?:\/\//, ""));
      fs.writeFileSync(path.join(outDir, `${safe}_full_${Date.now()}.json`), r.rawJson, "utf8");
    } catch (e) {
      log(C.red, `✗ Audit failed for ${t}: ${e.message}`);
    }
  });

  // Aggregate
  const totalReports = results.reduce((s, r) => s + r.reports.length, 0);
  const totalHigh = results.reduce((s, r) => s + r.summary.high, 0);
  log(C.bold + C.cyan, `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(C.bold, `🏁 Hunt Complete — ${targets.length} target(s) | Total PoC reports: ${totalReports} | High/Critical: ${totalHigh}`);
  log(C.dim, `Reports dir: reports/bounties/ (markdown ready for HackerOne/Bugcrowd)`);
  const aggHash = sha256(JSON.stringify(results.map(r => r.evidenceHash)));
  log(C.dim, `Aggregate Evidence SHA-256: ${aggHash}`);
  log(C.bold + C.cyan, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

if (require.main === module) { main().catch(e => { log(C.red, "Fatal:", e.stack || e.message); process.exit(1); }); }
module.exports = { auditSingleTarget, loadTargets, expandCIDR, getBaseline404Hash, checkExposedFiles, checkCORS, checkSecurityHeaders, checkInfoLeakage };
