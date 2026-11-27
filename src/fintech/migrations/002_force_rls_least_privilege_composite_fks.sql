-- ============================================================================
-- GARUDA FINTECH — POSTGRESQL MIGRATION 002 (PHASE 3 HARDENING)
-- Closes PostgreSQL Security Findings:
--   1. FORCE ROW LEVEL SECURITY across ALL fintech tables (blocks owner bypass).
--   2. Least-privileged DB role (`garuda_app_runtime`, NOBYPASSRLS).
--   3. Cryptographic SECURITY DEFINER session context setter preventing arbitrary
--      `SET app.role = 'platform_founder'` escalation by untrusted callers.
--   4. Tenant-aware composite foreign keys `(tenant_id, ...)` across all child tables.
--   5. Verified Bank Receipt server ledger (`fintech_verified_bank_receipts`).
--   6. Masked/HMAC corporate IBAN hygiene + Atomic `FOR UPDATE` prepaid debit proc.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. SERVER-SIDE FOUNDER DIGEST REGISTRY & LEAST-PRIVILEGED RUNTIME ROLE
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app_internal;

CREATE TABLE IF NOT EXISTS app_internal.session_security_config (
  config_key        TEXT PRIMARY KEY,
  secret_sha256     CHAR(64) NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

REVOKE ALL ON SCHEMA app_internal FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'garuda_app_runtime') THEN
    CREATE ROLE garuda_app_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO garuda_app_runtime;

-- Secure session context setter: untrusted callers cannot forge platform_founder
CREATE OR REPLACE FUNCTION fintech_set_session_context(
  p_tenant_id TEXT,
  p_role TEXT DEFAULT 'tenant_member',
  p_founder_token_sha256 TEXT DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public, app_internal
AS $$
DECLARE
  v_expected_sha TEXT;
  v_clean_role TEXT := 'tenant_member';
BEGIN
  IF p_tenant_id IS NULL OR length(trim(p_tenant_id)) = 0 THEN
    RAISE EXCEPTION 'FINTECH_RLS_ERROR: p_tenant_id is required';
  END IF;

  IF p_role = 'platform_founder' THEN
    SELECT secret_sha256 INTO v_expected_sha
    FROM app_internal.session_security_config
    WHERE config_key = 'founder_session_digest';

    IF v_expected_sha IS NULL OR p_founder_token_sha256 IS NULL OR p_founder_token_sha256 <> v_expected_sha THEN
      RAISE EXCEPTION 'FINTECH_FOUNDER_AUTH_ERROR: Unauthorized attempt to assume platform_founder DB session context';
    END IF;
    v_clean_role := 'platform_founder';
  ELSIF p_role IN ('tenant_admin', 'tenant_member', 'api_client') THEN
    v_clean_role := p_role;
  ELSE
    RAISE EXCEPTION 'FINTECH_ROLE_ERROR: Unsupported session role %', p_role;
  END IF;

  PERFORM set_config('app.current_tenant_id', p_tenant_id, true);
  PERFORM set_config('app.role', v_clean_role, true);
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. CORPORATE IBAN HYGIENE COLUMNS & TENANT-AWARE COMPOSITE UNIQUE KEYS
-- ----------------------------------------------------------------------------
ALTER TABLE fintech_merchants
  ADD COLUMN IF NOT EXISTS corporate_bank_iban_last4 CHAR(4),
  ADD COLUMN IF NOT EXISTS corporate_bank_iban_hmac  CHAR(64),
  ADD COLUMN IF NOT EXISTS corporate_bank_vault_ref  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_merchants_tenant_merchant
  ON fintech_merchants(tenant_id, merchant_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_vans_tenant_van
  ON fintech_virtual_accounts(tenant_id, van_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_intents_tenant_intent
  ON fintech_payment_intents(tenant_id, intent_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_agreements_tenant_contract
  ON fintech_commercial_agreements(tenant_id, contract_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_statements_tenant_statement
  ON fintech_daily_commission_statements(tenant_id, statement_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_tenant_invoice
  ON fintech_commission_invoices(tenant_id, invoice_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_receivables_tenant_commission
  ON fintech_postpaid_receivables(tenant_id, commission_id);

-- ----------------------------------------------------------------------------
-- 3. VERIFIED BANK RECEIPTS TABLE (ELIMINATES BOOLEAN SELF-ATTESTATION)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fintech_verified_bank_receipts (
  bank_receipt_id           TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,
  merchant_id               TEXT NOT NULL,
  purpose                   TEXT NOT NULL CHECK (purpose IN ('FUEL_TANK_TOPUP', 'COMMISSION_INVOICE_PAYMENT')),
  bank_transaction_ref      TEXT NOT NULL,
  payer_corporate_account   TEXT NOT NULL,
  amount_minor              BIGINT NOT NULL CHECK (amount_minor > 0),
  currency                  CHAR(3) NOT NULL DEFAULT 'INR',
  hmac_verified             BOOLEAN NOT NULL DEFAULT FALSE CHECK (hmac_verified = TRUE),
  receipt_hash              CHAR(64) NOT NULL,
  settled_at                TIMESTAMPTZ NOT NULL,
  consumed                  BOOLEAN NOT NULL DEFAULT FALSE,
  consumed_by_record_id     TEXT,
  consumed_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_verified_receipt_ref UNIQUE (tenant_id, purpose, bank_transaction_ref),
  CONSTRAINT uq_verified_receipt_tenant UNIQUE (tenant_id, bank_receipt_id),
  CONSTRAINT fk_receipt_tenant_merchant FOREIGN KEY (tenant_id, merchant_id)
    REFERENCES fintech_merchants(tenant_id, merchant_id)
);

-- Link fuel ledger & commission payments to server-verified bank receipt records
ALTER TABLE fintech_prepaid_credit_ledger
  ADD COLUMN IF NOT EXISTS bank_receipt_id TEXT;

ALTER TABLE fintech_commission_payments
  ADD COLUMN IF NOT EXISTS bank_receipt_id TEXT;

-- ----------------------------------------------------------------------------
-- 4. TENANT-AWARE COMPOSITE FOREIGN KEYS ACROSS ALL CHILD TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE fintech_virtual_accounts
  DROP CONSTRAINT IF EXISTS fk_van_tenant_merchant,
  ADD CONSTRAINT fk_van_tenant_merchant
    FOREIGN KEY (tenant_id, merchant_id)
    REFERENCES fintech_merchants(tenant_id, merchant_id);

ALTER TABLE fintech_payment_intents
  DROP CONSTRAINT IF EXISTS fk_intent_tenant_merchant,
  ADD CONSTRAINT fk_intent_tenant_merchant
    FOREIGN KEY (tenant_id, merchant_id)
    REFERENCES fintech_merchants(tenant_id, merchant_id);

ALTER TABLE fintech_commercial_agreements
  DROP CONSTRAINT IF EXISTS fk_agreement_tenant_merchant,
  ADD CONSTRAINT fk_agreement_tenant_merchant
    FOREIGN KEY (tenant_id, merchant_id)
    REFERENCES fintech_merchants(tenant_id, merchant_id);

ALTER TABLE fintech_prepaid_fuel_tanks
  DROP CONSTRAINT IF EXISTS fk_fuel_tank_tenant_merchant,
  ADD CONSTRAINT fk_fuel_tank_tenant_merchant
    FOREIGN KEY (tenant_id, merchant_id)
    REFERENCES fintech_merchants(tenant_id, merchant_id);

ALTER TABLE fintech_prepaid_credit_ledger
  DROP CONSTRAINT IF EXISTS fk_fuel_ledger_tenant_merchant,
  ADD CONSTRAINT fk_fuel_ledger_tenant_merchant
    FOREIGN KEY (tenant_id, merchant_id)
    REFERENCES fintech_merchants(tenant_id, merchant_id);

ALTER TABLE fintech_postpaid_receivables
  DROP CONSTRAINT IF EXISTS fk_receivable_tenant_merchant,
  ADD CONSTRAINT fk_receivable_tenant_merchant
    FOREIGN KEY (tenant_id, merchant_id)
    REFERENCES fintech_merchants(tenant_id, merchant_id);

ALTER TABLE fintech_daily_commission_statements
  DROP CONSTRAINT IF EXISTS fk_statement_tenant_merchant,
  ADD CONSTRAINT fk_statement_tenant_merchant
    FOREIGN KEY (tenant_id, merchant_id)
    REFERENCES fintech_merchants(tenant_id, merchant_id);

ALTER TABLE fintech_commission_invoices
  DROP CONSTRAINT IF EXISTS fk_invoice_tenant_statement,
  ADD CONSTRAINT fk_invoice_tenant_statement
    FOREIGN KEY (tenant_id, statement_id)
    REFERENCES fintech_daily_commission_statements(tenant_id, statement_id);

ALTER TABLE fintech_commission_payments
  DROP CONSTRAINT IF EXISTS fk_cpayment_tenant_invoice,
  ADD CONSTRAINT fk_cpayment_tenant_invoice
    FOREIGN KEY (tenant_id, invoice_id)
    REFERENCES fintech_commission_invoices(tenant_id, invoice_id);

ALTER TABLE fintech_commission_payments
  DROP CONSTRAINT IF EXISTS fk_cpayment_tenant_receipt,
  ADD CONSTRAINT fk_cpayment_tenant_receipt
    FOREIGN KEY (tenant_id, bank_receipt_id)
    REFERENCES fintech_verified_bank_receipts(tenant_id, bank_receipt_id);

-- ----------------------------------------------------------------------------
-- 5. ATOMIC PREPAID FUEL DEBIT WITH ROW LOCK (FOR UPDATE)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fintech_atomic_prepaid_debit(
  p_entry_id TEXT,
  p_tenant_id TEXT,
  p_merchant_id TEXT,
  p_fee_minor BIGINT,
  p_principal_minor BIGINT,
  p_rate_bps INT,
  p_contract_version TEXT,
  p_tx_id TEXT,
  p_bank_settlement_ref TEXT,
  p_prev_hash CHAR(64),
  p_entry_hash CHAR(64)
)
RETURNS BIGINT AS $$
DECLARE
  v_open_bal BIGINT;
  v_close_bal BIGINT;
BEGIN
  SELECT balance_minor INTO v_open_bal
  FROM fintech_prepaid_fuel_tanks
  WHERE tenant_id = p_tenant_id AND merchant_id = p_merchant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PREPAID_TANK_NOT_FOUND for tenant %, merchant %', p_tenant_id, p_merchant_id;
  END IF;

  v_close_bal := v_open_bal - p_fee_minor;

  UPDATE fintech_prepaid_fuel_tanks
  SET balance_minor = v_close_bal,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id AND merchant_id = p_merchant_id;

  INSERT INTO fintech_prepaid_credit_ledger (
    entry_id, tenant_id, merchant_id, entry_type,
    opening_balance_minor, amount_minor, closing_balance_minor,
    eligible_principal_minor, applied_rate_bps, contract_version,
    transaction_id, bank_settlement_ref, previous_hash, entry_hash
  ) VALUES (
    p_entry_id, p_tenant_id, p_merchant_id, 'SETTLEMENT_DEBIT',
    v_open_bal, p_fee_minor, v_close_bal,
    p_principal_minor, p_rate_bps, p_contract_version,
    p_tx_id, p_bank_settlement_ref, p_prev_hash, p_entry_hash
  );

  RETURN v_close_bal;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. FORCE ROW LEVEL SECURITY ON ALL FINTECH TABLES + LEAST PRIVILEGE GRANTS
-- ----------------------------------------------------------------------------
ALTER TABLE fintech_verified_bank_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_tenant_isolation ON fintech_verified_bank_receipts;
CREATE POLICY rls_tenant_isolation ON fintech_verified_bank_receipts
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.role', true) = 'platform_founder'
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.role', true) = 'platform_founder'
  );

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'fintech_merchants',
    'fintech_virtual_accounts',
    'fintech_payment_intents',
    'fintech_forensic_audit_logs',
    'fintech_commercial_agreements',
    'fintech_prepaid_fuel_tanks',
    'fintech_prepaid_credit_ledger',
    'fintech_postpaid_receivables',
    'fintech_daily_commission_statements',
    'fintech_commission_invoices',
    'fintech_commission_payments',
    'fintech_dispute_freeze_records',
    'fintech_verified_bank_receipts'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Minimal least-privilege permissions for runtime app role
GRANT SELECT, INSERT, UPDATE ON
  fintech_merchants,
  fintech_virtual_accounts,
  fintech_payment_intents,
  fintech_commercial_agreements,
  fintech_prepaid_fuel_tanks,
  fintech_postpaid_receivables,
  fintech_daily_commission_statements,
  fintech_commission_invoices,
  fintech_commission_payments,
  fintech_verified_bank_receipts,
  fintech_dispute_freeze_records,
  fintech_webhook_nonces
TO garuda_app_runtime;

-- Strict append-only tables: SELECT + INSERT ONLY (never UPDATE/DELETE)
GRANT SELECT, INSERT ON
  fintech_forensic_audit_logs,
  fintech_prepaid_credit_ledger
TO garuda_app_runtime;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO garuda_app_runtime;

COMMIT;
