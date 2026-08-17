const https = require("https");

const API = "https://garuda-ai-xfif.onrender.com";

function get(path) {
  return new Promise((resolve, reject) => {
    https
      .get(API + path, { timeout: 40000 }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      })
      .on("error", reject)
      .on("timeout", () => reject(new Error("timeout")));
  });
}

function mask(v) {
  return String(v ?? "").replace(/(mongodb(\+srv)?:\/\/[^:@]+:)[^@]+@/, "$1***@");
}

(async () => {
  console.log("=== PHASE 4 LIVE VERIFICATION ===");

  const health = await get("/api/health");
  console.log("\n[1] /api/health -> " + health.status);
  const hb = JSON.parse(health.body);
  console.log("    database:", hb.database, "| status:", hb.status);

  const revenue = await get("/api/revenue");
  console.log("\n[2] /api/revenue -> " + revenue.status);
  let rev = [];
  try { rev = JSON.parse(revenue.body); } catch {}
  const recs = Array.isArray(rev) ? rev : (rev.data || rev.records || rev.items || []);
  console.log("    records:", Array.isArray(recs) ? recs.length : "(unexpected shape)");

  const metrics = await get("/api/revenue/metrics");
  console.log("\n[3] /api/revenue/metrics -> " + metrics.status);
  let m = {};
  try { m = JSON.parse(metrics.body); } catch {}
  const md = m.data || m;
  console.log("    totalRecords:", md.totalRecords, "| received:", md.received, "| pending:", md.pending);

  const opps = await get("/api/opportunities");
  console.log("\n[4] /api/opportunities -> " + opps.status);
  let ol = [];
  try { ol = JSON.parse(opps.body); } catch {}
  const oppArr = Array.isArray(ol) ? ol : (ol.data || ol.records || ol.items || []);
  console.log("    opportunities:", Array.isArray(oppArr) ? oppArr.length : "(unexpected shape)");
  const ab = (Array.isArray(oppArr) ? oppArr : []).find((o) => /Arabian Boutique Hotel/i.test(o.title || ""));
  console.log("    Arabian Boutique Hotel present:", !!ab);

  console.log("\n=== DONE ===");
})().catch((e) => console.error("ERR " + e.message));