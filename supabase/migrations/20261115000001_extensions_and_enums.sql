-- Migration: 20261115000001_extensions_and_enums.sql
-- Description: Phase 2 Stage 1 - Required PostgreSQL extensions and core domain ENUMs
-- Authoritative Sources: CLAUDE.md, HLD.md, LLD.md, docs/architecture-decisions.md (ADRs 1, 6, 7, 8, 9, 10, 11, 12, 13)
-- Constraints: Deterministic, idempotent, non-destructive. No tables, no RLS, no indexes, no seed data.

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- Enable PostGIS in the 'extensions' schema for geospatial types and operations
-- (ST_DWithin, geography points, geofencing for stops and bus locations).
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- ============================================================================
-- 2. CORE DOMAIN ENUMS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- user_role_type
-- Canonical roles established in ADR-1 (merging HLD and CLAUDE.md).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
        CREATE TYPE user_role_type AS ENUM (
            'SUPER_ADMIN',
            'SCHOOL_ADMIN',
            'TRANSPORT_MANAGER',
            'DRIVER',
            'ATTENDANT',
            'PARENT'
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- journey_state_type
-- Canonical student journey state lifecycle per ADR-13 and LLD Section 14/30.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'journey_state_type') THEN
        CREATE TYPE journey_state_type AS ENUM (
            'EXPECTED',
            'BOARDING_PENDING',
            'BOARDED',
            'ONBOARD',
            'EXIT_PENDING',
            'EXIT_RECORDED',
            'COMPLETED'
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- journey_event_type
-- Canonical immutable operational event types per ADR-12 and LLD Section 12.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'journey_event_type') THEN
        CREATE TYPE journey_event_type AS ENUM (
            'TRIP_STARTED',
            'TRIP_COMPLETED',
            'STUDENT_BOARDING',
            'STUDENT_EXIT',
            'BUS_LOCATION_UPDATE',
            'BUS_REACHED_STOP',
            'GPS_OFFLINE',
            'GPS_RECOVERED',
            'DUPLICATE_RFID_SCAN',
            'MANUAL_ATTENDANCE_OVERRIDE'
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- exception_type
-- Canonical exception taxonomy per ADR-12 and LLD Section 15.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exception_type') THEN
        CREATE TYPE exception_type AS ENUM (
            'BOARDING_MISSING',
            'WRONG_BUS',
            'WRONG_STOP_EXIT',
            'EXIT_MISSING',
            'GPS_UNAVAILABLE',
            'DUPLICATE_SCAN',
            'SYNC_FAILURE',
            'MANUAL_ATTENDANCE_OVERRIDE'
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- device_status_type
-- Hardware operational and lifecycle states for GPS devices (LLD Section 6)
-- and RFID readers (ADR-10 and LLD Section 8).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_status_type') THEN
        CREATE TYPE device_status_type AS ENUM (
            'ONLINE',
            'OFFLINE',
            'UNKNOWN',
            'ACTIVE',
            'INACTIVE',
            'DECOMMISSIONED'
        );
    END IF;
END $$;
