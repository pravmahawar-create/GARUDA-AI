/**
 * GARUDA FOUNDER INTELLIGENCE — Client Memory Persistence Adapter (Phase 5)
 *
 * Founder correction #3: business logic must NOT be coupled to JSONL.
 * This file defines a storage-agnostic adapter interface plus an initial
 * JSONL implementation. Future Mongo/Postgres/Supabase adapters only need
 * to implement the same interface — no Founder Intelligence rewrites.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Adapter interface (documented contract):
 *   append(record)                  -> Promise<{id, record}>
 *   update(id, patch)               -> Promise<{id, record}|null>
 *   findById(id)                    -> Promise<record|null>
 *   listByClient(clientId)          -> Promise<record[]>
 *   listAll()                       -> Promise<record[]>
 *   search(predicateFn)             -> Promise<record[]>
 *
 * Records are JSON-safe plain objects with `id`, `clientId`, `updatedAt`.
 */
class ClientMemoryAdapter {
  async append() {
    throw new Error("ADAPTER_METHOD_NOT_IMPLEMENTED: append");
  }
  async update() {
    throw new Error("ADAPTER_METHOD_NOT_IMPLEMENTED: update");
  }
  async findById() {
    throw new Error("ADAPTER_METHOD_NOT_IMPLEMENTED: findById");
  }
  async listByClient() {
    throw new Error("ADAPTER_METHOD_NOT_IMPLEMENTED: listByClient");
  }
  async listAll() {
    throw new Error("ADAPTER_METHOD_NOT_IMPLEMENTED: listAll");
  }
  async search() {
    throw new Error("ADAPTER_METHOD_NOT_IMPLEMENTED: search");
  }
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

/**
 * Initial JSONL-backed adapter.
 * File format: one JSON object per line. Last-write-wins per id for updates
 * (update rewrites the line in place).
 */
class JsonlClientMemoryAdapter extends ClientMemoryAdapter {
  constructor({ filePath } = {}) {
    super();
    this.filePath =
      filePath ||
      path.join(process.cwd(), "data", "founder-intelligence-clients.jsonl");
    this._cache = null;
    this._cacheMtimeMs = null;
  }

  _ensureDir() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  _load() {
    if (!fs.existsSync(this.filePath)) {
      this._cache = [];
      this._cacheMtimeMs = 0;
      return this._cache;
    }
    let mtimeMs = 0;
    try {
      mtimeMs = fs.statSync(this.filePath).mtimeMs;
    } catch {
      mtimeMs = 0;
    }
    if (this._cache && this._cacheMtimeMs === mtimeMs) return this._cache;
    const raw = fs.readFileSync(this.filePath, "utf8");
    const records = [];
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        records.push(JSON.parse(trimmed));
      } catch {
        /* corrupt line skipped — never crash memory reads */
      }
    }
    this._cache = records;
    this._cacheMtimeMs = mtimeMs;
    return records;
  }

  _persist(records) {
    this._ensureDir();
    const body = records.map((r) => JSON.stringify(r)).join("\n");
    fs.writeFileSync(this.filePath, body ? body + "\n" : "", "utf8");
    this._cache = records;
    try {
      this._cacheMtimeMs = fs.statSync(this.filePath).mtimeMs;
    } catch {
      this._cacheMtimeMs = 0;
    }
  }

  async append(record) {
    const id = record.id || `cfm_${sha256(JSON.stringify(record)).slice(0, 16)}`;
    const now = new Date().toISOString();
    const full = { ...record, id, createdAt: record.createdAt || now, updatedAt: now };
    const records = this._load();
    records.push(full);
    this._persist(records);
    return { id, record: full };
  }

  async update(id, patch) {
    const records = this._load();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const updated = { ...records[idx], ...patch, id, updatedAt: new Date().toISOString() };
    records[idx] = updated;
    this._persist(records);
    return { id, record: updated };
  }

  async findById(id) {
    return this._load().find((r) => r.id === id) || null;
  }

  async listByClient(clientId) {
    return this._load().filter((r) => r.clientId === clientId);
  }

  async listAll() {
    return [...this._load()];
  }

  async search(predicateFn) {
    return this._load().filter(predicateFn);
  }
}

/**
 * Factory — swap adapters here without touching business logic.
 * Env override: GARUDA_FOUNDER_MEMORY_ADAPTER=jsonl|mongo|postgres|supabase
 */
function createAdapter({ adapterName, filePath } = {}) {
  const chosen = adapterName || process.env.GARUDA_FOUNDER_MEMORY_ADAPTER || "jsonl";
  const resolvedPath = filePath || process.env.GARUDA_FOUNDER_MEMORY_FILE || undefined;
  switch (String(chosen).toLowerCase()) {
    case "jsonl":
      return new JsonlClientMemoryAdapter({ filePath: resolvedPath });
    default:
      throw new Error(`UNSUPPORTED_CLIENT_MEMORY_ADAPTER: ${chosen}`);
  }
}

module.exports = {
  ClientMemoryAdapter,
  JsonlClientMemoryAdapter,
  createAdapter,
};
