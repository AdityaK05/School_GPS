-- Migration: 20261115000003_fleet_gps_rfid.sql
-- Description: Phase 2 Stage 3 - Fleet Management, GPS Devices, GPS Locations & RFID Devices
-- Authoritative Sources: CLAUDE.md (§8, §20), HLD.md (§8, §13, §15), LLD.md (§5, §6, §16, §27, §38), docs/architecture-decisions.md (ADRs 8, 9, 10, 11)
-- Depends on: 20261115000001_extensions_and_enums.sql (postgis, device_status_type), 20261115000002_identity_and_tenants.sql (schools)
-- Constraints: No seed data, no application secrets, no push to remote database.

-- ============================================================================
-- 1. BUSES (FLEET)
-- ============================================================================

-- School bus fleet entity. Belongs to a school tenant.
-- Devices (GPS and RFID) are linked via nullable active foreign keys to allow
-- independent device provisioning and historical retention without circular locks.
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    registration_number TEXT NOT NULL,
    fleet_number TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'INACTIVE')),
    
    -- Nullable FKs to currently active devices (constraints added below after device tables exist)
    active_gps_device_id UUID,
    active_rfid_device_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_buses_school_registration UNIQUE (school_id, registration_number),
    CONSTRAINT uq_buses_school_fleet_number UNIQUE (school_id, fleet_number)
);

-- Trigger for buses updated_at
DROP TRIGGER IF EXISTS trg_buses_updated_at ON buses;
CREATE TRIGGER trg_buses_updated_at
    BEFORE UPDATE ON buses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. GPS DEVICES
-- ============================================================================

-- Vendor-agnostic GPS device tracking entity.
-- Normalized location data is handled by provider adapters before ingestion.
-- A bus can have historical GPS devices, but only one active tracking unit.
CREATE TABLE IF NOT EXISTS gps_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_device_id TEXT NOT NULL,
    status device_status_type NOT NULL DEFAULT 'UNKNOWN' CHECK (status IN ('ONLINE', 'OFFLINE', 'UNKNOWN')),
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_gps_devices_provider_device UNIQUE (provider, external_device_id)
);

-- ============================================================================
-- 3. RFID DEVICES
-- ============================================================================

-- Dedicated RFID reader device entity (ADR-10).
-- 13.56 MHz ISO/IEC 14443-A/B compatible hardware target (ADR-9).
-- Contains NO student PII; reader is an opaque event capture device.
CREATE TABLE IF NOT EXISTS rfid_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    hardware_model TEXT,
    protocol TEXT NOT NULL DEFAULT 'ISO_14443_A' CHECK (protocol IN ('ISO_14443_A', 'ISO_14443_B', 'OTHER')),
    status device_status_type NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DECOMMISSIONED')),
    serial_number TEXT,
    activated_at TIMESTAMPTZ,
    decommissioned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce EXACTLY ONE ACTIVE RFID device per bus at any time (ADR-10).
-- Historical/decommissioned devices remain in the table for full auditability.
CREATE UNIQUE INDEX IF NOT EXISTS idx_rfid_devices_active_bus
    ON rfid_devices(bus_id)
    WHERE status = 'ACTIVE';

-- ============================================================================
-- 4. ACTIVE DEVICE FOREIGN KEYS (ON BUSES)
-- ============================================================================

-- Attach foreign keys for active devices on buses table now that device tables exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_buses_active_gps_device'
    ) THEN
        ALTER TABLE buses
            ADD CONSTRAINT fk_buses_active_gps_device
            FOREIGN KEY (active_gps_device_id)
            REFERENCES gps_devices(id)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_buses_active_rfid_device'
    ) THEN
        ALTER TABLE buses
            ADD CONSTRAINT fk_buses_active_rfid_device
            FOREIGN KEY (active_rfid_device_id)
            REFERENCES rfid_devices(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 5. GPS LOCATIONS (HISTORICAL RAW)
-- ============================================================================

-- Historical raw GPS telemetry stream (LLD Section 38).
-- school_id is intentionally denormalized from buses.school_id to enforce direct,
-- zero-join Row Level Security and maximum query throughput (ADR-11).
-- Dual timestamps preserve device clock vs server ingestion time (ADR-8).
CREATE TABLE IF NOT EXISTS gps_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    location extensions.geography(Point, 4326),
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION CHECK (heading IS NULL OR (heading >= 0.0 AND heading <= 360.0)),
    accuracy DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-populate location geography point from latitude and longitude if not provided
CREATE OR REPLACE FUNCTION set_gps_location_point()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location IS NULL THEN
        NEW.location = extensions.ST_SetSRID(extensions.ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::extensions.geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gps_locations_set_point ON gps_locations;
CREATE TRIGGER trg_gps_locations_set_point
    BEFORE INSERT OR UPDATE ON gps_locations
    FOR EACH ROW
    EXECUTE FUNCTION set_gps_location_point();

-- ============================================================================
-- 6. INDEXES (Stage 3 Fleet, GPS & RFID Access Patterns Only)
-- ============================================================================

-- Buses indexes
CREATE INDEX IF NOT EXISTS idx_buses_school_id ON buses(school_id);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_active_gps ON buses(active_gps_device_id) WHERE active_gps_device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buses_active_rfid ON buses(active_rfid_device_id) WHERE active_rfid_device_id IS NOT NULL;

-- GPS Devices indexes
CREATE INDEX IF NOT EXISTS idx_gps_devices_bus_id ON gps_devices(bus_id);
CREATE INDEX IF NOT EXISTS idx_gps_devices_school_id ON gps_devices(school_id);

-- RFID Devices indexes
CREATE INDEX IF NOT EXISTS idx_rfid_devices_bus_id ON rfid_devices(bus_id);
CREATE INDEX IF NOT EXISTS idx_rfid_devices_school_id ON rfid_devices(school_id);
CREATE INDEX IF NOT EXISTS idx_rfid_devices_status ON rfid_devices(status);

-- GPS Locations indexes (High frequency query patterns: latest position & time-range)
CREATE INDEX IF NOT EXISTS idx_gps_locations_bus_recorded ON gps_locations(bus_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_locations_school_id ON gps_locations(school_id);
CREATE INDEX IF NOT EXISTS idx_gps_locations_spatial ON gps_locations USING GIST(location);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) PREPARATION
-- ============================================================================

-- Enable RLS on all Stage 3 fleet and device tables.
-- Full policies will be established in the dedicated Stage 7 migration.
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;
