const https = require("https");
require("dotenv").config();

const csrfToken = "ajax:8472910482910471928";
const liAt = process.env.LINKEDIN_LI_AT;

function queryVoyager(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.linkedin.com",
      path: endpoint,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Cookie": `li_at=${liAt}; JSESSIONID="${csrfToken}";`,
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
  console.log("Querying /voyager/api/me...");
  const me = await queryVoyager("/voyager/api/me");
  console.log("Status:", me.statusCode);
  if (me.statusCode === 200) {
    console.log("✔ SUCCESS! Authenticated via Voyager API!");
    const data = JSON.parse(me.body);
    console.log("Data:", JSON.stringify(data, null, 2).slice(0, 1000));

    console.log("\nQuerying Conversations / DMs (/voyager/api/messaging/conversations)...");
    const convos = await queryVoyager("/voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX");
    console.log("Convos Status:", convos.statusCode);
    if (convos.statusCode === 200) {
      console.log("Convos Data:", convos.body.slice(0, 2000));
    }

    console.log("\nQuerying Network / Invitations...");
    const inv = await queryVoyager("/voyager/api/relationships/invitations?start=0&count=10");
    console.log("Invitations Status:", inv.statusCode);
    if (inv.statusCode === 200) {
      console.log("Invitations Data:", inv.body.slice(0, 2000));
    }
  } else {
    console.log("Response headers:", me.headers);
    console.log("Response body:", me.body.slice(0, 500));
  }
}

run().catch(console.error);
