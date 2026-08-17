const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const { MongoClient } = require("mongodb");

const URI = process.env.TARGET_MONGO_URI;
const DB = process.env.TARGET_DB_NAME || "garuda_ai";
if (!URI) {
  console.error("Missing TARGET_MONGO_URI");
  process.exit(2);
}

(async () => {
  const c = new MongoClient(URI, { serverSelectionTimeoutMS: 20000 });
  try {
    await c.connect();
    const db = c.db(DB);

    const opps = await db.collection("opportunities").find({}).toArray();
    const revs = await db.collection("revenuerecords").find({}).toArray();
    console.log("=== POST-MIGRATION VERIFICATION (Atlas " + DB + ") ===");
    console.log("opportunities:", opps.length);
    console.log("revenuerecords:", revs.length);

    const oppIds = new Set(opps.map((o) => String(o._id)));
    console.log("unique opp _id:", oppIds.size);

    const orphans = revs.filter((r) => !oppIds.has(String(r.opportunityId)));
    console.log("revenuerecords with missing opportunityId (orphans):", orphans.length);

    const dupOppIds = opps.filter((o) => opps.filter((x) => String(x._id) === String(o._id)).length > 1).length;
    console.log("duplicate opp _id:", dupOppIds);

    const revIds = new Set(revs.map((r) => String(r._id)));
    console.log("unique rev _id:", revIds.size, "(dupes:", revs.length - revIds.size + ")");

    const sharedOpp = {};
    for (const r of revs) sharedOpp[String(r.opportunityId)] = (sharedOpp[String(r.opportunityId)] || 0) + 1;
    const multi = Object.values(sharedOpp).filter((n) => n > 1).length;
    console.log("opportunityIds with >1 revenuerecord:", multi);

    const oppsNoRev = opps.filter((o) => !revs.some((r) => String(r.opportunityId) === String(o._id)));
    console.log("opportunities with no revenuerecord:", oppsNoRev.length);

    const dist = {};
    for (const r of revs) dist[r.status] = (dist[r.status] || 0) + 1;
    console.log("status distribution:", JSON.stringify(dist));

    const received = revs.filter((r) => ["received", "paid"].includes(r.status));
    console.log("received/paid count:", received.length);

    const pending = revs.filter((r) => !["received", "paid"].includes(r.status));
    const pendingTotal = pending.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    console.log("pending total (INR):", pendingTotal);

    const ab = opps.find((o) => /Arabian Boutique Hotel/i.test(o.title || ""));
    if (ab) {
      const links = revs.filter((r) => String(r.opportunityId) === String(ab._id));
      console.log("\nArabian Boutique Hotel: _id=" + String(ab._id) + " linked=" + links.length + " status=" + links.map((r) => r.status).join(",") + " amount=" + links.map((r) => r.amount).join(","));
    } else {
      console.log("\nArabian Boutique Hotel: NOT FOUND");
    }

    console.log("\n=== FIELD PRESERVATION CHECK ===");
    const o0 = opps[0];
    const r0 = revs[0];
    console.log("opportunity fields:", JSON.stringify(Object.keys(o0).sort()));
    console.log("revenueRecord fields:", JSON.stringify(Object.keys(r0).sort()));
    const srcAttrib = opps.filter((o) => o.source).length;
    const withNotes = opps.filter((o) => o.notes).length;
    console.log("opportunities with source attribution:", srcAttrib);
    console.log("opportunities with notes/descriptions:", withNotes);
    const revWithSrc = revs.filter((r) => r.source).length;
    const revWithEvidence = revs.filter((r) => r.verificationEvidence !== undefined).length;
    console.log("revenuerecords with source:", revWithSrc, "| verificationEvidence field present:", revWithEvidence);
  } finally {
    await c.close();
  }
})().catch((e) => {
  console.error("ERROR: " + e.message);
  process.exit(1);
});