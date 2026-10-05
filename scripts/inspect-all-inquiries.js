const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../src/database/db");
require("dotenv").config();

async function inspectAll() {
  console.log("===============================================================");
  console.log("🦅 GARUDA INQUIRIES & CLIENT APPROACHES FORENSIC AUDIT");
  console.log("===============================================================\n");

  // 1. Check MongoDB
  try {
    await connectDB();
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("MongoDB Collections Available:", collections.map(c => c.name).join(", "));

    const targetColls = ["leads", "conversations", "inquiries", "messages", "proposals", "client_inquiries", "bot_verse_delegations", "client_requests"];
    for (const collName of targetColls) {
      if (collections.some(c => c.name === collName)) {
        const count = await db.collection(collName).countDocuments();
        console.log(`\n--- Collection [${collName}] (Total: ${count}) ---`);
        if (count > 0) {
          const docs = await db.collection(collName).find({}).sort({ updatedAt: -1, createdAt: -1, timestamp: -1 }).limit(10).toArray();
          docs.forEach((d, idx) => {
            console.log(`\n[${idx + 1}] ID: ${d._id}`);
            console.log(JSON.stringify(d, null, 2));
          });
        }
      }
    }
    await mongoose.disconnect();
  } catch (err) {
    console.warn("MongoDB inspection warning:", err.message);
  }

  // 2. Check Local Data Directory
  console.log("\n===============================================================");
  console.log("📁 LOCAL DATA FILES CHECK");
  console.log("===============================================================\n");
  const dataDir = path.resolve(__dirname, "../data");
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    console.log("Files in data/:", files.join(", "));

    const inquiryKeywords = ["lead", "inquir", "client", "proposal", "outreach", "chat", "message", "contact"];
    for (const f of files) {
      if (inquiryKeywords.some(k => f.toLowerCase().includes(k)) && (f.endsWith(".json") || f.endsWith(".jsonl"))) {
        const fullPath = path.join(dataDir, f);
        try {
          const content = fs.readFileSync(fullPath, "utf8");
          console.log(`\n--- File: ${f} (${(content.length / 1024).toFixed(1)} KB) ---`);
          if (f.endsWith(".jsonl")) {
            const lines = content.split("\n").filter(l => l.trim().length > 0);
            console.log(`Lines count: ${lines.length}`);
            lines.slice(-5).forEach(l => console.log(l));
          } else {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              console.log(`Array length: ${parsed.length}`);
              console.log(JSON.stringify(parsed.slice(-3), null, 2));
            } else {
              console.log(JSON.stringify(parsed, null, 2).slice(0, 1000));
            }
          }
        } catch (e) {
          console.warn(`Could not read ${f}:`, e.message);
        }
      }
    }
  }
}

inspectAll().catch(console.error);
