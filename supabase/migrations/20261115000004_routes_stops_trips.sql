-- Migration: 20261115000004_routes_stops_trips.sql
-- Description: Phase 2 Stage 4 - Route Management, Deterministic Stops & Trip Execution
-- Authoritative Sources: CLAUDE.md (§9, §11), HLD.md (§9, §10, §17), LLD.md (§7, §8, §10, §16, §18, §55), docs/architecture-decisions.md (ADRs 3, 7, 8)
-- Depends on: 
--   20261115000001_extensions_and_enums.sql (postgis)
--   20261115000002_identity_and_tenants.sql (schools, users, update_updated_at_column)
--   20261115000003_fleet_gps_rfid.sql (buses)
-- Constraints: No seed data, no application secrets, no push to remote database.

-- ============================================================================
-- 1. ROUTES
-- ============================================================================

-- Reusable route definition (template) belonging to a school tenant.
-- A route defines a service trajectory (direction: MORNING or EVENING).
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('MORNING', 'EVENING')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_routes_school_code UNIQUE (school_id, code)
);

-- Trigger for routes updated_at
DROP TRIGGER IF EXISTS trg_routes_updated_at ON routes;
CREATE TRIGGER trg_routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. STOPS
-- ============================================================================

-- Designated pickup/drop-off stop along a route with PostGIS spatial point.
-- Contains an explicit geofence radius used for BUS_REACHED_STOP detection.
-- Deterministic stop ordering is strictly guaranteed by UNIQUE(route_id, sequence).
CREATE TABLE IF NOT EXISTS stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    location extensions.geography(Point, 4326),
    geofence_radius_meters INTEGER NOT NULL DEFAULT 100 CHECK (geofence_radius_meters > 0),
    sequence INTEGER NOT NULL CHECK (sequence > 0),
    expected_arrival_time TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_stops_route_sequence UNIQUE (route_id, sequence)
);

-- Trigger to auto-populate stop location geography point from latitude and longitude if not provided
CREATE OR REPLACE FUNCTION set_stop_location_point()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location IS NULL THEN
        NEW.location = extensions.ST_SetSRID(extensions.ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::extensions.geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stops_set_point ON stops;
CREATE TRIGGER trg_stops_set_point
    BEFORE INSERT OR UPDATE ON stops
    FOR EACH ROW
    EXECUTE FUNCTION set_stop_location_point();

-- Trigger for stops updated_at
DROP TRIGGER IF EXISTS trg_stops_updated_at ON stops;
CREATE TRIGGER trg_stops_updated_at
    BEFORE UPDATE ON stops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. TRIPS (JOURNEY EXECUTION)
-- ============================================================================

-- A trip is a specific operational execution of a route on a calendar date.
-- Connects a school, route, bus, driver, and attendant.
-- Lifecycle states: SCHEDULED -> STARTED -> IN_PROGRESS -> COMPLETED | CANCELLED
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    attendant_id UUID REFERENCES users(id) ON DELETE SET NULL,
    trip_date DATE NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('MORNING', 'EVENING')),
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (
        status IN ('SCHEDULED', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    ),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_trip_timing CHECK (
        (completed_at IS NULL) OR 
        (started_at IS NULL) OR 
        (completed_at >= started_at)
    )
);

-- Trigger for trips updated_at
DROP TRIGGER IF EXISTS trg_trips_updated_at ON trips;
CREATE TRIGGER trg_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- A bus cannot run multiple active/in-progress trips simultaneously
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_bus_active_concurrency
    ON trips(bus_id)
    WHERE status IN ('STARTED', 'IN_PROGRESS');

-- ============================================================================
-- 4. INDEXES (Stage 4 Route, Stop & Trip Access Patterns Only)
-- ============================================================================

-- Routes indexes
CREATE INDEX IF NOT EXISTS idx_routes_school_id ON routes(school_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);

-- Stops indexes
CREATE INDEX IF NOT EXISTS idx_stops_school_id ON stops(school_id);
CREATE INDEX IF NOT EXISTS idx_stops_route_id ON stops(route_id);
CREATE INDEX IF NOT EXISTS idx_stops_location ON stops USING GIST(location);

-- Trips indexes (Optimized for operational dashboard, date-filtered queries, and attendant manifests)
CREATE INDEX IF NOT EXISTS idx_trips_school_date ON trips(school_id, trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_bus_id ON trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_attendant_id ON trips(attendant_id) WHERE attendant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id) WHERE driver_id IS NOT NULL;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) PREPARATION
-- ============================================================================

-- Enable RLS on all Stage 4 routing and trip entities.
-- Full access policies will be applied in the dedicated Stage 7 migration.
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
