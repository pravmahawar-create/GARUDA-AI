const fs = require("fs");
const path = require("path");

const CAPABILITIES_FILE = path.join(process.cwd(), "data", "self-awareness", "capabilities.json");

function ensureDir() {
  const dir = path.dirname(CAPABILITIES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function createCapability(input) {
  return {
    id: input.id || `cap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name || "Unknown",
    category: input.category || "general",
    description: input.description || "",
    maturity: input.maturity || "prototype",
    status: input.status || "active",
    testCount: input.testCount || 0,
    successRate: typeof input.successRate === "number" ? input.successRate : null,
    lastUsed: null,
    lastUpdated: new Date().toISOString(),
    dependencies: Array.isArray(input.dependencies) ? input.dependencies : [],
    tags: Array.isArray(input.tags) ? input.tags : []
  };
}

function registerCapability(input) {
  ensureDir();
  const caps = loadCapabilities();
  const existing = caps.find((c) => c.id === input.id);
  if (existing) {
    Object.assign(existing, input, { lastUpdated: new Date().toISOString() });
    saveCapabilities(caps);
    return existing;
  }
  const cap = createCapability(input);
  caps.push(cap);
  saveCapabilities(caps);
  return cap;
}

function getCapability(capId) {
  const caps = loadCapabilities();
  return caps.find((c) => c.id === capId) || null;
}

function listCapabilities() {
  return loadCapabilities();
}

function getCapabilitiesByCategory(category) {
  return loadCapabilities().filter((c) => c.category === category);
}

function getCapabilitiesByMaturity(maturity) {
  return loadCapabilities().filter((c) => c.maturity === maturity);
}

function updateCapability(capId, updates) {
  const caps = loadCapabilities();
  const cap = caps.find((c) => c.id === capId);
  if (!cap) return null;
  Object.assign(cap, updates, { lastUpdated: new Date().toISOString() });
  saveCapabilities(caps);
  return cap;
}

function removeCapability(capId) {
  const caps = loadCapabilities();
  const idx = caps.findIndex((c) => c.id === capId);
  if (idx === -1) return false;
  caps.splice(idx, 1);
  saveCapabilities(caps);
  return true;
}

function loadCapabilities() {
  ensureDir();
  if (!fs.existsSync(CAPABILITIES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(CAPABILITIES_FILE, "utf8")); } catch { return []; }
}

function saveCapabilities(caps) {
  ensureDir();
  fs.writeFileSync(CAPABILITIES_FILE, JSON.stringify(caps, null, 2));
}

function clearCapabilities() {
  ensureDir();
  fs.writeFileSync(CAPABILITIES_FILE, "[]", "utf8");
}

function getCapabilitySummary() {
  const caps = loadCapabilities();
  const byMaturity = {};
  const byCategory = {};
  for (const c of caps) {
    byMaturity[c.maturity] = (byMaturity[c.maturity] || 0) + 1;
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  }
  return { total: caps.length, byMaturity, byCategory };
}

module.exports = {
  createCapability, registerCapability, getCapability, listCapabilities,
  getCapabilitiesByCategory, getCapabilitiesByMaturity, updateCapability,
  removeCapability, clearCapabilities, getCapabilitySummary
};
