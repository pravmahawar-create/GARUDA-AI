const fs = require("fs");
const path = require("path");

const CAPABILITIES_FILE = path.join(process.cwd(), "data", "self-expansion", "capabilities.json");
const MODULES_DIR = path.join(process.cwd(), "src", "services", "expanded");

function ensureDirs() {
  const capDir = path.dirname(CAPABILITIES_FILE);
  if (!fs.existsSync(capDir)) fs.mkdirSync(capDir, { recursive: true });
  if (!fs.existsSync(MODULES_DIR)) fs.mkdirSync(MODULES_DIR, { recursive: true });
}

function loadCapabilities() {
  ensureDirs();
  if (!fs.existsSync(CAPABILITIES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(CAPABILITIES_FILE, "utf8")); } catch { return []; }
}

function saveCapabilities(caps) {
  ensureDirs();
  fs.writeFileSync(CAPABILITIES_FILE, JSON.stringify(caps, null, 2));
}

function detectCapabilityGaps() {
  const existing = loadCapabilities();
  const existingNames = existing.map((c) => c.name);

  const potentialCapabilities = [
    { name: "jsonValidator", category: "utility", description: "Validate JSON schema", requiredMethods: ["validate"] },
    { name: "csvParser", category: "utility", description: "Parse CSV files", requiredMethods: ["parse", "stringify"] },
    { name: "dateUtils", category: "utility", description: "Date formatting and manipulation", requiredMethods: ["format", "parse", "diff"] },
    { name: "stringUtils", category: "utility", description: "String manipulation helpers", requiredMethods: ["slugify", "capitalize", "truncate"] },
    { name: "arrayUtils", category: "utility", description: "Array manipulation helpers", requiredMethods: ["unique", "chunk", "flatten"] },
    { name: "fileWatcher", category: "system", description: "Watch file changes", requiredMethods: ["watch", "unwatch"] },
    { name: "rateLimiter", category: "network", description: "Rate limiting for API calls", requiredMethods: ["check", "reset"] },
    { name: "cache", category: "performance", description: "In-memory cache with TTL", requiredMethods: ["get", "set", "delete", "clear"] },
    { name: "logger", category: "observability", description: "Structured logging", requiredMethods: ["info", "warn", "error", "debug"] },
    { name: "metrics", category: "observability", description: "Metrics collection", requiredMethods: ["increment", "gauge", "timer"] }
  ];

  return potentialCapabilities.filter((cap) => !existingNames.includes(cap.name));
}

function generateModule(capability) {
  const moduleName = capability.name;
  const methods = capability.requiredMethods || [];

  let code = `const fs = require("fs");\nconst path = require("path");\n\n`;
  code += `// Auto-generated: ${capability.description}\n`;
  code += `// Category: ${capability.category}\n\n`;

  for (const method of methods) {
    if (method === "validate") {
      code += `function validate(input) {\n  const errors = [];\n  if (!input) errors.push("Input required");\n  return { valid: errors.length === 0, errors };\n}\n\n`;
    } else if (method === "parse") {
      code += `function parse(data, options = {}) {\n  // TODO: implement parser\n  return { data, options };\n}\n\n`;
    } else if (method === "stringify") {
      code += `function stringify(data, options = {}) {\n  // TODO: implement stringifier\n  return JSON.stringify(data, null, 2);\n}\n\n`;
    } else if (method === "format") {
      code += `function format(date, pattern = "YYYY-MM-DD") {\n  const d = new Date(date);\n  return pattern.replace("YYYY", d.getFullYear()).replace("MM", String(d.getMonth() + 1).padStart(2, "0")).replace("DD", String(d.getDate()).padStart(2, "0"));\n}\n\n`;
    } else if (method === "parse" && capability.name === "dateUtils") {
      code += `function parseDate(str) {\n  return new Date(str);\n}\n\n`;
    } else if (method === "diff") {
      code += `function diff(date1, date2) {\n  return Math.abs(new Date(date2) - new Date(date1));\n}\n\n`;
    } else if (method === "slugify") {
      code += `function slugify(str) {\n  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");\n}\n\n`;
    } else if (method === "capitalize") {
      code += `function capitalize(str) {\n  return str.charAt(0).toUpperCase() + str.slice(1);\n}\n\n`;
    } else if (method === "truncate") {
      code += `function truncate(str, maxLen = 100) {\n  return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;\n}\n\n`;
    } else if (method === "unique") {
      code += `function unique(arr) {\n  return [...new Set(arr)];\n}\n\n`;
    } else if (method === "chunk") {
      code += `function chunk(arr, size) {\n  const chunks = [];\n  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));\n  return chunks;\n}\n\n`;
    } else if (method === "flatten") {
      code += `function flatten(arr) {\n  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);\n}\n\n`;
    } else if (method === "get") {
      code += `const cache = new Map();\n\nfunction get(key) {\n  const item = cache.get(key);\n  if (!item) return null;\n  if (item.expiresAt && Date.now() > item.expiresAt) { cache.delete(key); return null; }\n  return item.value;\n}\n\n`;
    } else if (method === "set") {
      code += `function set(key, value, ttlMs = 0) {\n  const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;\n  cache.set(key, { value, expiresAt });\n}\n\n`;
    } else if (method === "delete") {
      code += `function del(key) {\n  cache.delete(key);\n}\n\n`;
    } else if (method === "clear") {
      code += `function clear() {\n  cache.clear();\n}\n\n`;
    } else if (method === "watch") {
      code += `const watchers = new Map();\n\nfunction watch(filePath, callback) {\n  const watcher = fs.watch(filePath, callback);\n  watchers.set(filePath, watcher);\n}\n\n`;
    } else if (method === "unwatch") {
      code += `function unwatch(filePath) {\n  const watcher = watchers.get(filePath);\n  if (watcher) { watcher.close(); watchers.delete(filePath); }\n}\n\n`;
    } else if (method === "check") {
      code += `const calls = new Map();\n\nfunction check(key, limit = 100, windowMs = 60000) {\n  const now = Date.now();\n  const record = calls.get(key) || { count: 0, resetAt: now + windowMs };\n  if (now > record.resetAt) { record.count = 0; record.resetAt = now + windowMs; }\n  record.count++;\n  calls.set(key, record);\n  return record.count <= limit;\n}\n\n`;
    } else if (method === "reset") {
      code += `function reset(key) {\n  calls.delete(key);\n}\n\n`;
    } else if (method === "info") {
      code += `function info(msg, meta = {}) {\n  console.log(JSON.stringify({ level: "info", msg, ...meta, timestamp: new Date().toISOString() }));\n}\n\n`;
    } else if (method === "warn") {
      code += `function warn(msg, meta = {}) {\n  console.warn(JSON.stringify({ level: "warn", msg, ...meta, timestamp: new Date().toISOString() }));\n}\n\n`;
    } else if (method === "error") {
      code += `function error(msg, meta = {}) {\n  console.error(JSON.stringify({ level: "error", msg, ...meta, timestamp: new Date().toISOString() }));\n}\n\n`;
    } else if (method === "debug") {
      code += `function debug(msg, meta = {}) {\n  if (process.env.DEBUG) console.log(JSON.stringify({ level: "debug", msg, ...meta, timestamp: new Date().toISOString() }));\n}\n\n`;
    } else if (method === "increment") {
      code += `const counters = new Map();\n\nfunction increment(name, value = 1) {\n  counters.set(name, (counters.get(name) || 0) + value);\n}\n\n`;
    } else if (method === "gauge") {
      code += `function gauge(name, value) {\n  counters.set(name, value);\n}\n\n`;
    } else if (method === "timer") {
      code += `function timer(name) {\n  const start = Date.now();\n  return () => { const elapsed = Date.now() - start; increment(name + ".ms", elapsed); };\n}\n\n`;
    } else {
      code += `function ${method}() {\n  // TODO: implement ${method}\n  return null;\n}\n\n`;
    }
  }

  const exports = methods.map((m) => {
    if (m === "delete") return "del";
    return m;
  }).join(", ");
  code += `module.exports = { ${exports} };\n`;

  return code;
}

function expand(options = {}) {
  const gaps = detectCapabilityGaps();
  if (gaps.length === 0) return { status: "no_gaps", message: "All capabilities present" };

  const toGenerate = options.max ? gaps.slice(0, options.max) : gaps.slice(0, 3);
  const results = [];

  for (const gap of toGenerate) {
    const code = generateModule(gap);
    const filePath = path.join(MODULES_DIR, `${gap.name}.js`);
    fs.writeFileSync(filePath, code, "utf8");

    const capability = {
      name: gap.name,
      category: gap.category,
      description: gap.description,
      methods: gap.requiredMethods,
      filePath: filePath,
      createdAt: new Date().toISOString(),
      status: "generated"
    };

    const caps = loadCapabilities();
    caps.push(capability);
    saveCapabilities(caps);

    results.push({ capability: gap.name, status: "generated", path: filePath });
  }

  return { status: "expanded", generated: results.length, details: results };
}

function listExpanded() {
  return loadCapabilities();
}

function getExpansionStats() {
  const caps = loadCapabilities();
  const byCategory = {};
  for (const c of caps) {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  }
  return { total: caps.length, byCategory };
}

module.exports = { detectCapabilityGaps, generateModule, expand, listExpanded, getExpansionStats, loadCapabilities, saveCapabilities };
