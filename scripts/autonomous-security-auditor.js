/**
 * 🦅 GARUDA Autonomous Security & Vulnerability Auditor
 * 
 * Capability:
 * Defensive automated scanning of web endpoints, APIs, and domains to identify:
 * 1. Missing Security Headers (HSTS, CSP, X-Frame-Options, Referrer-Policy, etc.)
 * 2. Permissive CORS Configurations & Origin Reflection
 * 3. Sensitive Information & Path Disclosure (.env, .git, debug endpoints)
 * 4. Generates formatted Bug Bounty / Vulnerability Proof-of-Concept (PoC) Reports
 * 
 * 100% Anti-Fabrication Law: Verified SHA-256 evidence, truthful reporting.
 */

const https = require("https");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SECURITY_HEADERS = [
  { header: "strict-transport-security", name: "HSTS (Strict-Transport-Security)", severity: "Medium" },
  { header: "content-security-policy", name: "CSP (Content-Security-Policy)", severity: "Medium" },
  { header: "x-frame-options", name: "Clickjacking Protection (X-Frame-Options)", severity: "Medium" },
  { header: "x-content-type-options", name: "MIME Sniffing (X-Content-Type-Options)", severity: "Low" },
  { header: "referrer-policy", name: "Referrer-Policy", severity: "Low" },
  { header: "permissions-policy", name: "Permissions-Policy", severity: "Low" }
];

const SENSITIVE_PATHS = [
  "/.env",
  "/.git/HEAD",
  "/api/debug",
  "/config.json",
  "/package.json",
  "/server-status"
];

async function auditTarget(targetUrl) {
  const urlObj = new URL(targetUrl);
  const results = {
    target: targetUrl,
    timestamp: new Date().toISOString(),
    sha256: null,
    headersCheck: [],
    corsCheck: null,
    sensitivePathsCheck: [],
    summary: { high: 0, medium: 0, low: 0, passed: 0 }
  };

  console.log(`======================================================`);
  console.log(`🦅 GARUDA AUTONOMOUS SECURITY AUDITOR: ${targetUrl}`);
  console.log(`======================================================\n`);

  // 1. Check Root Headers & CORS
  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: { "Origin": "https://attacker-origin.com" }
    });

    const headers = Object.fromEntries(res.headers.entries());

    // Check Headers
    for (const h of SECURITY_HEADERS) {
      const val = headers[h.header];
      if (val) {
        results.headersCheck.push({ name: h.name, status: "PRESENT", value: val });
        results.summary.passed++;
      } else {
        results.headersCheck.push({ name: h.name, status: "MISSING", severity: h.severity });
        if (h.severity === "Medium") results.summary.medium++;
        if (h.severity === "Low") results.summary.low++;
      }
    }

    // Check CORS
    const acao = headers["access-control-allow-origin"];
    const acac = headers["access-control-allow-credentials"];
    if (acao === "https://attacker-origin.com" && acac === "true") {
      results.corsCheck = { status: "VULNERABLE", detail: "Reflected arbitrary origin with credentials enabled (High Risk)" };
      results.summary.high++;
    } else if (acao === "*") {
      results.corsCheck = { status: "PUBLIC_API", detail: "Wildcard Access-Control-Allow-Origin (Standard for Public APIs)" };
    } else {
      results.corsCheck = { status: "SECURE", detail: acao ? `Restricted to: ${acao}` : "CORS header not reflected" };
      results.summary.passed++;
    }
  } catch (err) {
    console.error("Error checking root endpoint:", err.message);
  }

  // 2. Check Sensitive Paths
  for (const p of SENSITIVE_PATHS) {
    try {
      const testPath = new URL(p, targetUrl).toString();
      const res = await fetch(testPath, { method: "GET" });
      if (res.status === 200) {
        const text = await res.text();
        // Check if actually leaked or just returned SPA index.html
        if (text.includes("<!DOCTYPE html") || text.includes("<html")) {
          results.sensitivePathsCheck.push({ path: p, status: "SPA_FALLBACK (Safe)", code: res.status });
          results.summary.passed++;
        } else {
          results.sensitivePathsCheck.push({ path: p, status: "EXPOSED_CONTENT (Critical)", code: res.status });
          results.summary.high++;
        }
      } else {
        results.sensitivePathsCheck.push({ path: p, status: "PROTECTED", code: res.status });
        results.summary.passed++;
      }
    } catch (e) {
      results.sensitivePathsCheck.push({ path: p, status: "ERROR_UNREACHABLE" });
    }
  }

  const rawJson = JSON.stringify(results, null, 2);
  results.sha256 = crypto.createHash("sha256").update(rawJson).digest("hex");

  console.log("Headers Evaluation:");
  results.headersCheck.forEach(h => console.log(`  [${h.status}] ${h.name}`));
  console.log(`CORS Evaluation: [${results.corsCheck?.status}] ${results.corsCheck?.detail}`);
  console.log("Sensitive Paths Evaluation:");
  results.sensitivePathsCheck.forEach(s => console.log(`  [${s.status}] ${s.path} (HTTP ${s.code || 'N/A'})`));
  console.log(`\nAudit Summary: High: ${results.summary.high} | Medium: ${results.summary.medium} | Low: ${results.summary.low} | Passed: ${results.summary.passed}`);
  console.log(`Audit SHA-256 Digest: ${results.sha256}`);

  return results;
}

if (require.main === module) {
  const target = process.argv[2] || "https://www.garudaos.in";
  auditTarget(target).then(res => {
    const reportPath = path.join(__dirname, "..", "data", "security-audit-report.json");
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(res, null, 2), "utf8");
    console.log(`\nReport saved to: ${reportPath}`);
  }).catch(console.error);
}

module.exports = { auditTarget };
