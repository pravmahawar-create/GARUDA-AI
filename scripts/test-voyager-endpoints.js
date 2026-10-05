const https = require("https");
const fs = require("fs");

const liAt = "AQEDAW1NST8CkpiwAAABoOiLevsAAAGhDJf--1YASUnkDapKj8ZYiC_WlHRhAcFV_SWRGKSsKaV2Mf_F667OnxJrtX_dqdaHpMmf1mi31Ae1iwQdNoNZxylxCegtqeX6TLNFRkhiJr_5kmLUr8-36htb";
const jsessionId = '"ajax:8912913176490188972"';
const csrfToken = "ajax:8912913176490188972";

function testEndpoint(endpoint, headers = {}) {
  return new Promise((resolve) => {
    const options = {
      hostname: "www.linkedin.com",
      path: endpoint,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Cookie": `li_at=${liAt}; JSESSIONID=${jsessionId};`,
        "csrf-token": csrfToken,
        "Accept": "application/vnd.linkedin.normalized+json+2.1",
        "x-restli-protocol-version": "2.0.0",
        ...headers
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ endpoint, status: res.statusCode, headers: res.headers, length: data.length, body: data }));
    });
    req.on("error", e => resolve({ endpoint, error: e.message }));
    req.end();
  });
}

async function main() {
  const endpoints = [
    "/voyager/api/identity/profiles/garuda-ai-ai-operating-system-227168432/profileView",
    "/voyager/api/relationships/dash/connections?decorationId=com.linkedin.voyager.dash.deco.relationships.MiniProfile-12",
    "/voyager/api/feed/updates?count=10",
    "/voyager/api/identity/badge",
    "/voyager/api/messaging/dash/conversations",
    "/voyager/api/notifications?count=10"
  ];

  for (const ep of endpoints) {
    const res = await testEndpoint(ep);
    console.log(`\nEndpoint: ${ep} => Status: ${res.status} (${res.length} bytes)`);
    if (res.status === 200) {
      console.log("Sample:", res.body.slice(0, 300));
      fs.writeFileSync(`output/billing/v4_1/api_${ep.replace(/[^a-zA-Z0-9]/g, "_")}.json`, res.body, "utf8");
    }
  }
}

main().catch(console.error);
