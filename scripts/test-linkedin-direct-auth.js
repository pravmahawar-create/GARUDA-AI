const https = require("https");
const fs = require("fs");
const path = require("path");

const liAt = "AQEDAW1NST8CkpiwAAABoOiLevsAAAGhDJf--1YASUnkDapKj8ZYiC_WlHRhAcFV_SWRGKSsKaV2Mf_F667OnxJrtX_dqdaHpMmf1mi31Ae1iwQdNoNZxylxCegtqeX6TLNFRkhiJr_5kmLUr8-36htb";
const jsessionId = '"ajax:8912913176490188972"';
const csrfToken = "ajax:8912913176490188972";

// Also update .env with fresh LI_AT
try {
  let envContent = fs.readFileSync(".env", "utf8");
  if (envContent.includes("LINKEDIN_LI_AT=")) {
    envContent = envContent.replace(/LINKEDIN_LI_AT=.*/g, `LINKEDIN_LI_AT=${liAt}`);
  } else {
    envContent += `\nLINKEDIN_LI_AT=${liAt}`;
  }
  if (envContent.includes("LINKEDIN_JSESSIONID=")) {
    envContent = envContent.replace(/LINKEDIN_JSESSIONID=.*/g, `LINKEDIN_JSESSIONID=${csrfToken}`);
  } else {
    envContent += `\nLINKEDIN_JSESSIONID=${csrfToken}`;
  }
  fs.writeFileSync(".env", envContent, "utf8");
  console.log("✔ Saved LINKEDIN_LI_AT and LINKEDIN_JSESSIONID to .env");
} catch (e) {
  console.warn("Could not update .env:", e.message);
}

function queryVoyager(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.linkedin.com",
      path: endpoint,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Cookie": `li_at=${liAt}; JSESSIONID=${jsessionId};`,
        "csrf-token": csrfToken,
        "Accept": "application/vnd.linkedin.normalized+json+2.1",
        "x-restli-protocol-version": "2.0.0"
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  console.log("Testing /voyager/api/me with fresh tokens...");
  const me = await queryVoyager("/voyager/api/me");
  console.log("Status:", me.statusCode);

  if (me.statusCode === 200) {
    console.log("🎉 SUCCESS! Logged in to LinkedIn Voyager API!");
    const meData = JSON.parse(me.body);
    fs.writeFileSync("output/billing/v4_1/linkedin_me.json", JSON.stringify(meData, null, 2), "utf8");

    console.log("\n▶ Fetching Conversations / DMs (/voyager/api/messaging/conversations)...");
    const convos = await queryVoyager("/voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX");
    console.log("Convos Status:", convos.statusCode);
    if (convos.statusCode === 200) {
      fs.writeFileSync("output/billing/v4_1/linkedin_convos.json", convos.body, "utf8");
      console.log("✔ Saved convos to output/billing/v4_1/linkedin_convos.json");
    }

    console.log("\n▶ Fetching Invitations / Connection Requests...");
    const inv = await queryVoyager("/voyager/api/relationships/invitations?start=0&count=20");
    console.log("Invitations Status:", inv.statusCode);
    if (inv.statusCode === 200) {
      fs.writeFileSync("output/billing/v4_1/linkedin_invitations.json", inv.body, "utf8");
      console.log("✔ Saved invitations to output/billing/v4_1/linkedin_invitations.json");
    }

    console.log("\n▶ Fetching Notifications / Activity...");
    const notifs = await queryVoyager("/voyager/api/identity/badge");
    console.log("Badge / Notifications Status:", notifs.statusCode);
    if (notifs.statusCode === 200) {
      fs.writeFileSync("output/billing/v4_1/linkedin_badges.json", notifs.body, "utf8");
      console.log("✔ Saved badges to output/billing/v4_1/linkedin_badges.json");
    }
  } else {
    console.log("Headers:", me.headers);
    console.log("Body snippet:", me.body.slice(0, 500));
  }
}

run().catch(console.error);
