-- Migration: 20261115000005_students_assignments_journey_events.sql
-- Description: Phase 2 Stage 5 - Students, Transport Assignments, Trip Manifest, Immutable Journey Events & Materialized Journey States
-- Authoritative Sources: CLAUDE.md (§4, §5, §6, §7, §20), HLD.md (§11, §12, §13, §14), LLD.md (§4, §9, §11, §12, §13, §14, §30, §35, §37), docs/architecture-decisions.md (ADRs 6, 7, 9, 12, 13)
-- Depends on:
--   20261115000001_extensions_and_enums.sql (journey_state_type, journey_event_type)
--   20261115000002_identity_and_tenants.sql (schools, update_updated_at_column)
--   20261115000003_fleet_gps_rfid.sql (buses)
--   20261115000004_routes_stops_trips.sql (routes, stops, trips)
-- Constraints: No seed data, no application secrets, no push to remote database.

-- ============================================================================
-- 1. STUDENTS
-- ============================================================================

-- Core student record belonging to a school tenant.
-- rfid_card_id is an opaque token (UID), storing NO student PII (ADR-9).
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    admission_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    class_name TEXT,
    section TEXT,
    rfid_card_id TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_students_school_admission UNIQUE (school_id, admission_number)
);

-- Enforce that an RFID card UID cannot be actively assigned to multiple students within a school
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_school_rfid
    ON students(school_id, rfid_card_id)
    WHERE rfid_card_id IS NOT NULL;

-- Trigger for students updated_at
DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. STUDENT ROUTE ASSIGNMENTS
-- ============================================================================

-- Authoritative student transport assignment to a route and stop.
-- Assigned stop serves as the authoritative expected drop-off location (LLD Section 9).
CREATE TABLE IF NOT EXISTS student_route_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    effective_from DATE NOT NULL,
    effective_until DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_student_assignment_dates CHECK (
        (effective_until IS NULL) OR (effective_until >= effective_from)
    )
);

-- Unique index to prevent duplicate active transport assignments for a student on the same route
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_route_assignments_active
    ON student_route_assignments(student_id, route_id)
    WHERE status = 'ACTIVE';

-- Trigger for student_route_assignments updated_at
DROP TRIGGER IF EXISTS trg_student_route_assignments_updated_at ON student_route_assignments;
CREATE TRIGGER trg_student_route_assignments_updated_at
    BEFORE UPDATE ON student_route_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. TRIP STUDENT MANIFEST
-- ============================================================================

-- Operational manifest generated at trip creation/start (LLD Section 11).
-- Expected boarding and exit stops define the reconciliation targets for the trip.
CREATE TABLE IF NOT EXISTS trip_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    expected_boarding_stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE RESTRICT,
    expected_exit_stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE RESTRICT,
    boarding_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (boarding_status IN ('PENDING', 'BOARDED', 'MISSED')),
    exit_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (exit_status IN ('PENDING', 'EXITED', 'MISSING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_trip_students_trip_student UNIQUE (trip_id, student_id)
);

-- Trigger for trip_students updated_at
DROP TRIGGER IF EXISTS trg_trip_students_updated_at ON trip_students;
CREATE TRIGGER trg_trip_students_updated_at
    BEFORE UPDATE ON trip_students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. JOURNEY EVENTS (IMMUTABLE, APPEND-ONLY)
-- ============================================================================

-- Authoritative event log for student journey reconciliation (LLD Section 12, 13).
-- Strictly append-only: updates and deletes are rejected at the database level.
-- Idempotency key uses UUID v7 format; retries reuse the key without duplicate insertion (ADR-6).
-- Dual timestamps preserve device clock vs server ingestion time (ADR-8).
CREATE TABLE IF NOT EXISTS journey_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
    event_type journey_event_type NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,
    server_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    latitude DOUBLE PRECISION CHECK (latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)),
    longitude DOUBLE PRECISION CHECK (longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)),
    source TEXT NOT NULL CHECK (source IN ('RFID', 'GPS', 'ATTENDANT', 'ADMIN', 'SYSTEM')),
    device_id TEXT,
    idempotency_key TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'SYNCED' CHECK (sync_status IN ('PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_journey_events_idempotency UNIQUE (idempotency_key)
);

-- Trigger to enforce strict append-only immutability on journey_events
CREATE OR REPLACE FUNCTION prevent_journey_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'journey_events records are strictly immutable and append-only. Updates and deletions are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journey_events_immutable ON journey_events;
CREATE TRIGGER trg_journey_events_immutable
    BEFORE UPDATE OR DELETE ON journey_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_journey_event_mutation();

-- ============================================================================
-- 5. STUDENT JOURNEY STATES (MATERIALIZED CURRENT STATE)
-- ============================================================================

-- Materialized current journey state for fast UI dashboard and parent app queries (LLD Section 14).
-- Historical truth resides in journey_events; this table reflects the reconciled snapshot.
-- Uses the canonical journey_state_type ENUM established in ADR-13.
CREATE TABLE IF NOT EXISTS student_journey_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    state journey_state_type NOT NULL DEFAULT 'EXPECTED',
    last_event_id UUID REFERENCES journey_events(id) ON DELETE SET NULL,
    boarding_at TIMESTAMPTZ,
    exit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_student_journey_states_trip_student UNIQUE (trip_id, student_id)
);

-- Trigger for student_journey_states updated_at
DROP TRIGGER IF EXISTS trg_student_journey_states_updated_at ON student_journey_states;
CREATE TRIGGER trg_student_journey_states_updated_at
    BEFORE UPDATE ON student_journey_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. INDEXES (Stage 5 Students, Manifest & Journey Events Only)
-- ============================================================================

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Student Route Assignments indexes
CREATE INDEX IF NOT EXISTS idx_student_route_assignments_school_id ON student_route_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_student_route_assignments_student_id ON student_route_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_route_assignments_route_id ON student_route_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_student_route_assignments_stop_id ON student_route_assignments(stop_id);

-- Trip Students (Manifest) indexes
CREATE INDEX IF NOT EXISTS idx_trip_students_trip_id ON trip_students(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_students_student_id ON trip_students(student_id);
CREATE INDEX IF NOT EXISTS idx_trip_students_school_id ON trip_students(school_id);
CREATE INDEX IF NOT EXISTS idx_trip_students_boarding_status ON trip_students(boarding_status);
CREATE INDEX IF NOT EXISTS idx_trip_students_exit_status ON trip_students(exit_status);

-- Journey Events indexes (Optimized for audit trail, trip replay, and event ordering)
CREATE INDEX IF NOT EXISTS idx_journey_events_trip_id ON journey_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_student_id ON journey_events(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journey_events_school_id ON journey_events(school_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_timestamp ON journey_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_journey_events_event_type ON journey_events(event_type);
CREATE INDEX IF NOT EXISTS idx_journey_events_sync_status ON journey_events(sync_status) WHERE sync_status != 'SYNCED';

-- Student Journey States indexes (Optimized for real-time dashboard and parent status queries)
CREATE INDEX IF NOT EXISTS idx_student_journey_states_trip_id ON student_journey_states(trip_id);
CREATE INDEX IF NOT EXISTS idx_student_journey_states_student_id ON student_journey_states(student_id);
CREATE INDEX IF NOT EXISTS idx_student_journey_states_school_id ON student_journey_states(school_id);
CREATE INDEX IF NOT EXISTS idx_student_journey_states_state ON student_journey_states(state);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) PREPARATION
-- ============================================================================

-- Enable RLS on all Stage 5 student, assignment, manifest, and journey tables.
-- Full policies will be established in the dedicated Stage 7 migration.
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_journey_states ENABLE ROW LEVEL SECURITY;
