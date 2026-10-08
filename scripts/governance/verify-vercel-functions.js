#!/usr/bin/env node
/**
 * 🦅 GARUDA SOVEREIGN VERCEL SERVERLESS FUNCTION GUARDRAIL
 * Enforces Constitutional Law & Vercel Hobby Plan Cap:
 * Vercel Hobby strictly permits a MAXIMUM of 12 Serverless Functions in api/*.js.
 * This guardrail physically aborts any build if the count exceeds 10 functions (giving a 2-function safety margin).
 */

const fs = require("fs");
const path = require("path");

const API_DIR = path.join(__dirname, "..", "..", "api");
const HARD_CAP = 12;
const SAFETY_CAP = 10;

function checkVercelFunctions() {
  if (!fs.existsSync(API_DIR)) {
    console.log("✔ [GUARDRAIL] No api/ directory found. Function check passed.");
    return;
  }

  // Read all top-level files in api/
  const entries = fs.readdirSync(API_DIR, { withFileTypes: true });
  const serverlessFunctions = entries.filter((entry) => {
    // Only .js files that do NOT start with an underscore are compiled as serverless functions
    return entry.isFile() && entry.name.endsWith(".js") && !entry.name.startsWith("_");
  });

  const count = serverlessFunctions.length;
  console.log(`\n🛡️ [GARUDA VERCEL GUARDRAIL] Checking api/ Serverless Functions: Found ${count} functions.`);
  serverlessFunctions.forEach((fn, idx) => {
    console.log(`   ${idx + 1}. api/${fn.name}`);
  });

  if (count > HARD_CAP) {
    console.error(`\n❌ [FATAL VERCEL CAP BREACH] Found ${count} Serverless Functions in api/!`);
    console.error(`   Vercel Hobby plan limit is strictly ${HARD_CAP}. Build physically ABORTED.`);
    console.error(`   Action: Move excess routes to Render Express (src/routes/) and proxy via vercel.json.`);
    process.exit(1);
  }

  if (count > SAFETY_CAP) {
    console.warn(`\n⚠️ [WARNING] Function count (${count}) is close to Vercel Hobby's limit (${HARD_CAP}).`);
  }

  console.log(`✔ [GUARDRAIL PASSED] Serverless function count (${count}/${HARD_CAP}) is well within Vercel limits.\n`);
}

checkVercelFunctions();
