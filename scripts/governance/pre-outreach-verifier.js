/**
 * 🦅 GARUDA PRE-OUTREACH LIVE LINK VERIFIER
 * Enforces Constitutional Law: "Live Verification Se Pehle Zero Dispatch"
 * 
 * Guarantees that no outreach message (WhatsApp, Instagram, Email, LinkedIn)
 * containing an external URL is EVER dispatched unless the URL:
 * 1. Returns HTTP 200 OK.
 * 2. Does NOT redirect to the root homepage (GARUDA SPA catch-all).
 * 3. Contains the prospect's verified business name in <title> or <h1>.
 * 4. Has authentic content (> 1000 bytes).
 */

const https = require("https");
const http = require("http");

/**
 * Verifies a single outreach demo URL.
 * @param {string} url - The URL to test (e.g. https://www.garudaos.in/demos/3r-car-care/index.html)
 * @param {string} businessName - The expected business name (e.g. "3R Car Care")
 * @returns {Promise<{ valid: boolean, status: number, title: string, reason?: string }>}
 */
async function verifyDemoUrlLive(url, businessName = "") {
  if (!url || !url.startsWith("http")) {
    return { valid: false, status: 0, title: "", reason: "Invalid or empty URL" };
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GARUDA-PreFlight/1.0"
      },
      cache: "no-store",
      redirect: "follow"
    });

    if (res.status !== 200) {
      return {
        valid: false,
        status: res.status,
        title: "",
        reason: `HTTP status was ${res.status}, expected 200 OK`
      };
    }

    const html = await res.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // 1. Check for Homepage Fallback Leak
    if (title.includes("GARUDA AI Operating System | Custom AI & Software Engineering")) {
      return {
        valid: false,
        status: 200,
        title,
        reason: "URL collapsed to root GARUDA homepage SPA router! Custom demo not rendered."
      };
    }

    // 2. Check for Prospect Name Matching
    if (businessName) {
      const cleanExpected = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanBody = html.substring(0, 3000).toLowerCase().replace(/[^a-z0-9]/g, "");

      const matchesTitle = cleanTitle.includes(cleanExpected) || cleanExpected.includes(cleanTitle);
      const matchesBody = cleanBody.includes(cleanExpected);

      if (!matchesTitle && !matchesBody) {
        return {
          valid: false,
          status: 200,
          title,
          reason: `Page content does not match expected business name "${businessName}". Found title: "${title}"`
        };
      }
    }

    // 3. Minimum Content Threshold
    if (html.length < 1000) {
      return {
        valid: false,
        status: 200,
        title,
        reason: `Page content is too small (${html.length} bytes), possible blank page.`
      };
    }

    return {
      valid: true,
      status: 200,
      title,
      contentLength: html.length
    };
  } catch (err) {
    return {
      valid: false,
      status: 0,
      title: "",
      reason: `Network fetch failed: ${err.message}`
    };
  }
}

/**
 * Batch verifies an array of lead objects containing { pitches: { demoUrl }, businessName }.
 */
async function verifyLeadsBatch(leads) {
  const results = [];
  for (const lead of leads) {
    const url = lead.pitches?.demoUrl || lead.demoUrl;
    const name = lead.businessName;
    const check = await verifyDemoUrlLive(url, name);
    results.push({
      businessName: name,
      url,
      ...check
    });
  }
  return results;
}

if (require.main === module) {
  const testUrl = process.argv[2] || "https://www.garudaos.in/demos/3r-car-care/index.html";
  const testName = process.argv[3] || "3R Car Care";

  console.log(`🦅 [GARUDA PRE-FLIGHT] Verifying: ${testUrl} for "${testName}"...`);
  verifyDemoUrlLive(testUrl, testName).then((res) => {
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.valid ? 0 : 1);
  });
}

module.exports = { verifyDemoUrlLive, verifyLeadsBatch };
