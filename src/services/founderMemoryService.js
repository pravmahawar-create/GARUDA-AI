// GARUDA Founder Memory Service
//
// Persistent memory of founder-provided facts (orders, partners, positioning)
// so GARUDA has real "record" instead of hallucinating. Storage:
//   1. Supabase `founder_memory` table (when SUPABASE_SECRET_KEY / SERVICE_ROLE_KEY set)
//   2. File fallback: data/founder-memory.json
//
// buildContextPack() returns a compact ground-truth block injected into the
// founder console + Telegram bot prompts so GARUDA answers from facts.

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const MEMORY_FILE = path.join(__dirname, "..", "..", "data", "founder-memory.json");

function setMemoryFile(filePath) {
  if (typeof filePath === "string" && filePath.trim()) {
    memoryFileOverride = path.resolve(filePath);
  } else {
    memoryFileOverride = null;
  }
}

let memoryFileOverride = null;
function memoryFilePath() {
  return memoryFileOverride || MEMORY_FILE;
}

const DEFAULT_MEMORY = {
  business: [
    "GARUDA (garudaos.in) AI-based services bechta hai: business websites, e-commerce stores, mobile apps, Telegram bots, chatbots/AI assistants, API integrations, automation workflows, dashboards/admin panels, logo/brand design, SEO/digital marketing.",
    "GARUDA insurance bhi bechta hai — term insurance aur health plans, Aditya Birla Sun Life Insurance (ABSLI) ke partner ke roop me."
  ],
  orders: [],
  partners: [
    {
      name: "ABSLI",
      note:
        "Aditya Birla Sun Life Insurance — term insurance + health plans (e.g. Activ One NXT health plan). Positioning: 'GARUDA AI Financial Advisor + ABSLI Financial Partner'. Kabhi 'insurance agent' mat bolo. Investment-first pitch, ₹30,000 se shuru, flexible. garudaos.in har pitch me mention karo. ABSLI ko garudaos.in ke kisi public page pe pin/locate nahi karna — wo sirf GARUDA ka internal partner knowledge hai."
    }
  ],
  positioning: [
    "Never lie, never hallucinate, never give wrong commitments or false hope — Founder ko ya kisi user ko. Figures sirf tab bolo jab context/memory me hon; warna 'yeh data mere record me confirm nahi hai' + ek concrete next step.",
    "Kisi service ka payment/quote bina founder approval ke final mat karo. Pricing aur negotiation GARUDA khud kar sakta hai (founder-approved), lekin kabhi base cost se niche nahi, aur koi fake promise nahi.",
    "Founder: Praveen Mahawar. GARUDA wo nahi hai. Customer se founder ka naam/phone expose nahi karna."
  ]
};

function supabaseConfigured() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && secret);
}

function supabaseAdmin() {
  if (!supabaseConfigured()) return null;
  return createClient(
    String(process.env.SUPABASE_URL).trim(),
    String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY).trim(),
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

function normalizeMemory(input) {
  const base = {
    business: [],
    orders: [],
    partners: [],
    positioning: []
  };
  const src = input && typeof input === "object" ? input : {};
  for (const key of Object.keys(base)) {
    const value = src[key];
    if (Array.isArray(value)) {
      base[key] = value;
    } else if (typeof value === "object" && value !== null) {
      base[key] = Object.values(value);
    }
  }
  return base;
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// --------------------------- storage ---------------------------

async function readStore() {
  if (supabaseConfigured()) {
    try {
      const client = supabaseAdmin();
      const { data, error } = await client.from("founder_memory").select("key, value");
      if (!error && Array.isArray(data) && data.length) {
        const obj = {};
        for (const row of data) obj[String(row.key)] = row.value;
        return { source: "supabase", data: normalizeMemory(obj) };
      }
    } catch {}
  }
  try {
    if (fs.existsSync(memoryFilePath())) {
      const parsed = JSON.parse(fs.readFileSync(memoryFilePath(), "utf8"));
      return { source: "file", data: normalizeMemory(parsed) };
    }
  } catch {}
  return { source: "defaults", data: JSON.parse(JSON.stringify(DEFAULT_MEMORY)) };
}

async function writeStore(memory) {
  if (supabaseConfigured()) {
    try {
      const client = supabaseAdmin();
      const rows = Object.entries(memory).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));
      const { error } = await client
        .from("founder_memory")
        .upsert(rows, { onConflict: "key" });
      if (!error) return { source: "supabase" };
    } catch {}
  }
  try {
    fs.mkdirSync(path.dirname(memoryFilePath()), { recursive: true });
    fs.writeFileSync(memoryFilePath(), JSON.stringify(memory, null, 2), "utf8");
    return { source: "file" };
  } catch {
    return { source: "none" };
  }
}

// --------------------------- public API ---------------------------

async function getMemory() {
  return (await readStore()).data;
}

async function getAllFacts() {
  return (await readStore()).data;
}

async function saveFact(section, fact) {
  const { data } = await readStore();
  if (!Object.prototype.hasOwnProperty.call(data, section)) data[section] = [];
  if (!Array.isArray(data[section])) data[section] = [];
  const value = typeof fact === "string" ? fact.trim() : fact;
  if (!value) return { saved: false, reason: "empty_fact" };
  const already = data[section].some((item) => deepEqual(item, value));
  if (already) return { saved: false, reason: "duplicate", section };
  data[section].push(value);
  const write = await writeStore(data);
  return { saved: true, section, source: write.source };
}

async function addOrder(order) {
  return saveFact("orders", order);
}

async function buildContextPack() {
  const { data } = await readStore();
  const lines = [];

  if (Array.isArray(data.business) && data.business.length) {
    lines.push("[Business]");
    for (const item of data.business) lines.push(`- ${item}`);
  }
  if (Array.isArray(data.orders) && data.orders.length) {
    lines.push("[Orders]");
    for (const item of data.orders) {
      lines.push(`- ${typeof item === "string" ? item : JSON.stringify(item)}`);
    }
  } else {
    lines.push("[Orders]");
    lines.push("- abhi koi recorded order nahi hai");
  }
  if (Array.isArray(data.partners) && data.partners.length) {
    lines.push("[Partners]");
    for (const item of data.partners) {
      lines.push(`- ${typeof item === "string" ? item : (item.name || "") + ": " + (item.note || "")}`);
    }
  }
  if (Array.isArray(data.positioning) && data.positioning.length) {
    lines.push("[Positioning Rules]");
    for (const item of data.positioning) lines.push(`- ${item}`);
  }

  lines.push("[Live Pipeline]");
  try {
    const pipeline = buildPipelineSummary();
    lines.push(pipeline);
  } catch {
    lines.push("- pipeline data unavailable");
  }

  return lines.join("\n");
}

function buildPipelineSummary() {
  const dataDir = path.join(__dirname, "..", "..", "data");
  let files = [];
  try {
    files = fs.readdirSync(dataDir).filter((f) => f.endsWith("-outreach-ledger.json"));
  } catch {
    files = [];
  }

  let sent = 0;
  let bounced = 0;
  let interested = 0;
  for (const file of files) {
    try {
      const ledger = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
      for (const lead of ledger.leads || []) {
        if (lead.bounced || lead.status === "bounced") bounced++;
        else if (lead.status === "message_sent") sent++;
        const h = Array.isArray(lead.history) ? lead.history : [];
        if (h.some((e) => String(e.action || "").includes("interested"))) interested++;
      }
    } catch {}
  }
  const total = sent + bounced;
  return `- ${sent} emails delivered (${bounced} bounced/dead addresses excluded, ${interested} interested replies tracked). Pipeline file-based, real outreach LIVE.`;
}

// ------------------- auto-capture from founder text -------------------

// Heuristic capture: when the founder states a new order/deal/partner, save it
// so the very next turn (and every future turn) has the record.
function captureMemoryFromMessage(text) {
  const clean = String(text || "").trim();
  if (!clean) return null;

  const orderMatch = clean.match(/order|deal|contract|sale|container|shipment/i);
  if (orderMatch && /(mila|aaya|aagaya|aa gaya|got|received|final|done|mil gaya|confirmed|confirm)/i.test(clean)) {
    return { action: "order", text: clean };
  }

  const noteMatch = clean.match(/\b(yaad rakho|remember|note|record karo|save|yaad rakh)\b/i);
  if (noteMatch) {
    const text = clean
      .replace(noteMatch[0], "")
      .replace(/^[\s:.,\-]+/, "")
      .trim();
    if (text) return { action: "note", text };
  }

  return null;
}

module.exports = {
  addOrder,
  buildContextPack,
  captureMemoryFromMessage,
  getAllFacts,
  getMemory,
  saveFact,
  setMemoryFile
};
