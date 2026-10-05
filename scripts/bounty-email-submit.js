#!/usr/bin/env node
/**
 * GARUDA Bounty Email Submitter
 * Sends vulnerability reports directly to program security teams
 * No platform restrictions, no signal requirements
 */

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// SMTP Config — Zoho (praveen@garudaos.in)
const SMTP_HOST = process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in";
const SMTP_PORT = parseInt(process.env.GARUDA_EMAIL_PORT || "465");
const SMTP_USER = process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in";
const SMTP_PASS = process.env.GARUDA_EMAIL_PASS || "sLqhcvpZ7kS1";
const FROM_EMAIL = SMTP_USER;
const FROM_NAME = "Praveen Mahawar — Security Researcher";

// Report data
const REPORTS_DIR = path.join(__dirname, "..", "reports", "bounties");

const TARGETS = [
  {
    name: "Yelp",
    email: "security@yelp.com",
    subject: "[Security] Dangerous CORS Misconfiguration on yelp.com — Arbitrary Origin Reflection with Credentials",
    file: "HACKERONE_YELP_CORS_SUBMISSION.md"
  }
];

function buildEmailBody(report) {
  return `
Dear Yelp Security Team,

I am writing to report a security vulnerability discovered during authorized security research on yelp.com.

VULNERABILITY SUMMARY
=====================
Type: Cross-Origin Resource Sharing (CORS) Misconfiguration
Severity: High (CVSS 7.5)
CWE: CWE-942
Asset: https://yelp.com

ISSUE
=====
Yelp's main domain (yelp.com) reflects arbitrary Origin headers in the Access-Control-Allow-Origin response header while simultaneously setting Access-Control-Allow-Credentials: true.

Two distinct CORS misconfigurations were identified:

1. ARBITRARY ORIGIN REFLECTION
   - Any origin (e.g., https://attacker-origin.com) is reflected back with credentials allowed
   - This allows any malicious website to make credentialed cross-origin requests and read the full response

2. SUBDOMAIN TRUST BYPASS
   - Any origin ending in .attacker.com (e.g., https://yelp.com.attacker.com) is reflected back with credentials allowed
   - This bypasses subdomain-based origin validation

PROOF OF CONCEPT
================
Vuln 1 - Arbitrary Origin Reflection:

curl -i -s -H "Origin: https://attacker-origin.com" -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15" "https://yelp.com"

Response headers:
  Access-Control-Allow-Origin: https://attacker-origin.com
  Access-Control-Allow-Credentials: true

Vuln 2 - Subdomain Trust Bypass:

curl -i -s -H "Origin: https://yelp.com.attacker.com" -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15" "https://yelp.com"

Response headers:
  Access-Control-Allow-Origin: https://yelp.com.attacker.com
  Access-Control-Allow-Credentials: true

IMPACT
======
An attacker can steal sensitive user data including personal information, reviews, messages, and session tokens from any logged-in Yelp user by hosting a malicious page that makes credentialed cross-origin requests to yelp.com.

This vulnerability enables:
- Theft of authenticated user sessions
- Exfiltration of personal profile data
- Access to private messages and reviews
- Potential account takeover via stolen credentials

REMEDIATION
==========
Implement a strict server-side origin allowlist. Never reflect arbitrary Origin headers. Validate origins against a whitelist of legitimate Yelp domains only.

REFERENCES
==========
- CWE-942: https://cwe.mitre.org/data/definitions/942.html
- OWASP CORS Testing: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing

I am available to provide additional details or clarification if needed. I request that this vulnerability be acknowledged and the appropriate remediation be applied.

Best regards,
Praveen Mahawar
Security Researcher
https://www.garudaos.in
`.trim();
}

async function sendReport(target) {
  console.log(`\nSending report to ${target.name} (${target.email})...`);

  // Check SMTP config
  if (!SMTP_USER || !SMTP_PASS) {
    console.log("ERROR: SMTP not configured!");
    console.log("Set SMTP_USER and SMTP_PASS in .env or environment");
    console.log("Example: $env:SMTP_USER='your-brevo-email'; $env:SMTP_PASS='your-brevo-api-key'");
    return false;
  }

  // Read report file if exists
  let reportContent = "";
  const reportPath = path.join(REPORTS_DIR, target.file);
  if (fs.existsSync(reportPath)) {
    reportContent = fs.readFileSync(reportPath, "utf8");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: target.email,
    subject: target.subject,
    text: buildEmailBody(target),
    attachments: reportContent ? [{
      filename: `vulnerability-report-${target.name.toLowerCase()}.md`,
      content: reportContent,
      contentType: "text/markdown"
    }] : []
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`SUCCESS! Message ID: ${info.messageId}`);
    console.log(`Response: ${info.response}`);

    // Save sent log
    const logEntry = {
      to: target.email,
      subject: target.subject,
      sentAt: new Date().toISOString(),
      messageId: info.messageId,
      response: info.response
    };
    const logPath = path.join(REPORTS_DIR, "sent-emails.json");
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, "utf8"));
    }
    logs.push(logEntry);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    console.log(`Log saved: ${logPath}`);

    return true;
  } catch (error) {
    console.log(`FAILED: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("GARUDA Bounty Email Submitter");
  console.log("=============================");

  // Check if specific target passed
  const targetName = process.argv[2];
  let targets = TARGETS;
  if (targetName) {
    targets = TARGETS.filter(t => t.name.toLowerCase() === targetName.toLowerCase());
    if (targets.length === 0) {
      console.log(`Target "${targetName}" not found. Available: ${TARGETS.map(t => t.name).join(", ")}`);
      process.exit(1);
    }
  }

  let sent = 0;
  for (const target of targets) {
    const success = await sendReport(target);
    if (success) sent++;
  }

  console.log(`\nDone! Sent ${sent}/${targets.length} reports.`);
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
