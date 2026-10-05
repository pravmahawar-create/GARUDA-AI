#!/usr/bin/env node
/**
 * GARUDA HackerOne Puppeteer Submitter
 * Automates HackerOne web form submission
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const H1_EMAIL = process.env.HACKERONE_EMAIL || "garudaos.ai@gmail.com";
const H1_PASSWORD = process.env.HACKERONE_PASSWORD; // Must be set in env or pass via CLI

// Report content
const REPORT = {
  team: "yelp",
  title: "Dangerous CORS Misconfiguration on yelp.com - Arbitrary Origin Reflection with Credentials",
  weakness: "Cross-Origin Resource Sharing (CORS) Misconfiguration",
  severity: "High",
  asset: "https://yelp.com",
  description: `## Summary

Yelp's main domain (yelp.com) reflects arbitrary Origin headers in the Access-Control-Allow-Origin response header while simultaneously setting Access-Control-Allow-Credentials: true. This allows any malicious website to make credentialed cross-origin requests to Yelp and read the full response, enabling theft of authenticated user data.

Two distinct CORS misconfigurations were identified:
1. Arbitrary Origin Reflection - Any origin (e.g. https://attacker-origin.com) is reflected back with credentials allowed.
2. Subdomain Trust Bypass - Any origin ending in .attacker.com (e.g. https://yelp.com.attacker.com) is reflected back with credentials allowed.

## Steps to Reproduce

### Vuln 1: Arbitrary Origin Reflection

curl -i -s -H "Origin: https://attacker-origin.com" -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15" "https://yelp.com"

Response headers contain:
- Access-Control-Allow-Origin: https://attacker-origin.com
- Access-Control-Allow-Credentials: true

### Vuln 2: Subdomain Trust Bypass

curl -i -s -H "Origin: https://yelp.com.attacker.com" -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15" "https://yelp.com"

Response headers contain:
- Access-Control-Allow-Origin: https://yelp.com.attacker.com
- Access-Control-Allow-Credentials: true

## Impact

An attacker can steal sensitive user data including personal information, reviews, messages, and session tokens from any logged-in Yelp user by hosting a malicious page that makes credentialed cross-origin requests to yelp.com.

## Remediation

Implement a strict server-side origin allowlist. Never reflect arbitrary Origin headers. Validate origins against a whitelist of legitimate Yelp domains only.

## References

- CWE-942: https://cwe.mitre.org/data/definitions/942.html
- OWASP CORS: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing`,
  impact: "High - Complete theft of authenticated user data including personal information, reviews, messages, and session tokens. Any malicious website can exfiltrate data from logged-in Yelp users."
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function submitToHackerOne() {
  if (!H1_PASSWORD) {
    console.log("ERROR: HACKERONE_PASSWORD not set!");
    console.log("Set it: $env:HACKERONE_PASSWORD='your_password'");
    console.log("Or pass: HACKERONE_PASSWORD=xxx node scripts/hackerone-puppeteer-submit.js");
    process.exit(1);
  }

  console.log("Starting browser...");
  const browser = await puppeteer.launch({
    headless: false, // Show browser so user can handle CAPTCHA if needed
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    // Step 1: Login to HackerOne
    console.log("Step 1: Logging in to HackerOne...");
    await page.goto("https://hackerone.com/users/sign_in", { waitUntil: "networkidle2" });
    await sleep(3000);
    
    // Take screenshot to see login page
    await page.screenshot({ path: "reports/bounties/hackerone-login-page.png" });
    console.log("  Login page screenshot saved");

    // Check if already logged in (redirected away from auth)
    const currentUrl = page.url();
    console.log("  Current URL:", currentUrl);
    
    if (currentUrl.includes("auth.hackerone.com") || currentUrl.includes("login")) {
      // Need to login
      console.log("  Looking for email field...");
      
      // Try multiple selectors for email
      const emailSelectors = [
        'input[name="email"]',
        'input[type="email"]',
        'input[name="username"]',
        'input[placeholder*="email"]',
        'input[id*="email"]',
        '#email',
        'input[autocomplete="username"]'
      ];
      
      let emailFilled = false;
      for (const sel of emailSelectors) {
        try {
          const el = await page.$(sel);
          if (el) {
            await el.click();
            await el.type(H1_EMAIL, { delay: 30 });
            console.log("  Email filled via:", sel);
            emailFilled = true;
            break;
          }
        } catch {}
      }
      
      if (!emailFilled) {
        console.log("  Could not find email field. Taking screenshot...");
        await page.screenshot({ path: "reports/bounties/hackerone-no-email-field.png" });
        // Dump page HTML for debugging
        const html = await page.content();
        require("fs").writeFileSync("reports/bounties/hackerone-page.html", html);
        console.log("  HTML saved for debugging");
      }
      
      await sleep(1000);
      
      // Try clicking Next/Continue button
      const nextBtns = await page.$$('button[type="submit"], button:has-text("Next"), button:has-text("Continue"), button:has-text("Log in")');
      for (const btn of nextBtns) {
        const text = await btn.evaluate(el => el.textContent.trim());
        if (text.match(/next|continue|log\s*in|submit/i)) {
          console.log("  Clicking:", text);
          await btn.click();
          break;
        }
      }
      
      await sleep(3000);
      await page.screenshot({ path: "reports/bounties/hackerone-after-email.png" });
      
      // Now enter password
      console.log("  Looking for password field...");
      const passSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        'input[placeholder*="password"]',
        '#password'
      ];
      
      let passFilled = false;
      for (const sel of passSelectors) {
        try {
          const el = await page.$(sel);
          if (el) {
            await el.click();
            await el.type(H1_PASSWORD, { delay: 30 });
            console.log("  Password filled via:", sel);
            passFilled = true;
            break;
          }
        } catch {}
      }
      
      if (!passFilled) {
        console.log("  Could not find password field. May need manual input.");
        await page.screenshot({ path: "reports/bounties/hackerone-no-pass-field.png" });
        console.log("  Please complete login manually, then press Enter...");
        await new Promise(resolve => { process.stdin.once("data", resolve); });
      } else {
        // Click login button
        await sleep(500);
        const loginBtns = await page.$$('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")');
        for (const btn of loginBtns) {
          const text = await btn.evaluate(el => el.textContent.trim());
          if (text.match(/log\s*in|sign\s*in|submit/i)) {
            console.log("  Clicking:", text);
            await btn.click();
            break;
          }
        }
        await sleep(5000);
      }
      
      // Check if 2FA or CAPTCHA needed
      const postUrl = page.url();
      console.log("  Post-login URL:", postUrl);
      if (postUrl.includes("auth.hackerone.com") || postUrl.includes("challenge") || postUrl.includes("mfa")) {
        console.log("  2FA/CAPTCHA detected. Please complete manually...");
        await page.screenshot({ path: "reports/bounties/hackerone-2fa.png" });
        await new Promise(resolve => { process.stdin.once("data", resolve); });
      }
      
      console.log("  Login flow complete!");
    } else {
      console.log("  Already logged in!");
    }

    // Step 2: Navigate to Yelp program submit page
    console.log("Step 2: Navigating to Yelp report submission...");
    await page.goto("https://hackerone.com/yelp", { waitUntil: "networkidle2" });
    await sleep(3000);

    // Look for submit report button
    console.log("  Looking for submit report button...");
    const submitBtn = await page.$('a[href*="embedded_submissions"]');
    if (submitBtn) {
      await submitBtn.click();
      await sleep(3000);
    } else {
      // Try the standard report submission URL
      console.log("  Trying standard submission URL...");
      await page.goto("https://hackerone.com/yelp/reports/new", { waitUntil: "networkidle2" });
      await sleep(5000);
      
      // If that fails, try embedded submissions with program ID
      const url = page.url();
      if (url.includes("404") || url.includes("error")) {
        console.log("  Trying embedded submissions...");
        await page.goto("https://hackerone.com/yelp/embedded_submissions/new", { waitUntil: "networkidle2" });
        await sleep(5000);
      }
    }

    // Step 3: Fill in the form
    console.log("Step 3: Filling report form...");
    
    // Take screenshot to see current state
    await page.screenshot({ path: "reports/bounties/hackerone-form-state.png" });
    console.log("  Form state screenshot saved");

    // Try to find and fill vulnerability type/weakness
    try {
      const weaknessSelect = await page.$('select[name*="weakness"], select[name*="vulnerability_type"], [data-testid*="weakness"]');
      if (weaknessSelect) {
        await weaknessSelect.click();
        await sleep(500);
        // Select CORS option
        const options = await page.$$('select option, [role="option"]');
        for (const opt of options) {
          const text = await opt.evaluate(el => el.textContent);
          if (text.toLowerCase().includes("cors") || text.toLowerCase().includes("cross-origin")) {
            await opt.click();
            break;
          }
        }
      }
    } catch (e) { console.log("  Weakness select:", e.message); }

    // Fill title
    try {
      const titleInput = await page.$('input[name="title"], input[placeholder*="title"], textarea[name="title"]');
      if (titleInput) {
        await titleInput.click({ clickCount: 3 });
        await titleInput.type(REPORT.title, { delay: 10 });
      }
    } catch (e) { console.log("  Title fill:", e.message); }

    // Fill description/vulnerability information
    try {
      const descInput = await page.$('textarea[name*="vulnerability"], textarea[name*="description"], textarea[name*="information"], .CodeMirror');
      if (descInput) {
        await descInput.click();
        await descInput.type(REPORT.description, { delay: 5 });
      }
    } catch (e) { console.log("  Description fill:", e.message); }

    // Fill impact
    try {
      const impactInput = await page.$('textarea[name*="impact"], textarea[placeholder*="impact"]');
      if (impactInput) {
        await impactInput.click();
        await impactInput.type(REPORT.impact, { delay: 5 });
      }
    } catch (e) { console.log("  Impact fill:", e.message); }

    // Step 4: Take final screenshot and wait for manual review
    console.log("Step 4: Form filled. Taking screenshot...");
    await page.screenshot({ path: "reports/bounties/hackerone-form-filled.png", fullPage: true });
    console.log("  Filled form screenshot saved: reports/bounties/hackerone-form-filled.png");
    
    console.log("\n========================================");
    console.log("FORM FILLED — Please review in browser!");
    console.log("Click SUBMIT manually when ready.");
    console.log("========================================");
    
    // Keep browser open for 5 minutes
    console.log("Browser will stay open for 5 minutes...");
    await sleep(300000);

  } catch (error) {
    console.error("Error:", error.message);
    await page.screenshot({ path: "reports/bounties/hackerone-error.png" });
    console.log("Error screenshot saved");
  } finally {
    await browser.close();
  }
}

submitToHackerOne().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
