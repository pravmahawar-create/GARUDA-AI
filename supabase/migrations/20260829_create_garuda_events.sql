-- 🦅 GARUDA Master Roadmap — Phase 3: State & Event Architecture
-- Migration: Create immutable `garuda_events` log table in PostgreSQL.

CREATE TABLE IF NOT EXISTS public.garuda_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_version TEXT NOT NULL DEFAULT '1.0',
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  project_id TEXT,
  proposal_id TEXT,
  lead_id TEXT,
  source TEXT NOT NULL,
  actor JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_state TEXT,
  new_state TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id TEXT,
  causation_id TEXT,
  idempotency_key TEXT UNIQUE,
  event_hash TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid event retrieval by entity, project, proposal, and time
CREATE INDEX IF NOT EXISTS idx_garuda_events_entity ON public.garuda_events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_garuda_events_project ON public.garuda_events (project_id);
CREATE INDEX IF NOT EXISTS idx_garuda_events_proposal ON public.garuda_events (proposal_id);
CREATE INDEX IF NOT EXISTS idx_garuda_events_type ON public.garuda_events (event_type);
CREATE INDEX IF NOT EXISTS idx_garuda_events_occurred_at ON public.garuda_events (occurred_at DESC);

-- Enable Supabase Realtime for garuda_events table if publications exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.garuda_events;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Best effort in case realtime is not configured
  NULL;
END $$;
