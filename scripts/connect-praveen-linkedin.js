/**
 * 🦅 GARUDA Autonomous LinkedIn Connector: Founder Personal / Company OAuth
 * 
 * Usage:
 *   1. View Auth URL:
 *      node scripts/connect-praveen-linkedin.js
 * 
 *   2. Exchange code after approving in browser:
 *      node scripts/connect-praveen-linkedin.js "url_or_code"
 */

require("dotenv").config();
const linkedinService = require("../src/services/linkedinDirectPushService");

const REDIRECT_URI = "https://www.garudaos.in/api/bot-verse/linkedin/callback";

async function runConnector() {
  const arg = process.argv[2];

  console.log("===============================================================");
  console.log("🦅 GARUDA LINKEDIN OAUTH CONNECTOR: FOUNDER & ENTERPRISE ENGINE");
  console.log("Client ID: " + (process.env.LINKEDIN_CLIENT_ID || "77aljtjd1vrvm9"));
  console.log("Redirect URI: " + REDIRECT_URI);
  console.log("===============================================================\n");

  if (!arg) {
    const auth = linkedinService.getAuthUrl(REDIRECT_URI, "praveen");
    console.log("1. Open this 1-click LinkedIn Authorization URL in your browser:\n");
    console.log(auth.authUrl + "\n");
    console.log("2. Log in with your LinkedIn account and click 'Allow' / 'Accept'.");
    console.log("3. LinkedIn will redirect your browser to: " + REDIRECT_URI + "?code=...\n");
    console.log("4. Copy either the FULL URL or just the code from the browser address bar, and run:\n");
    console.log('   node scripts/connect-praveen-linkedin.js "<copied_url_or_code>"\n');
    return;
  }

  let code = arg.trim();
  if (code.includes("code=")) {
    try {
      const urlObj = new URL(code.startsWith("http") ? code : "https://dummy.com/?" + code);
      code = urlObj.searchParams.get("code") || code;
    } catch {
      const match = code.match(/code=([^&]+)/);
      if (match) code = decodeURIComponent(match[1]);
    }
  }

  console.log("Exchanging authorization code with LinkedIn OAuth endpoint...");

  try {
    const res = await linkedinService.handleCallback(code, REDIRECT_URI, "praveen");
    if (!res.success) {
      console.error("\n❌ Authorization exchange failed:", res.error);
      if (res.details) console.error("Details:", JSON.stringify(res.details, null, 2));
      return;
    }

    console.log("\n✅ SUCCESS:", res.message);
    console.log("Connected Member Name: " + res.memberName);
    console.log("Connected Member URN:  " + res.memberUrn);
    console.log("Connected Member Email:" + res.memberEmail);
    console.log("\n🚀 LinkedIn OAuth 2.0 is now active and ready for autonomous dispatch!");
  } catch (error) {
    console.error("\n❌ Fatal error during authorization exchange:", error.message);
  }
}

runConnector().catch(console.error);
