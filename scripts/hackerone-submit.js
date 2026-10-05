#!/usr/bin/env node
/**
 * GARUDA HackerOne Report Submitter
 * Uses HackerOne API to submit reports programmatically
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const H1_USER = process.env.HACKERONE_API_USERNAME || "garudaos";
const H1_TOKEN = process.env.HACKERONE_API_TOKEN || "NQPVMHLuxum1CFrNX5XppcJ66pW1xwVMUL0J9MudQ0I=";

function apiRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${H1_USER}:${H1_TOKEN}`).toString("base64");
    const options = {
      hostname: "api.hackerone.com",
      path: endpoint,
      method,
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
        "User-Agent": "GARUDA-Bounty-Hunter/1.0"
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function submitReport() {
  console.log("Submitting report to HackerOne...");

  // Step 1: Check program scope
  console.log("Checking Yelp program scope...");
  const programCheck = await apiRequest("GET", "/v1/hackers/programs/yelp");
  if (programCheck.status === 200) {
    console.log("Program found:", programCheck.data?.data?.attributes?.name || "yelp");
  } else {
    console.log("Program check response:", programCheck.status, JSON.stringify(programCheck.data).slice(0, 500));
  }

  // Step 2: Try report intent creation (HackerOne API for hackers is read-only for reports)
  // Check if we can create a report intent (draft)
  const vulnInfo = `## Summary

Yelp's main domain (yelp.com) reflects arbitrary Origin headers in the Access-Control-Allow-Origin response header while simultaneously setting Access-Control-Allow-Credentials: true. This allows any malicious website to make credentialed cross-origin requests to Yelp and read the full response, enabling theft of authenticated user data.

Two distinct CORS misconfigurations were identified:
1. Arbitrary Origin Reflection - Any origin (e.g. https://attacker-origin.com) is reflected back with credentials allowed.
2. Subdomain Trust Bypass - Any origin ending in .attacker.com (e.g. https://yelp.com.attacker.com) is reflected back with credentials allowed.

## Vulnerability Type

CORS Misconfiguration (CWE-942)

## Severity

High (CVSS 7.5)

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
- OWASP CORS: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing`;

  // Try different API endpoints
  console.log("\nTrying report intent creation...");
  const intentBody = {
    data: {
      type: "report-intent",
      attributes: {
        team_handle: "yelp",
        title: "Dangerous CORS Misconfiguration on yelp.com - Arbitrary Origin Reflection with Credentials",
        vulnerability_information: vulnInfo,
        impact: "High - Complete theft of authenticated user data including personal information, reviews, messages, and session tokens. Any malicious website can exfiltrate data from logged-in Yelp users."
      }
    }
  };

  const reportBody = intentBody;

  console.log("\nSending report...");
  // Try multiple endpoints
  let result = await apiRequest("POST", "/v1/hackers/report-intents", reportBody);
  console.log("Report-intents response:", result.status);
  
  if (result.status >= 400) {
    console.log("Trying /v1/hackers/reports...");
    result = await apiRequest("POST", "/v1/hackers/reports", {
      data: {
        type: "report",
        attributes: {
          team_handle: "yelp",
          title: "Dangerous CORS Misconfiguration on yelp.com",
          vulnerability_information: vulnInfo,
          impact: "High - Complete theft of authenticated user data"
        }
      }
    });
  }
  console.log("Response Status:", result.status);
  console.log("Response:", JSON.stringify(result.data, null, 2).slice(0, 2000));

  if (result.status === 201 || result.status === 200) {
    console.log("\nREPORT SUBMITTED SUCCESSFULLY!");
    const reportId = result.data?.data?.id;
    if (reportId) console.log("Report ID:", reportId);
  } else {
    console.log("\nSUBMISSION FAILED - Status:", result.status);
  }

  return result;
}

submitReport().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
