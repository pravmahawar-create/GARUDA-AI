const { MongoClient } = require("mongodb");

const SRC_URI = process.env.SRC_URI || "mongodb://127.0.0.1:27017";

(async () => {
  const c = new MongoClient(SRC_URI, { serverSelectionTimeoutMS: 6000 });
  try {
    await c.connect();
    const db = c.db("garuda_ai");
    const cols = await db.listCollections().toArray();
    const summary = {};
    for (const col of cols) {
      const n = await db.collection(col.name).countDocuments();
      summary[col.name] = n;
    }
    console.log("=== LOCAL garuda_ai COLLECTION COUNTS ===");
    console.log(JSON.stringify(summary, null, 2));

    console.log("\n=== OPPORTUNITY sample field names (first doc) ===");
    const opp = await db.collection("opportunities").findOne({});
    if (opp) console.log(JSON.stringify(Object.keys(opp).sort(), null, 0));
    else console.log("(no opportunities)");

    console.log("\n=== REVENUE RECORD sample field names (first doc) ===");
    const rev = await db.collection("revenuerecords").findOne({});
    if (rev) console.log(JSON.stringify(Object.keys(rev).sort(), null, 0));
    else console.log("(no revenuerecords)");
  } finally {
    await c.close();
  }
})().catch((e) => {
  console.error("ERROR: " + e.message);
  process.exit(1);
});