/**
 * 🦅 GARUDA Sovereign Pre-Flight Email Verification Engine
 * Enforces Rule 15 of AGENTS.md / GEMINI.md ("Zero-Bounce Mandate")
 * Validates: Syntax -> Disposable Check -> Authoritative DNS MX Check
 */

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
  "trashmail.com", "yopmail.com", "sharklasers.com", "dispostable.com"
]);

async function verifyEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, reason: "EMPTY_OR_INVALID_TYPE" };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Syntax Check
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return { valid: false, email: cleanEmail, reason: "INVALID_SYNTAX" };
  }

  const parts = cleanEmail.split("@");
  if (parts.length !== 2) {
    return { valid: false, email: cleanEmail, reason: "MALFORMED_EMAIL" };
  }

  const [localPart, domain] = parts;

  // Check minimum length / generic traps
  if (localPart.length === 0 || domain.length < 3 || !domain.includes(".")) {
    return { valid: false, email: cleanEmail, reason: "INVALID_DOMAIN_FORMAT" };
  }

  // 2. Disposable check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, email: cleanEmail, reason: "DISPOSABLE_DOMAIN_REJECTED" };
  }

  // 3. DNS MX Record Resolution
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, email: cleanEmail, domain, reason: "NO_MX_RECORDS" };
    }

    // Sort by priority
    mxRecords.sort((a, b) => a.priority - b.priority);

    return {
      valid: true,
      email: cleanEmail,
      domain,
      primaryMx: mxRecords[0].exchange,
      mxCount: mxRecords.length
    };
  } catch (err) {
    return { valid: false, email: cleanEmail, domain, reason: `DNS_RESOLUTION_FAILED: ${err.code || err.message}` };
  }
}

module.exports = { verifyEmail };

// Standalone CLI test mode
if (require.main === module) {
  const target = process.argv[2] || "praveen@garudaos.in";
  console.log(`Checking email: ${target}...`);
  verifyEmail(target).then(res => {
    console.log("Result:", JSON.stringify(res, null, 2));
    process.exit(res.valid ? 0 : 1);
  });
}
