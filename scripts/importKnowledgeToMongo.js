require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const mongoose = require("mongoose");
const Knowledge = require("../src/models/Knowledge");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/garuda_ai";
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

function chunkText(text, size = 1200, overlap = 150) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + size, clean.length);
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 80) chunks.push(chunk);
    start += size - overlap;
  }

  return chunks;
}

function keywordsFrom(text) {
  return [...new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 40)
  )];
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("? MongoDB connected:", mongoose.connection.name);

  const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.toLowerCase().endsWith(".pdf"));
  console.log(`?? PDFs found: ${files.length}`);

  let totalChunks = 0;

  for (const file of files) {
    const fullPath = path.join(UPLOADS_DIR, file);
    console.log(`\n?? Processing: ${file}`);

    const buffer = fs.readFileSync(fullPath);
    const parsed = await pdf(buffer);
    const chunks = chunkText(parsed.text);

    await Knowledge.deleteMany({ sourceFile: file });

    const docs = chunks.map((content, index) => ({
      sourceFile: file,
      title: path.basename(file, ".pdf"),
      page: null,
      content,
      keywords: keywordsFrom(content),
      category: "ABSLI"
    }));

    if (docs.length) {
      await Knowledge.insertMany(docs, { ordered: false });
    }

    totalChunks += docs.length;
    console.log(`? Imported chunks: ${docs.length}`);
  }

  await Knowledge.collection.createIndex({ content: "text", title: "text", keywords: "text" });

  console.log(`\n?? GARUDA Knowledge Import Complete`);
  console.log(`?? Total chunks imported: ${totalChunks}`);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("? Import failed:", error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
