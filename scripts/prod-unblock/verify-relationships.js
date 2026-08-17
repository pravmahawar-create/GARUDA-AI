const { MongoClient } = require("mongodb");

(async () => {
  const c = new MongoClient("mongodb://127.0.0.1:27017", { serverSelectionTimeoutMS: 6000 });
  try {
    await c.connect();
    const db = c.db("garuda_ai");

    const opps = await db.collection("opportunities").find({}).toArray();
    const revs = await db.collection("revenuerecords").find({}).toArray();
    console.log("opportunities:", opps.length, "revenuerecords:", revs.length);

    const oppIds = new Set(opps.map((o) => String(o._id)));
    const revIdSet = new Set(revs.map((r) => String(r._id)));
    console.log("unique opp _id:", oppIds.size, "unique rev _id:", revIdSet.size);

    const orphans = revs.filter((r) => !oppIds.has(String(r.opportunityId)));
    console.log("revenuerecords with opportunityId missing in opportunities:", orphans.length);

    const dupRevForOpp = revs.filter((r) => revs.filter((x) => String(x.opportunityId) === String(r.opportunityId)).length > 1);
    console.log("revenuerecords sharing an opportunityId (dupes):", new Set(dupRevForOpp.map((r) => String(r.opportunityId))).size);

    const oppsNoRev = opps.filter((o) => !revs.some((r) => String(r.opportunityId) === String(o._id)));
    console.log("opportunities with no linked revenuerecord:", oppsNoRev.length);
    if (oppsNoRev.length) console.log("  sample:", oppsNoRev.slice(0, 5).map((o) => o.title));

    const ab = opps.find((o) => /Arabian Boutique Hotel/i.test(o.title || ""));
    if (ab) {
      const abLink = revs.filter((r) => String(r.opportunityId) === String(ab._id));
      console.log("\nArabian Boutique Hotel opp _id:", String(ab._id));
      console.log("  linked revenuerecords:", abLink.length, "-> status:", abLink.map((r) => r.status).join(","), "amount:", abLink.map((r) => r.amount).join(","));
      console.log("  opp fields:", JSON.stringify(ab, null, 2));
      if (abLink.length) console.log("  rev fields:", JSON.stringify(abLink[0], null, 2));
    } else {
      console.log("\nArabian Boutique Hotel NOT FOUND in opportunities");
    }
  } finally {
    await c.close();
  }
})().catch((e) => {
  console.error("ERROR: " + e.message);
  process.exit(1);
});