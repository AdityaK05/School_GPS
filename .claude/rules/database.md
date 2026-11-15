# Database Rules

Follow `LLD Section 16-18` and `docs/architecture-decisions.md` (ADRs 1–13).

## Provider & Schema
- **Supabase/PostgreSQL:** Use PostgreSQL with the PostGIS extension for all geospatial data.
- **Migrations:** All schema changes must be performed via migrations. No manual production schema edits.
- **Naming:** Use snake_case for tables and columns. Use descriptive names for constraints and indexes.

## Multi-Tenancy
- **Tenant Isolation:** Every tenant-owned table must include a `school_id` column — including `gps_locations` (see ADR-11).
- **RLS:** Row Level Security (RLS) is mandatory for all tables to prevent cross-tenant data leakage.
- **GPS Locations:** `gps_locations.school_id` is intentionally denormalized from `buses.school_id` for RLS performance and security boundary clarity. See ADR-11.

## Journey Events & Audit
- **Immutability:** `journey_events` are append-only. Never update or delete an existing event.
- **Auditability:** Log all privileged operations (e.g., manual attendance overrides) in the `audit_logs` table with `before` and `after` states.
- **Idempotency Key Format:** `idempotency_key` values are UUID v7 strings. The producer generates the key once at event creation. Retries reuse the same key. Enforce `UNIQUE(idempotency_key)` on `journey_events`. See ADR-6.

## RFID Device Cardinality
- **Separate Table:** `rfid_devices` is a separate table from `buses`. See ADR-10.
- **One Active Device:** Enforce only one ACTIVE RFID device per bus using a partial unique index: `UNIQUE(bus_id) WHERE status = 'ACTIVE'`.
- **Historical Records:** Decommissioned devices are retained in `rfid_devices` for audit. Do not delete them.
- **Bus FK:** `buses.active_rfid_device_id` holds a nullable FK to the currently active device.

## Performance
- **Indexing:** Maintain indexes on `school_id`, `trip_id`, `student_id`, and `event_timestamp`.
- **Spatial Indexing:** Use `GIST` indexes on PostGIS geometry/geography columns.
- **GPS Index:** Index `gps_locations(bus_id, recorded_at DESC)` and `gps_locations(school_id)`.
