// GARUDA Prospect -> Mongo sync.
// Reads every data/<domain>-prospects.json and upserts each prospect into the
// Prospect collection (filter on domain+email, unique-indexed). Supports
// --dry-run to print what would change without writing anything.
//
//   node scripts/sync-prospects-to-mongo.js
//   node scripts/sync-prospects-to-mongo.js --dry-run

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const { Prospect } = require("../src/models/Prospect");

const DATA_DIR = path.join(__dirname, "..", "data");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/garuda_ai";

const dryRun = process.argv.includes("--dry-run");

function domainFromFile(file) {
  return file.replace(/-prospects\.json$/i, "");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function toProspectDoc(raw, domain) {
  const firstName = String(raw.firstName || "").trim();
  const lastName = String(raw.lastName || "").trim();
  return {
    domain,
    name: String(raw.name || [firstName, lastName].filter(Boolean).join(" ") || "").trim(),
    firstName,
    lastName,
    businessName: String(raw.businessName || "").trim(),
    email: normalizeEmail(raw.email),
    phone: String(raw.phone || "").trim(),
    location: String(raw.location || "").trim(),
    city: String(raw.city || "").trim(),
    state: String(raw.state || "").trim(),
    website: String(raw.website || "").trim(),
    score: typeof raw.score === "number" ? raw.score : 0,
    grade: String(raw.grade || "").trim(),
    action: String(raw.action || "").trim(),
    status: String(raw.status || "scored").trim(),
    query: String(raw.query || "").trim(),
    signals: Array.isArray(raw.signals) ? raw.signals : [],
    segments: Array.isArray(raw.segments) ? raw.segments : [],
    source: String(raw.source || "public_research").trim(),
    notes: String(raw.notes || "").trim(),
    locale: String(raw.locale || "").trim(),
    country: String(raw.country || "").trim(),
    sourceId: String(raw.id || "").trim()
  };
}

function isValid(doc) {
  return Boolean(doc.domain && doc.email);
}

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log(`[SYNC] MongoDB connected: ${mongoose.connection.name}`);

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith("-prospects.json"))
    .sort();

  if (!files.length) {
    console.log("[SYNC] No data/*-prospects.json files found.");
    await mongoose.disconnect();
    return;
  }

  const summary = { files: files.length, added: 0, updated: 0, skippedInvalid: 0, skippedMissingFile: 0 };
  const rows = [];

  for (const file of files) {
    const domain = domainFromFile(file);
    const fullPath = path.join(DATA_DIR, file);
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    } catch (error) {
      console.log(`  !! ${file}: unreadable (${error.message})`);
      summary.skippedMissingFile += 1;
      continue;
    }

    const list = Array.isArray(raw) ? raw : raw.prospects || [];
    const docs = list.map((p) => toProspectDoc(p, domain));
    const valid = docs.filter(isValid);
    const invalid = docs.length - valid.length;

    if (dryRun) {
      const existingEmails = new Set(
        (await Prospect.find({ domain }).select("email").lean()).map((d) => d.email)
      );
      const added = valid.filter((d) => !existingEmails.has(d.email));
      const updated = valid.filter((d) => existingEmails.has(d.email));
      rows.push({ file, domain, total: list.length, added: added.length, updated: updated.length, invalid });
      summary.added += added.length;
      summary.updated += updated.length;
      summary.skippedInvalid += invalid;
      continue;
    }

    if (!valid.length) {
      console.log(`  -- ${file}: ${list.length} entries, all invalid (no email/domain)`);
      summary.skippedInvalid += invalid;
      continue;
    }

    const ops = valid.map((doc) => ({
      updateOne: {
        filter: { domain: doc.domain, email: doc.email },
        update: {
          $set: {
            name: doc.name,
            firstName: doc.firstName,
            lastName: doc.lastName,
            businessName: doc.businessName,
            phone: doc.phone,
            location: doc.location,
            city: doc.city,
            state: doc.state,
            website: doc.website,
            score: doc.score,
            grade: doc.grade,
            action: doc.action,
            status: doc.status,
            query: doc.query,
            signals: doc.signals,
            segments: doc.segments,
            source: doc.source,
            notes: doc.notes,
            locale: doc.locale,
            country: doc.country,
            sourceId: doc.sourceId
          },
          $setOnInsert: { createdAt: new Date() }
        },
        upsert: true
      }
    }));

    const result = await Prospect.bulkWrite(ops, { ordered: false });
    const added = result.upsertedCount || 0;
    const updated = result.modifiedCount || 0;
    rows.push({ file, domain, total: list.length, added, updated, invalid });
    summary.added += added;
    summary.updated += updated;
    summary.skippedInvalid += invalid;
    console.log(`  ++ ${file}: ${list.length} entries -> added ${added} | updated ${updated} | invalid ${invalid}`);
  }

  console.log(`\n[SYNC] ${dryRun ? "DRY-RUN (nothing written)" : "Done"} — ${summary.files} files | added ${summary.added} | updated ${summary.updated} | skipped-invalid ${summary.skippedInvalid}`);
  for (const r of rows) {
    console.log(`  ${r.file.padEnd(35)} total=${String(r.total).padStart(4)} added=${String(r.added).padStart(4)} updated=${String(r.updated).padStart(4)} invalid=${String(r.invalid).padStart(3)}`);
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(`[SYNC] FAILED: ${error.message}`);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});