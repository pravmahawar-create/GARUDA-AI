/**
 * GARUDA Unified Cross-Platform Lead Guard & Concurrency Controller
 * 
 * SOVEREIGN DIRECTIVES:
 * 1. Global Contact Check: Facebook ↔ Instagram ↔ LinkedIn deduplication.
 * 2. Canonical Identity: normalized username, profile URL, platform, author, and snippet.
 * 3. Atomic Multi-Process Protection: Prevents simultaneous outreach to same prospect.
 * 4. Single-Instance Daemon Locks: Prevents duplicate orchestrators/scouts from running.
 */

const fs = require('fs');
const path = require('path');

const LEADS_DIR = path.join(__dirname, '..', '..', 'data', 'leads');
const LOCKS_DIR = path.join(__dirname, '..', '..', 'data', 'locks');

if (!fs.existsSync(LEADS_DIR)) fs.mkdirSync(LEADS_DIR, { recursive: true });
if (!fs.existsSync(LOCKS_DIR)) fs.mkdirSync(LOCKS_DIR, { recursive: true });

const LEAD_FILES = [
  path.join(LEADS_DIR, 'unified_leads_ledger.json'),
  path.join(LEADS_DIR, 'direct_messages_sent.json'),
  path.join(LEADS_DIR, 'facebook_private_dms.json'),
  path.join(LEADS_DIR, 'facebook_scouted_leads.json'),
  path.join(LEADS_DIR, 'instagram_private_dms.json'),
  path.join(LEADS_DIR, 'linkedin_scouted_leads.json')
];

function normalizeStr(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function normalizeUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).toLowerCase().replace(/\/+$/, '');
  } catch {
    return String(url).toLowerCase().trim().replace(/\/+$/, '');
  }
}

/**
 * Loads all historical contacts across all platform ledgers.
 */
function loadAllContactedLeads() {
  const leads = [];
  for (const filePath of LEAD_FILES) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          leads.push(...parsed);
        }
      } catch (e) {
        // Skip malformed files without throwing
      }
    }
  }
  return leads;
}

/**
 * GLOBAL CONTACT CHECK
 * Before ANY outbound action, checks if prospect was ever contacted on ANY platform.
 * Returns { contacted: boolean, reason?: string, existing?: object }
 */
function isGloballyContacted({ username, profileUrl, author, snippet }) {
  const normUser = normalizeStr(username);
  const normAuthor = normalizeStr(author);
  const normUrl = normalizeUrl(profileUrl);
  const normSnippet = normalizeStr(snippet).slice(0, 35);

  const allLeads = loadAllContactedLeads();

  const candidateIds = [normUser, normAuthor].filter(Boolean);

  for (const h of allLeads) {
    const hUser = normalizeStr(h.username || h.prospect || h.author);
    const hAuthor = normalizeStr(h.author || h.prospect || h.name);
    const hUrl = normalizeUrl(h.profileUrl || h.profileLink || h.messengerUrl);
    const hSnippet = normalizeStr(h.snippet || h.message || h.pitch).slice(0, 35);

    const recordedIds = [hUser, hAuthor].filter(Boolean);

    // 1. Cross-Identifier Match (Candidate User/Author vs Recorded User/Author)
    for (const cId of candidateIds) {
      for (const rId of recordedIds) {
        if (cId === rId || (cId.length > 5 && rId === cId)) {
          return { contacted: true, reason: `Matched identity "${rId}" on ${h.platform || 'previous record'}`, existing: h };
        }
      }
    }

    // 3. Profile URL Match
    if (normUrl && hUrl && normUrl === hUrl) {
      return { contacted: true, reason: `Matched profile URL "${hUrl}" on ${h.platform || 'previous record'}`, existing: h };
    }

    // 4. Content Snippet Match
    if (normSnippet && hSnippet && normSnippet.length >= 25 && (normSnippet.includes(hSnippet) || hSnippet.includes(normSnippet))) {
      return { contacted: true, reason: `Matched content snippet prefix on ${h.platform || 'previous record'}`, existing: h };
    }
  }

  return { contacted: false };
}

/**
 * Atomically saves a lead to the platform file and unified ledger.
 */
function recordContactedLead(lead) {
  const unifiedPath = path.join(LEADS_DIR, 'unified_leads_ledger.json');
  let unified = [];
  if (fs.existsSync(unifiedPath)) {
    try {
      unified = JSON.parse(fs.readFileSync(unifiedPath, 'utf-8'));
    } catch {}
  }

  const record = {
    ...lead,
    recordedAt: new Date().toISOString(),
    canonicalTimestamp: Date.now()
  };

  unified.push(record);
  fs.writeFileSync(unifiedPath, JSON.stringify(unified, null, 2), 'utf-8');

  // Also append to platform specific ledger if provided
  if (lead.platformFile && fs.existsSync(path.dirname(lead.platformFile))) {
    let platformData = [];
    if (fs.existsSync(lead.platformFile)) {
      try {
        platformData = JSON.parse(fs.readFileSync(lead.platformFile, 'utf-8'));
      } catch {}
    }
    platformData.push(record);
    fs.writeFileSync(lead.platformFile, JSON.stringify(platformData, null, 2), 'utf-8');
  }

  return record;
}

/**
 * SINGLE INSTANCE PID LOCKFILE MANAGEMENT
 * Prevents duplicate orchestrators or daemons from running simultaneously.
 */
function acquireProcessLock(daemonName) {
  const lockFile = path.join(LOCKS_DIR, `${daemonName}.pid`);

  if (fs.existsSync(lockFile)) {
    try {
      const existingPid = parseInt(fs.readFileSync(lockFile, 'utf-8').trim(), 10);
      if (existingPid && !isNaN(existingPid)) {
        // Test if PID is currently alive
        try {
          process.kill(existingPid, 0); // throws if process does not exist
          console.warn(`🚨 [SINGLE-INSTANCE LOCK] ${daemonName} is ALREADY running under PID ${existingPid}. Aborting duplicate start.`);
          return { acquired: false, existingPid };
        } catch (e) {
          // Process is dead, stale lock
          console.log(`ℹ️ [SINGLE-INSTANCE LOCK] Stale lock detected for PID ${existingPid}. Overriding lock.`);
        }
      }
    } catch (err) {
      // Malformed lockfile, proceed
    }
  }

  // Claim lock with current PID
  fs.writeFileSync(lockFile, String(process.pid), 'utf-8');

  // Register clean release on exit
  const release = () => {
    try {
      if (fs.existsSync(lockFile)) {
        const cur = fs.readFileSync(lockFile, 'utf-8').trim();
        if (cur === String(process.pid)) {
          fs.unlinkSync(lockFile);
        }
      }
    } catch {}
  };

  process.on('exit', release);
  process.on('SIGINT', () => { release(); process.exit(0); });
  process.on('SIGTERM', () => { release(); process.exit(0); });

  return { acquired: true, pid: process.pid, release };
}

/**
 * CYCLE LOCK: Prevents simultaneous executions of the same scout daemon cycle.
 */
const activeCycles = new Set();
async function withCycleLock(cycleName, asyncFn) {
  if (activeCycles.has(cycleName)) {
    console.warn(`⏳ [CYCLE LOCK] Cycle "${cycleName}" is already actively running. Skipping overlapping cycle.`);
    return null;
  }
  activeCycles.add(cycleName);
  try {
    return await asyncFn();
  } finally {
    activeCycles.delete(cycleName);
  }
}

module.exports = {
  isGloballyContacted,
  recordContactedLead,
  acquireProcessLock,
  withCycleLock,
  loadAllContactedLeads
};
