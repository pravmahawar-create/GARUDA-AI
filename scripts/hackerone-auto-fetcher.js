#!/usr/bin/env node
/**
 * GARUDA HackerOne Auto-Fetcher — 80/20 Daily + Gold Strategy
 * Fetches HackerOne programs via api.hackerone.com/v1/hackers/programs
 * Supports: $100-500 regular (Internet/Campaigns) + Gold $5000-6000 (20% effort)
 * Uses: HACKERONE_API_USERNAME + HACKERONE_API_TOKEN from .env (Basic auth)
 * Saves to: data/bounty-targets.txt (deduped, atomic)
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const API_BASE = "https://api.hackerone.com/v1/hackers";
const TARGETS_PATH = path.join(__dirname, "..", "data", "bounty-targets.txt");

function getAuth() {
  const user = process.env.HACKERONE_API_USERNAME || process.env.HACKERONE_USERNAME || "garudaos";
  const token = process.env.HACKERONE_API_TOKEN || process.env.HACKERONE_TOKEN;
  if (!user || !token) throw new Error("HACKERONE_API_USERNAME/HACKERONE_API_TOKEN missing in .env");
  return "Basic " + Buffer.from(user + ":" + token).toString("base64");
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { "Authorization": getAuth(), "Accept": "application/json" } });
  if (!r.ok) throw new Error(`HackerOne API ${r.status} for ${url}: ${await r.text().then(t=>t.slice(0,300))}`);
  return r.json();
}

async function fetchPrograms({ maxPrograms = 150 } = {}) {
  let programs = [];
  let url = `${API_BASE}/programs?page[size]=100`;
  while (url && programs.length < maxPrograms) {
    const j = await fetchJson(url);
    const data = j.data || [];
    programs.push(...data);
    url = j.links && j.links.next ? j.links.next : null;
    if (programs.length >= maxPrograms) break;
    await new Promise(r=>setTimeout(r, 400));
  }
  return programs.slice(0, maxPrograms);
}

async function fetchScopes(handle, maxScopes = 50) {
  let scopes = [];
  let url = `${API_BASE}/programs/${handle}/structured_scopes?page[size]=100`;
  while (url && scopes.length < maxScopes) {
    const j = await fetchJson(url);
    const data = j.data || [];
    scopes.push(...data.map(d=>d.attributes));
    url = j.links && j.links.next ? j.links.next : null;
    if (scopes.length >= maxScopes) break;
    await new Promise(r=>setTimeout(r, 300));
  }
  return scopes;
}

function isGoldProgram(program) {
  const attrs = program.attributes || {};
  // Only true Gold Standard handles — don't mark every USD program as Gold
  const goldHandles = new Set(["shopify","nba-public","crypto","eternal","wallet_on_telegram","flipkart","meesho_bbp","varonis","neon_bbp","eufy_security","gocardless_bbp"]);
  return goldHandles.has(attrs.handle);
}

async function autoFetch({ maxPrograms = 150, techFilter = ["aws","cloudflare","javascript","js","api","cloudfront","s3","nginx"], includeGold = true } = {}) {
  console.log(`🦅 Fetching HackerOne programs (max ${maxPrograms}) — 80/20 Daily+Gold strategy...`);
  const programs = await fetchPrograms({ maxPrograms });
  console.log(`  Fetched ${programs.length} programs`);

  let regularTargets = [];
  let goldTargets = [];
  let skipped = 0;

  // MONEY-ONLY RULE: Only bounty-paying programs with exploitable impact (no Informative/ThankYou)
  const MONEY_MIN_BOUNTY = 100;
  const MONEY_ONLY = true; // Founder rule: sif paisa kamane wale hi kam

  for (const prog of programs) {
    const handle = prog.attributes.handle;
    const offersBounty = prog.attributes.offers_bounties;
    if (!offersBounty) { skipped++; continue; }
    if (handle === "security" || handle === "hackerone") { skipped++; continue; } // Skip HackerOne's own program
    // Money filter: skip programs with max_severity informative only (no bounty)
    if (MONEY_ONLY) {
      const progBounty = prog.attributes?.bounty_range || prog.attributes?.max_bounty || 0;
      // If program explicitly says no bounty or informative only, skip — we check via offers_bounties already
    }

    const isGold = isGoldProgram(prog);
    const scopes = await fetchScopes(handle).catch(e=>{ console.log(`  ⚠ scopes failed for ${handle}: ${e.message.slice(0,80)}`); return []; });

    for (const sc of scopes) {
      if (!sc.eligible_for_bounty || !sc.eligible_for_submission) continue;
      const assetType = String(sc.asset_type || "").toUpperCase();
      if (!["URL","WILDCARD","DOMAIN","API","CIDR"].includes(assetType)) continue;
      const instruction = String(sc.instruction || "").toLowerCase();
      const identifier = String(sc.asset_identifier || "").trim();
      if (!identifier) continue;
      // Tech filter: must match at least one tech keyword OR be URL/Wildcard (always consider)
      const techHit = techFilter.some(k=> instruction.includes(k) || identifier.toLowerCase().includes(k));
      const shouldInclude = techHit || assetType==="WILDCARD" || assetType==="URL";
      if (!shouldInclude) continue;

      let target = identifier;
      if (target.startsWith("*.")) target = target.slice(2);
      if (!target.startsWith("http")) target = "https://" + target;
      // Normalize wildcard for daemon's discover
      if (isGold) goldTargets.push(target);
      else regularTargets.push(target);
    }
    await new Promise(r=>setTimeout(r, 200));
  }

  // 80/20 split: 80% regular $100-500, 20% Gold $5000-6000
  const allTargets = [...new Set(regularTargets)];
  const goldUnique = [...new Set(goldTargets)];
  // Add 20% Gold on top of regular
  const goldToAdd = goldUnique.slice(0, Math.max(5, Math.floor(allTargets.length * 0.25)));
  const finalTargets = [...new Set([...allTargets, ...goldToAdd])];

  console.log(`  Regular targets: ${allTargets.length} | Gold targets: ${goldUnique.length} | Gold added (20%): ${goldToAdd.length} | Final: ${finalTargets.length} | Skipped programs: ${skipped}`);

  // Atomic append to data/bounty-targets.txt (preserve header, dedupe)
  const existing = fs.existsSync(TARGETS_PATH) ? fs.readFileSync(TARGETS_PATH,"utf8").split(/\r?\n/).map(s=>s.trim()).filter(Boolean).filter(l=>!l.startsWith("#")) : [];
  const existingSet = new Set(existing.map(s=>s.replace(/^https?:\/\//,"").replace(/\/$/,"").toLowerCase()));
  const newOnes = finalTargets.filter(t=>{
    const norm = t.replace(/^https?:\/\//,"").replace(/\/$/,"").toLowerCase();
    return !existingSet.has(norm);
  });
  if (newOnes.length > 0) {
    const header = "# GARUDA Bug Bounty — In-Scope Targets (one per line)\n# Supports: https://target.com | target.com | *.target.com | 1.1.1.0/30\n";
    const all = [...new Set([...existing, ...newOnes])];
    const tmp = TARGETS_PATH + ".tmp." + Date.now();
    fs.writeFileSync(tmp, header + all.join("\n") + "\n", "utf8");
    fs.renameSync(tmp, TARGETS_PATH);
    console.log(`  ✅ Added ${newOnes.length} new targets to ${TARGETS_PATH}`);
  } else {
    console.log(`  No new targets to add — all already in ${TARGETS_PATH}`);
  }

  return { regular: allTargets.length, gold: goldUnique.length, goldAdded: goldToAdd.length, final: finalTargets.length, newAdded: newOnes.length };
}

if (require.main === module) {
  autoFetch().then(r=>console.log("Done:", r)).catch(e=>{ console.error("Fatal:", e.message); process.exit(1); });
}

module.exports = { autoFetch, fetchPrograms, fetchScopes };
