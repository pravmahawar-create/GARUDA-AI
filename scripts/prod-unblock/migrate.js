const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const { MongoClient } = require("mongodb");

const SRC_URI = "mongodb://127.0.0.1:27017";
const SRC_DB = "garuda_ai";
const TGT_URI = process.env.TARGET_MONGO_URI;
const TGT_DB = process.env.TARGET_DB_NAME || "garuda_ai";
const COLLECTIONS = ["opportunities", "revenuerecords"];

if (!TGT_URI) {
  console.error("Missing required env TARGET_MONGO_URI (full mongodb+srv URI). It will NOT be printed.");
  process.exit(2);
}
const mask = (u) => u.replace(/(:\/\/[^@]+@)/, "://***:***@");

(async () => {
  const src = new MongoClient(SRC_URI, { serverSelectionTimeoutMS: 6000 });
  const tgt = new MongoClient(TGT_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await src.connect();
    await tgt.connect();
    const sdb = src.db(SRC_DB);
    const tdb = tgt.db(TGT_DB);

    console.log("=== SOURCE (local) ===");
    for (const name of COLLECTIONS) {
      console.log(`${name}: ${await sdb.collection(name).countDocuments()}`);
    }

    console.log("\n=== TARGET (cloud) BEFORE ===");
    for (const name of COLLECTIONS) {
      console.log(`${name}: ${await tdb.collection(name).countDocuments()}`);
    }

    for (const name of COLLECTIONS) {
      const docs = await sdb.collection(name).find({}).toArray();
      const existingIds = new Set(
        (await tdb.collection(name).find({}, { projection: { _id: 1 } }).toArray()).map((d) => String(d._id))
      );
      const toInsert = docs.filter((d) => !existingIds.has(String(d._id)));
      console.log(`\n${name}: total=${docs.length} alreadyPresent=${docs.length - toInsert.length} toInsert=${toInsert.length}`);
      if (toInsert.length) {
        await tdb.collection(name).insertMany(toInsert, { ordered: false });
        console.log(`  inserted ${toInsert.length}`);
      }
    }

    console.log("\n=== TARGET (cloud) AFTER ===");
    for (const name of COLLECTIONS) {
      console.log(`${name}: ${await tdb.collection(name).countDocuments()}`);
    }
    console.log("\nMIGRATION DONE (opportunities + revenuerecords only; _id preserved; no dupes inserted)");
  } finally {
    await src.close();
    await tgt.close();
  }
})().catch((e) => {
  console.error("ERROR: " + e.message);
  process.exit(1);
});