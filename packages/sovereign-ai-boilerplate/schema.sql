-- ==============================================================================
-- 🦅 GARUDA SOVEREIGN AI STARTER KIT - SUPABASE POSTGRESQL SCHEMA
-- Multi-Tenant WhatsApp Lead Intake, Medical/Business Triage & Milestone Escrow
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Triage Leads Table
CREATE TABLE IF NOT EXISTS triage_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(32) NOT NULL,
    name VARCHAR(128),
    channel VARCHAR(32) DEFAULT 'whatsapp',
    category VARCHAR(64) DEFAULT 'general_consult',
    urgency VARCHAR(32) DEFAULT 'normal', -- 'emergency', 'urgent', 'normal', 'low'
    intent_summary TEXT,
    symptoms_or_notes TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(32) DEFAULT 'new', -- 'new', 'triaged', 'appointment_booked', 'converted', 'closed'
    assigned_to VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_triage_leads_phone ON triage_leads(phone);
CREATE INDEX IF NOT EXISTS idx_triage_leads_status ON triage_leads(status);
CREATE INDEX IF NOT EXISTS idx_triage_leads_urgency ON triage_leads(urgency);

-- 3. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES triage_leads(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_mins INTEGER DEFAULT 30,
    status VARCHAR(32) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'rescheduled', 'cancelled'
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id);

-- 4. Milestone Orders (50/50 Escrow Revenue Engine)
CREATE TABLE IF NOT EXISTS milestone_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(128) UNIQUE NOT NULL,
    lead_id UUID REFERENCES triage_leads(id) ON DELETE SET NULL,
    customer_email VARCHAR(256),
    customer_phone VARCHAR(32),
    total_amount NUMERIC(12, 2) NOT NULL,
    milestone_percentage INTEGER NOT NULL DEFAULT 50, -- 50% upfront, 50% on delivery
    amount_due NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'INR',
    gateway VARCHAR(32) DEFAULT 'razorpay', -- 'razorpay', 'stripe'
    status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    payment_id VARCHAR(128),
    signature VARCHAR(256),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON milestone_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON milestone_orders(status);

-- 5. Audit Events Ledger (100% Truth Law & Compliance)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128),
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);

-- 6. Row Level Security Policies (RLS)
ALTER TABLE triage_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Allow public service role full access
CREATE POLICY service_role_all_triage ON triage_leads FOR ALL USING (true);
CREATE POLICY service_role_all_appointments ON appointments FOR ALL USING (true);
CREATE POLICY service_role_all_orders ON milestone_orders FOR ALL USING (true);
CREATE POLICY service_role_all_audit ON audit_events FOR ALL USING (true);
