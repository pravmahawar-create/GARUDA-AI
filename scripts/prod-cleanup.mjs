// Production operations: sweep junk + import insurance contacts + create deal.
// Usage: node scripts/prod-cleanup.mjs
const API = process.env.GARUDA_API_URL || "https://garuda-ai-xfif.onrender.com";

async function call(path, { method = "GET", body, founder = true } = {}) {
  const headers = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (founder) headers["x-garuda-founder-approved"] = "true";
  const res = await fetch(`${API}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, json };
}

function summarizeCandidates(data) {
  if (!Array.isArray(data)) return [];
  const by = {};
  for (const c of data) {
    const key = `${c.status || "?"}|${c.opportunityChannel || "?"}|${c.priority || "?"}`;
    by[key] = (by[key] || 0) + 1;
  }
  return by;
}

async function main() {
  const mode = process.argv[2] || "all";

  if (mode === "sweep" || mode === "all") {
    console.log("== SWEEP ineligible candidates + archive junk opportunities ==");
    const r = await call("/api/discovery/sweep-ineligible", { method: "POST" });
    console.log("HTTP", r.status, JSON.stringify(r.json).slice(0, 1200));
  }

  if (mode === "import" || mode === "all") {
    console.log("\n== IMPORT insurance contacts ==");
    const fs = await import("fs");
    const contactsPath = process.argv[3];
    if (!contactsPath) {
      console.log("SKIP: no contacts JSON path given (arg 3)");
    } else {
      const contacts = JSON.parse(fs.readFileSync(contactsPath, "utf8"));
      const r = await call("/api/insurance-leads/import-contacts", { method: "POST", body: { contacts } });
      const d = (r.json && r.json.data) || {};
      console.log("HTTP", r.status, "inserted:", d.inserted, "skipped:", d.skipped);
      if (d.skippedReasons) {
        const reasons = {};
        for (const s of d.skippedReasons) reasons[s.reason] = (reasons[s.reason] || 0) + 1;
        console.log("skip reasons:", JSON.stringify(reasons));
      }
      if (r.status >= 400) console.log("body:", JSON.stringify(r.json).slice(0, 500));
    }
  }

  if (mode === "verify" || mode === "all") {
    console.log("\n== VERIFY post-sweep state ==");
    const cand = await call("/api/discovery/candidates?limit=100");
    console.log("ranked candidates breakdown:", JSON.stringify(summarizeCandidates(cand.json.data)));
    const opps = await call("/api/opportunities?limit=200");
    const all = Array.isArray(opps.json.data) ? opps.json.data : [];
    const active = all.filter((o) => !(o.outreach && o.outreach.archived));
    console.log("opportunities total:", all.length, "| active:", active.length);
    console.log("active by priority:", JSON.stringify(active.reduce((m, o) => { m[o.priority || "?"] = (m[o.priority || "?"] || 0) + 1; return m; }, {})));
    const leads = await call("/api/insurance-leads?limit=200");
    const leadsArr = Array.isArray(leads.json.data) ? leads.json.data : [];
    console.log("insurance leads total:", leadsArr.length, "| by status:", JSON.stringify(leadsArr.reduce((m, l) => { m[l.status] = (m[l.status] || 0) + 1; return m; }, {})));
  }
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
