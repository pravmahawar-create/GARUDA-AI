const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const { MongoClient } = require("mongodb");

const URI = process.env.TARGET_MONGO_URI;
const DB = process.env.TARGET_DB_NAME || "garuda_ai";

(async () => {
  const c = new MongoClient(URI, { serverSelectionTimeoutMS: 20000 });
  try {
    await c.connect();
    const db = c.db(DB);
    const opps = await db.collection("opportunities").find({}).toArray();
    const revs = await db.collection("revenuerecords").find({}).toArray();
    const revByOpp = {};
    for (const r of revs) revByOpp[String(r.opportunityId)] = r;

    console.log("TOTAL", opps.length);
    const out = [];
    for (const o of opps) {
      const r = revByOpp[String(o._id)];
      out.push({
        _id: String(o._id),
        title: o.title,
        client: o.client,
        source: o.source,
        stage: o.stage,
        potentialValue: o.potentialValue,
        probability: o.probability,
        expectedCloseDate: o.expectedCloseDate,
        notes: o.notes,
        tags: o.tags,
        currency: o.currency,
        createdAt: o.createdAt,
        revStatus: r ? r.status : "NONE",
        revAmount: r ? r.amount : null,
        revSource: r ? r.source : null,
      });
    }
    out.sort((a, b) => (a.probability || 0) - (b.probability || 0));
    for (const row of out) {
      console.log(JSON.stringify(row));
    }
  } finally {
    await c.close();
  }
})().catch((e) => {
  console.error("ERROR: " + e.message);
  process.exit(1);
});