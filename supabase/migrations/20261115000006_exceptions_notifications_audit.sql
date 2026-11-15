-- Migration: 20261115000006_exceptions_notifications_audit.sql
-- Description: Phase 2 Stage 6 - Journey Exceptions, Multi-Channel Notifications & Immutable Audit Trail
-- Authoritative Sources: CLAUDE.md (§13, §21, §22), HLD.md (§18, §19, §20, §25), LLD.md (§15, §43, §44, §47, §48, §54, §58), docs/architecture-decisions.md (ADRs 2, 7, 12)
-- Depends on:
--   20261115000001_extensions_and_enums.sql (exception_type)
--   20261115000002_identity_and_tenants.sql (schools, users, update_updated_at_column)
--   20261115000003_fleet_gps_rfid.sql (buses)
--   20261115000004_routes_stops_trips.sql (trips)
--   20261115000005_students_assignments_journey_events.sql (students, journey_events)
-- Constraints: No seed data, no application secrets, no push to remote database.

-- ============================================================================
-- 1. JOURNEY EXCEPTIONS
-- ============================================================================

-- Deterministic operational safety and system discrepancies (LLD Section 15, ADR-12).
-- Exceptions are never silently resolved or converted into successful states.
-- EXIT_MISSING is raised if no exit event occurs within the 5-minute grace period (ADR-7).
-- Originating journey events (e.g. WRONG_STOP_EXIT, DUPLICATE_SCAN) are linked via event_id.
CREATE TABLE IF NOT EXISTS exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
    event_id UUID REFERENCES journey_events(id) ON DELETE SET NULL,
    type exception_type NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_reason TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_exception_resolution CHECK (
        (status IN ('RESOLVED', 'DISMISSED') AND resolved_at IS NOT NULL) OR
        (status IN ('OPEN', 'ACKNOWLEDGED') AND resolved_at IS NULL)
    )
);

-- Trigger for exceptions updated_at
DROP TRIGGER IF EXISTS trg_exceptions_updated_at ON exceptions;
CREATE TRIGGER trg_exceptions_updated_at
    BEFORE UPDATE ON exceptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. NOTIFICATIONS
-- ============================================================================

-- Multi-channel notification delivery record (LLD Section 43, HLD Section 20).
-- Recipients are authenticated users (parents, school admins, attendants).
-- Delivery channels: PUSH (FCM), WEB (Realtime), SMS, EMAIL.
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    exception_id UUID REFERENCES exceptions(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('BOARDING', 'EXIT', 'BUS_APPROACHING', 'DELAY', 'EXCEPTION')),
    channel TEXT NOT NULL DEFAULT 'PUSH' CHECK (channel IN ('PUSH', 'WEB', 'SMS', 'EMAIL')),
    delivery_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. AUDIT LOG (IMMUTABLE, APPEND-ONLY)
-- ============================================================================

-- Platform audit ledger for security, accountability, and privileged overrides (LLD Section 47).
-- Tracks actor, action, resource, and before/after payloads (e.g. MANUAL_ATTENDANCE_OVERRIDE).
-- Strictly append-only: updates and deletes are blocked at the database level.
-- school_id is nullable to support cross-tenant SUPER_ADMIN audit records.
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    before JSONB,
    after JSONB,
    reason TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to enforce strict append-only immutability on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs records are strictly immutable and append-only. Updates and deletions are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation();

-- ============================================================================
-- 4. INDEXES (Stage 6 Exceptions, Notifications & Audit Log Access Patterns)
-- ============================================================================

-- Exceptions indexes
CREATE INDEX IF NOT EXISTS idx_exceptions_school_status ON exceptions(school_id, status);
CREATE INDEX IF NOT EXISTS idx_exceptions_trip_id ON exceptions(trip_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_student_id ON exceptions(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exceptions_type ON exceptions(type);
CREATE INDEX IF NOT EXISTS idx_exceptions_open ON exceptions(school_id, trip_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_exceptions_event_id ON exceptions(event_id) WHERE event_id IS NOT NULL;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_school_id ON notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON notifications(delivery_status) WHERE delivery_status = 'PENDING';

-- Audit Logs indexes (Optimized for forensic investigation, entity history, and actor tracking)
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_created ON audit_logs(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id) WHERE actor_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) PREPARATION
-- ============================================================================

-- Enable RLS on all Stage 6 entities.
-- Full access policies will be established in the dedicated Stage 7 migration.
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
