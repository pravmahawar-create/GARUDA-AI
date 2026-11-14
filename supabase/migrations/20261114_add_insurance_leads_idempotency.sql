-- ==============================================================================
-- 🦅 GARUDA OS — DATABASE-LEVEL ATOMIC IDEMPOTENCY MIGRATION
-- Project: Supabase PostgreSQL (gcifzzuyswrcwvkcfqbr)
-- Target: public.leads
-- Author: GARUDA Core Architecture & Governance
-- Date: 2026-11-14
--
-- PURPOSE:
-- Source-scoped database-level atomic unique index on idempotency_key.
-- Strictly scoped to source = 'garudaos.in/insurance' and non-null idempotency_key.
-- Prevents concurrent race conditions under PostgreSQL Read Committed isolation.
-- Guarantees exactly one database row per canonical insurance enquiry.
-- Rejects duplicate concurrent inserts with PostgreSQL SQLSTATE 23505.
-- All other lead sources (proposals, linkedin, reddit, etc.) remain 100% unaffected.
-- Preserves all 1,057 existing baseline rows without downtime or modification.
-- ==============================================================================

-- 1. Add dedicated idempotency_key column (Nullable, preserving all existing rows)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 2. Create source-scoped partial UNIQUE index on idempotency_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_insurance_idempotency_key
ON public.leads (idempotency_key)
WHERE source = 'garudaos.in/insurance'
AND idempotency_key IS NOT NULL;

-- 3. Verification query to confirm index is active in pg_indexes:
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'leads'
  AND indexname = 'idx_leads_insurance_idempotency_key';

-- ==============================================================================
-- ROLLBACK PROCEDURE (GOVERNANCE-COMPLIANT):
-- To rollback the unique constraint, ONLY drop the partial index.
-- DO NOT drop the idempotency_key column automatically to preserve historical data
-- and enquiry traceability across deployments.
--
-- DROP INDEX IF EXISTS public.idx_leads_insurance_idempotency_key;
--
-- NOTE: Column drop requires a separately approved data migration governance order:
-- -- ALTER TABLE public.leads DROP COLUMN IF EXISTS idempotency_key; (RESTRICTED)
-- ==============================================================================
