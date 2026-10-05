const https = require("https");

const testQueries = [
  "Surat West",
  "Jaipur Rural",
  "Gorakhpur Urban",
  "Nagpur South",
  "Chandigarh",
  "Hyderabad Jubilee Hills",
  "Pune Shivajinagar",
  "Meerut Cantt",
  "400001",
  "452001"
];

async function testAll() {
  console.log("=== TESTING ANY INDIAN CITY / SEAT / PIN RESOLUTION ===");
  for (const q of testQueries) {
    await new Promise((resolve) => {
      https.get("https://www.garudaos.in/api/war-room/resolve?q=" + encodeURIComponent(q), (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            const j = JSON.parse(d);
            const c = j.data && j.data.constituency;
            console.log(
              `[${q.padEnd(24)}] -> HTTP ${res.statusCode} | Mode: ${j.data?.resolutionType} | Name: ${c?.name} | State: ${c?.state} | Booths: ${c?.pollingStructure?.totalBooths} | Electors: ${c?.electoralBase?.registeredElectors?.toLocaleString("en-IN")}`
            );
          } catch (e) {
            console.error(`Error parsing for ${q}:`, e.message);
          }
          resolve();
        });
      }).on("error", (err) => {
        console.error(`Req error for ${q}:`, err.message);
        resolve();
      });
    });
  }
}

testAll();
