// GARUDA ABSLI Knowledge Seed Script
//
// Seeds MongoDB Knowledge (category ABSLI) from verified ABSLI knowledge assets
// so the Telegram insurance Q&A worker and public chat answer from the canonical
// governed knowledge source. Idempotent.
//
// Usage:
//   node scripts/garuda-seed-absl-knowledge.js            # real seed (needs Mongo)
//   node scripts/garuda-seed-absl-knowledge.js --dry-run  # preview only
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("../src/database/db");
const abslKnowledgeSeedService = require("../src/services/abslKnowledgeSeedService");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  await connectDB();
  const result = await abslKnowledgeSeedService.seedAbslKnowledge({ dryRun });
  console.log("ABSLI Knowledge seed result:");
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.seeded === "dry_run" || Number(result.seeded) >= 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Seed failed:", error && error.message ? error.message : error);
  process.exit(1);
});