-- ============================================================================
-- GARUDA FINTECH — POSTGRESQL MIGRATION 001 (PART 5 + PART 6 ARCHITECTURE)
-- Zero-Custody Multi-Rail Orchestration + 2% Commercial Revenue & Protection
-- Spec: GARUDA-FINTECH-SPEC-V2.0 + Part 5 (#1-#6) + Part 6 (6.1-6.8)
--
-- CONSTITUTIONAL INVARIANTS ENFORCED AT SCHEMA LEVEL:
--   1. ZERO CUSTOMER WALLET / POOLED ESCROW TABLES ALLOWED.
--   2. Prepaid software credits are strictly isolated SaaS consideration.
--   3. Audit logs & prepaid credit ledgers are append-only (UPDATE/DELETE blocked).
--   4. Multi-tenant Row-Level Security enforced via app.current_tenant_id.
--   5. Unique idempotency constraints prevent duplicate accruals & invoices.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Shared immutability trigger for append-only audit & ledger tables
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fintech_prevent_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'FINTECH_IMMUTABLE_RECORD: UPDATE and DELETE are prohibited on %', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- PART 5: CORE ZERO-CUSTODY ORCHESTRATION TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fintech_merchants (
  merchant_id               TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,
  legal_name                TEXT NOT NULL,
  corporate_bank_iban       TEXT NOT NULL,
  corporate_ifsc_or_bic     TEXT,
  jurisdiction              TEXT NOT NULL DEFAULT 'IN',
  status                    TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ACCOUNT_FROZEN', 'OFFBOARDED')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fintech_merchants_tenant ON fintech_merchants(tenant_id);

CREATE TABLE IF NOT EXISTS fintech_virtual_accounts (
  van_id                    TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,
  merchant_id               TEXT NOT NULL REFERENCES fintech_merchants(merchant_id),
  vertical_id               TEXT NOT NULL DEFAULT 'default',
  provider_id               TEXT NOT NULL,
  van_identifier            TEXT NOT NULL UNIQUE,
  currency                  CHAR(3) NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CLOSED', 'QUARANTINED')),
  expires_at                TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fintech_vans_tenant_merchant ON fintech_virtual_accounts(tenant_id, merchant_id);

CREATE TABLE IF NOT EXISTS fintech_payment_intents (
  intent_id                 TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,
  merchant_id               TEXT NOT NULL REFERENCES fintech_merchants(merchant_id),
  vertical_id               TEXT NOT NULL DEFAULT 'default',
  idempotency_key           TEXT NOT NULL,
  destination_bank_iban     TEXT NOT NULL,
  amount_minor              BIGINT NOT NULL CHECK (amount_minor > 0),
  currency                  CHAR(3) NOT NULL,
  selected_rail             TEXT NOT NULL,
  preferred_provider        TEXT NOT NULL,
  payment_reference         TEXT NOT NULL,
  provider_tx_id            TEXT UNIQUE,
  bank_settlement_ref       TEXT,
  status                    TEXT NOT NULL,
  applied_rate_bps          INT NOT NULL DEFAULT 200 CHECK (applied_rate_bps > 0 AND applied_rate_bps <= 10000),
  contract_version          TEXT,
  van_id                    TEXT REFERENCES fintech_virtual_accounts(van_id),
  settled_at                TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fintech_intent_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_fintech_intents_tenant_status ON fintech_payment_intents(tenant_id, merchant_id, status);

CREATE TABLE IF NOT EXISTS fintech_webhook_nonces (
  nonce_key                 TEXT PRIMARY KEY,
  provider_id               TEXT NOT NULL,
  received_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at                TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS fintech_forensic_audit_logs (
  seq_id                    BIGSERIAL PRIMARY KEY,
  event_id                  TEXT NOT NULL UNIQUE,
  tenant_id                 TEXT NOT NULL,
  transaction_id            TEXT NOT NULL,
  actor                     TEXT NOT NULL DEFAULT 'SYSTEM',
  action                    TEXT NOT NULL,
  old_state                 TEXT NOT NULL DEFAULT 'NONE',
  new_state                 TEXT NOT NULL,
  payload_hash              CHAR(64) NOT NULL,
  provider_reference        TEXT,
  previous_hash             CHAR(64) NOT NULL,
  chain_hash                CHAR(64) NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fintech_audit_tx ON fintech_forensic_audit_logs(tenant_id, transaction_id);

DROP TRIGGER IF EXISTS trg_fintech_audit_immutable ON fintech_forensic_audit_logs;
CREATE TRIGGER trg_fintech_audit_immutable
  BEFORE UPDATE OR DELETE ON fintech_forensic_audit_logs
  FOR EACH ROW EXECUTE FUNCTION fintech_prevent_mutation();

-- ----------------------------------------------------------------------------
-- PART 6: COMMERCIAL AGREEMENTS, 2% FUEL TANK (MODE A) & POSTPAID PROTECTION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fintech_commercial_agreements (
  contract_id               TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,
  merchant_id               TEXT NOT NULL REFERENCES fintech_merchants(merchant_id),
  contract_version          TEXT NOT NULL,
  billing_mode              TEXT NOT NULL CHECK (billing_mode IN ('PREPAID', 'POSTPAID')),
  commission_rate_bps       INT NOT NULL DEFAULT 200 CHECK (commission_rate_bps > 0 AND commission_rate_bps <= 10000),
  eligible_tx_definition    TEXT NOT NULL,
  daily_reporting_deadline  TEXT NOT NULL,
  payment_deadline_days     INT NOT NULL DEFAULT 1,
  refund_adjustment_method  TEXT NOT NULL,
  tax_treatment             TEXT NOT NULL DEFAULT 'GST_18_B2B',
  tax_rate_bps              INT NOT NULL DEFAULT 1800,
  sac_code                  TEXT NOT NULL DEFAULT '998313',
  audit_rights_clause       TEXT NOT NULL,
  dispute_procedure         TEXT NOT NULL,
  termination_clause        TEXT NOT NULL,
  data_retention_years      INT NOT NULL DEFAULT 8,
  governing_jurisdiction    TEXT NOT NULL DEFAULT 'Raipur / Chhattisgarh / India',
  dispute_resolution        TEXT NOT NULL,
  founder_approved          BOOLEAN NOT NULL DEFAULT FALSE,
  founder_approved_by       TEXT,
  founder_approved_at       TIMESTAMPTZ,
  status                    TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED_ACTIVE', 'SUSPENDED', 'TERMINATED')),
  rate_history              JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fintech_merchant_contract_version UNIQUE (tenant_id, merchant_id, contract_version)
);

CREATE INDEX IF NOT EXISTS idx_fintech_agreements_active ON fintech_commercial_agreements(tenant_id, merchant_id, status);

CREATE TABLE IF NOT EXISTS fintech_prepaid_fuel_tanks (
  merchant_id                   TEXT PRIMARY KEY REFERENCES fintech_merchants(merchant_id),
  tenant_id                     TEXT NOT NULL,
  currency                      CHAR(3) NOT NULL DEFAULT 'INR',
  balance_minor                 BIGINT NOT NULL DEFAULT 0,
  pending_usage_minor           BIGINT NOT NULL DEFAULT 0,
  low_balance_threshold_minor   BIGINT NOT NULL DEFAULT 1000000,
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fintech_prepaid_credit_ledger (
  entry_id                  TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,
  merchant_id               TEXT NOT NULL REFERENCES fintech_merchants(merchant_id),
  entry_type                TEXT NOT NULL CHECK (entry_type IN ('TOP_UP', 'SETTLEMENT_DEBIT', 'REFUND_CREDIT', 'REVERSAL_CREDIT', 'PENDING_HOLD')),
  opening_balance_minor     BIGINT NOT NULL,
  amount_minor              BIGINT NOT NULL CHECK (amount_minor > 0),
  closing_balance_minor     BIGINT NOT NULL,
  eligible_principal_minor  BIGINT NOT NULL DEFAULT 0,
  applied_rate_bps          INT NOT NULL DEFAULT 200,
  contract_version          TEXT,
  transaction_id            TEXT,
  bank_settlement_ref       TEXT,
  invoice_ref               TEXT,
  previous_hash             CHAR(64) NOT NULL,
  entry_hash                CHAR(64) NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fintech_fuel_ledger_merchant ON fintech_prepaid_credit_ledger(tenant_id, merchant_id, created_at);

DROP TRIGGER IF EXISTS trg_fintech_fuel_ledger_immutable ON fintech_prepaid_credit_ledger;
CREATE TRIGGER trg_fintech_fuel_ledger_immutable
  BEFORE UPDATE OR DELETE ON fintech_prepaid_credit_ledger
  FOR EACH ROW EXECUTE FUNCTION fintech_prevent_mutation();

CREATE TABLE IF NOT EXISTS fintech_postpaid_receivables (
  commission_id             TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,
  merchant_id               TEXT NOT NULL REFERENCES fintech_merchants(merchant_id),
  transaction_id            TEXT NOT NULL,
  bank_settlement_ref       TEXT NOT NULL,
  settlement_date           DATE NOT NULL,
  currency                  CHAR(3) NOT NULL DEFAULT 'INR',
  eligible_principal_minor  BIGINT NOT NULL CHECK (eligible_principal_minor > 0),
  applied_rate_bps          INT NOT NULL DEFAULT 200 CHECK (applied_rate_bps > 0),
  contract_version          TEXT NOT NULL,
  commission_fee_minor      BIGINT NOT NULL CHECK (commission_fee_minor >= 0),
  tax_amount_minor          BIGINT NOT NULL DEFAULT 0,
  total_receivable_minor    BIGINT NOT NULL CHECK (total_receivable_minor >= 0),
  paid_amount_minor         BIGINT NOT NULL DEFAULT 0 CHECK (paid_amount_minor >= 0),
  adjustment_status         TEXT NOT NULL DEFAULT 'NONE',
  adjustment_delta_minor    BIGINT NOT NULL DEFAULT 0,
  invoice_id                TEXT,
  status                    TEXT NOT NULL DEFAULT 'ACCRUED' CHECK (
    status IN ('ACCRUED', 'RECONCILED', 'INVOICED', 'PAYMENT_PENDING', 'PAID', 'DISPUTED', 'REFUND_ADJUSTMENT_PENDING', 'OVERDUE', 'LEGAL_REVIEW')
  ),
  frozen_account_flagged    BOOLEAN NOT NULL DEFAULT FALSE,
  freeze_record_id          TEXT,
  record_hash               CHAR(64) NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fintech_commission_tx_ref UNIQUE (tenant_id, transaction_id, bank_settlement_ref)
);

CREATE INDEX IF NOT EXISTS idx_fintech_receivables_merchant_date ON fintech_postpaid_receivables(tenant_id, merchant_id, settlement_date, status);

CREATE TABLE IF NOT EXISTS fintech_daily_commission_statements (
  statement_id              TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,
  merchant_id               TEXT NOT NULL REFERENCES fintech_merchants(merchant_id),
  statement_date            DATE NOT NULL,
  currency                  CHAR(3) NOT NULL DEFAULT 'INR',
  tx_count                  INT NOT NULL DEFAULT 0,
  eligible_principal_minor  BIGINT NOT NULL DEFAULT 0,
  gross_commission_minor    BIGINT NOT NULL DEFAULT 0,
  adjustment_delta_minor    BIGINT NOT NULL DEFAULT 0,
  net_commission_minor      BIGINT NOT NULL DEFAULT 0,
  tax_amount_minor          BIGINT NOT NULL DEFAULT 0,
  total_payable_minor       BIGINT NOT NULL DEFAULT 0,
  statement_hash            CHAR(64) NOT NULL,
  hmac_signature            TEXT NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fintech_daily_statement UNIQUE (tenant_id, merchant_id, statement_date)
);

CREATE TABLE IF NOT EXISTS fintech_commission_invoices (
  invoice_id                TEXT PRIMARY KEY,
  invoice_number            TEXT NOT NULL UNIQUE,
  tenant_id                 TEXT NOT NULL,
  merchant_id               TEXT NOT NULL REFERENCES fintech_merchants(merchant_id),
  statement_id              TEXT NOT NULL REFERENCES fintech_daily_commission_statements(statement_id),
  billing_date              DATE NOT NULL,
  currency                  CHAR(3) NOT NULL DEFAULT 'INR',
  subtotal_minor            BIGINT NOT NULL,
  gst_amount_minor          BIGINT NOT NULL DEFAULT 0,
  total_amount_minor        BIGINT NOT NULL,
  paid_amount_minor         BIGINT NOT NULL DEFAULT 0,
  sac_code                  TEXT NOT NULL DEFAULT '998313',
  due_date                  DATE NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'INVOICED' CHECK (
    status IN ('INVOICED', 'PAYMENT_PENDING', 'PAID', 'DISPUTED', 'OVERDUE', 'LEGAL_REVIEW')
  ),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fintech_daily_invoice UNIQUE (tenant_id, merchant_id, billing_date)
);

CREATE TABLE IF NOT EXISTS fintech_commission_payments (
  payment_record_id         TEXT PRIMARY KEY,
  invoice_id                TEXT NOT NULL REFERENCES fintech_commission_invoices(invoice_id),
  tenant_id                 TEXT NOT NULL,
  merchant_id               TEXT NOT NULL REFERENCES fintech_merchants(merchant_id),
  amount_minor              BIGINT NOT NULL CHECK (amount_minor > 0),
  payment_reference         TEXT NOT NULL,
  payer_corporate_account   TEXT NOT NULL,
  verified_receipt          BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by               TEXT,
  verified_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fintech_commission_payment_ref UNIQUE (tenant_id, payment_reference)
);

CREATE TABLE IF NOT EXISTS fintech_dispute_freeze_records (
  freeze_id                 TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,
  merchant_id               TEXT NOT NULL REFERENCES fintech_merchants(merchant_id),
  authority_or_bank         TEXT NOT NULL,
  order_reference           TEXT NOT NULL,
  scope                     TEXT NOT NULL CHECK (scope IN ('LIEN_CAPPED', 'TOTAL_FREEZE', 'COURT_ORDER', 'CYBER_NOTICE')),
  disputed_amount_minor     BIGINT NOT NULL DEFAULT 0,
  affected_tx_ids           JSONB NOT NULL DEFAULT '[]'::jsonb,
  unaffected_tx_ids         JSONB NOT NULL DEFAULT '[]'::jsonb,
  flagged_invoice_ids       JSONB NOT NULL DEFAULT '[]'::jsonb,
  preserved_receivable_minor BIGINT NOT NULL DEFAULT 0,
  legal_notices             JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- STRICT MULTI-TENANT ROW-LEVEL SECURITY (POSTGRESQL RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE fintech_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_virtual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_forensic_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_commercial_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_prepaid_fuel_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_prepaid_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_postpaid_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_daily_commission_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_commission_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintech_dispute_freeze_records ENABLE ROW LEVEL SECURITY;

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
    'fintech_dispute_freeze_records'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS rls_tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY rls_tenant_isolation ON %I USING (tenant_id = current_setting(''app.current_tenant_id'', true) OR current_setting(''app.role'', true) = ''platform_founder'')',
      t
    );
  END LOOP;
END $$;

COMMIT;
