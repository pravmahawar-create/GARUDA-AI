const { MongoClient } = require("mongodb");

(async () => {
  const c = new MongoClient("mongodb://127.0.0.1:27017", { serverSelectionTimeoutMS: 6000 });
  try {
    await c.connect();
    const db = c.db("garuda_ai");

    console.log("=== FULL opportunity (Arabian Boutique Hotel) ===");
    const ab = await db.collection("opportunities").findOne({ title: /Arabian Boutique Hotel/i });
    if (ab) console.log(JSON.stringify(ab, null, 2));
    else console.log("(not found by title regex)");

    console.log("\n=== FULL revenue record linked to AB hotel (by client/title) ===");
    const abName = ab && (ab.client ? (typeof ab.client === "string" ? ab.client : JSON.stringify(ab.client)) : "");
    const abRev = await db.collection("revenuerecords").findOne({ client: abName });
    if (abRev) console.log(JSON.stringify(abRev, null, 2));
    else console.log("(no revenuerecord matched by client name exactly)");

    console.log("\n=== ALL 88 revenue record status distribution ===");
    const dist = await db.collection("revenuerecords").aggregate([
      { $group: { _id: "$status", n: { $sum: 1 } } }
    ]).toArray();
    console.log(JSON.stringify(dist));

    console.log("\n=== received revenue total (status received or paid) ===");
    const received = await db.collection("revenuerecords").aggregate([
      { $match: { status: { $in: ["received", "paid"] } } },
      { $group: { _id: null, n: { $sum: 1 }, total: { $sum: "$amount" } } }
    ]).toArray();
    console.log(JSON.stringify(received));

    console.log("\n=== total potential / pending amounts ===");
    const sums = await db.collection("revenuerecords").aggregate([
      { $group: { _id: null, pending: { $sum: { $cond: [{ $in: ["$status", ["received", "paid"]] }, 0, "$amount"] } }, total: { $sum: "$amount" }, n: { $sum: 1 } } }
    ]).toArray();
    console.log(JSON.stringify(sums));

    console.log("\n=== sample of a few revenue records (first 3) ===");
    const few = await db.collection("revenuerecords").find({}).limit(3).toArray();
    console.log(JSON.stringify(few, null, 2));
  } finally {
    await c.close();
  }
})().catch((e) => {
  console.error("ERROR: " + e.message);
  process.exit(1);
});