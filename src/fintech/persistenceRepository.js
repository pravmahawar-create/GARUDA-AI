/**
 * 🦅 GARUDA OS — FINTECH PERSISTENCE REPOSITORY (PHASE 3 + PHASE 5)
 * Bridges Sovereign Parameterized PostgreSQL (`pg.Pool`) Runtime Transactions,
 * Least-Privileged RLS Session Scoping, Atomic Row-Locking (`FOR UPDATE`),
 * and Local Test Disk-Snapshot Recovery across Restarts.
 *
 * Truthful Runtime Boundary:
 * - When initialized with a real PostgreSQL `pgPool`, executes parameterized SQL with RLS.
 * - In `NODE_ENV === "production"`, fails closed if `pgPool` is missing when persistent PG is mandated.
 * - In local offline environments without `psql` / PostgreSQL TCP daemon, supports atomic JSON state snapshots
 *   so restart persistence invariants can be tested locally while truthfully flagging DB binary status.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class PersistenceUnavailableError extends Error {
  constructor(message, code = "POSTGRES_POOL_UNAVAILABLE") {
    super(`[PERSISTENCE_ERROR] ${message} (${code})`);
    this.name = "PersistenceUnavailableError";
    this.errorCode = code;
    this.httpStatus = 503;
  }
}

class FintechPersistenceRepository {
  /**
   * @param {object} options
   * @param {object|null} options.pgPool - node-postgres Pool (or verified SQL test pool harness)
   * @param {string|null} options.snapshotFilePath - Optional atomic local disk state path
   * @param {boolean} options.requirePostgres - Fail closed when pgPool missing
   */
  constructor(options = {}) {
    this.pgPool = options.pgPool || null;
    this.snapshotFilePath = options.snapshotFilePath || null;
    this.requirePostgres = Boolean(options.requirePostgres);
    this.stateProviders = new Map(); // name -> { exportSnapshot, hydrateSnapshot }
  }

  /**
   * Lazily attempts to acquire an isolated `pg.Pool` when DATABASE_URL and `pg` are installed.
   */
  static tryCreatePoolFromEnv(env = process.env) {
    const conn = env.FINTECH_PG_URL || env.DATABASE_URL;
    if (!conn) return null;
    try {
      const { Pool } = require("pg");
      return new Pool({
        connectionString: conn,
        max: Number(env.FINTECH_PG_MAX_POOL || 20),
        idleTimeoutMillis: 30000
      });
    } catch {
      return null;
    }
  }

  getRuntimeStorageMode() {
    if (this.pgPool) return "POSTGRES_PG_POOL";
    if (this.snapshotFilePath) return "DISK_ATOMIC_SNAPSHOT";
    return "IN_MEMORY_SANDBOX";
  }

  registerStateStore(name, store) {
    if (store && typeof store.exportSnapshot === "function" && typeof store.hydrateSnapshot === "function") {
      this.stateProviders.set(name, store);
    }
  }

  saveState(extra = {}) {
    if (!this.snapshotFilePath) return false;
    const bundle = {
      savedAt: new Date().toISOString(),
      stores: {},
      ...extra
    };
    for (const [name, store] of this.stateProviders.entries()) {
      bundle.stores[name] = store.exportSnapshot();
    }
    return this.saveSnapshot(bundle);
  }

  restoreState() {
    const snapshot = this.loadSnapshot();
    if (!snapshot || !snapshot.stores) return false;
    for (const [name, store] of this.stateProviders.entries()) {
      if (snapshot.stores[name] !== undefined) {
        store.hydrateSnapshot(snapshot.stores[name]);
      }
    }
    return true;
  }

  /**
   * Executes a PostgreSQL transaction bound strictly to tenant RLS context.
   * Uses `fintech_set_session_context` when `useSecureDbContext` is true so untrusted callers
   * cannot elevate `app.role = 'platform_founder'`.
   */
  async withTenantTransaction(
    tenantId,
    { role = "tenant_member", founderTokenSha256 = null, useSecureDbContext = true } = {},
    fn
  ) {
    if (this.requirePostgres && !this.pgPool) {
      throw new PersistenceUnavailableError(
        "PostgreSQL pg.Pool is required in strict/production runtime mode",
        "POSTGRES_POOL_REQUIRED"
      );
    }
    if (!this.pgPool) {
      return fn(null);
    }

    const client = await this.pgPool.connect();
    try {
      await client.query("BEGIN");
      if (useSecureDbContext) {
        await client.query(
          "SELECT fintech_set_session_context($1, $2, $3)",
          [String(tenantId || ""), String(role || "tenant_member"), founderTokenSha256]
        );
      } else {
        await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [String(tenantId || "")]);
        await client.query("SELECT set_config('app.role', $1, true)", [String(role || "tenant_member")]);
      }
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Executes parameterized upsert for a merchant with IBAN hygiene (last4 + HMAC digest).
   */
  async upsertMerchantSql(client, { merchantId, tenantId, legalName, destinationBankIban, jurisdiction = "IN" }) {
    if (!client) return null;
    const cleanIban = String(destinationBankIban || "");
    const last4 = cleanIban.slice(-4).padStart(4, "*");
    const hmacKey = process.env.FINTECH_IBAN_HMAC_KEY || "garuda_dev_iban_hmac_key";
    const ibanHmac = crypto.createHmac("sha256", hmacKey).update(cleanIban).digest("hex");

    const res = await client.query(
      `INSERT INTO fintech_merchants (
        merchant_id, tenant_id, legal_name, corporate_bank_iban,
        corporate_bank_iban_last4, corporate_bank_iban_hmac, jurisdiction
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (merchant_id) DO UPDATE SET
        legal_name = EXCLUDED.legal_name,
        updated_at = NOW()
      RETURNING merchant_id, tenant_id, legal_name, corporate_bank_iban_last4`,
      [merchantId, tenantId, legalName, `MASKED-***${last4}`, last4, ibanHmac, jurisdiction]
    );
    return res.rows?.[0] || null;
  }

  /**
   * Executes idempotent intent insertion in PostgreSQL using unique (tenant_id, idempotency_key).
   */
  async insertPaymentIntentSql(client, intent) {
    if (!client) return null;
    const res = await client.query(
      `INSERT INTO fintech_payment_intents (
        intent_id, tenant_id, merchant_id, vertical_id, idempotency_key,
        destination_bank_iban, amount_minor, currency, selected_rail,
        preferred_provider, payment_reference, status, applied_rate_bps, contract_version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
      RETURNING *`,
      [
        intent.id,
        intent.tenantId,
        intent.merchantId,
        intent.verticalId || "default",
        intent.idempotencyKey,
        `***${String(intent.destinationBankIban || "").slice(-4)}`,
        toMinorUnits(intent.amount),
        intent.currency,
        intent.selectedRail,
        intent.preferredProvider,
        intent.paymentReference,
        intent.status,
        intent.appliedRateBps,
        intent.contractVersion
      ]
    );
    return res.rows?.[0] || null;
  }

  /**
   * Executes row-locked atomic fuel debit inside active tenant transaction.
   */
  async atomicPrepaidDebitSql(client, params) {
    if (!client) return null;
    const res = await client.query(
      `SELECT fintech_atomic_prepaid_debit($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) AS closing_balance_minor`,
      [
        params.entryId,
        params.tenantId,
        params.merchantId,
        params.feeMinor,
        params.principalMinor,
        params.appliedRateBps,
        params.contractVersion,
        params.transactionId,
        params.bankSettlementRef,
        params.previousHash,
        params.entryHash
      ]
    );
    return res.rows?.[0]?.closing_balance_minor ?? null;
  }

  /**
   * Atomically persists non-secret commercial state snapshot to disk when enabled.
   */
  saveSnapshot(statePayload) {
    if (!this.snapshotFilePath) return false;
    const dir = path.dirname(this.snapshotFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${this.snapshotFilePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(statePayload, null, 2), "utf8");
    fs.renameSync(tmpPath, this.snapshotFilePath);
    return true;
  }

  loadSnapshot() {
    if (!this.snapshotFilePath || !fs.existsSync(this.snapshotFilePath)) {
      return null;
    }
    const raw = fs.readFileSync(this.snapshotFilePath, "utf8");
    return JSON.parse(raw);
  }
}

/**
 * Exact integer minor-unit (paise/cents) helper eliminating IEEE-754 floating-point drift.
 */
function toMinorUnits(majorAmount) {
  const num = Number(majorAmount);
  if (!Number.isFinite(num)) {
    throw new Error("Invalid monetary amount");
  }
  return Math.round(num * 100);
}

function fromMinorUnits(minorAmount) {
  return Math.round(Number(minorAmount)) / 100;
}

function computeBpsFeeMinor(principalMinor, rateBps) {
  const p = BigInt(Math.round(Number(principalMinor)));
  const bps = BigInt(Math.round(Number(rateBps)));
  const numer = p * bps + 5000n;
  return Number(numer / 10000n);
}

module.exports = {
  PersistenceUnavailableError,
  FintechPersistenceRepository,
  toMinorUnits,
  fromMinorUnits,
  computeBpsFeeMinor
};
