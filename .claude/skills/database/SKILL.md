# Skill: Database Engineering

## Purpose
Manage the Supabase/PostgreSQL schema, ensuring tenant isolation, auditability, and geospatial integrity.

## When to use this skill
- When creating or modifying tables, views, or functions.
- When implementing Row Level Security (RLS) policies.
- When optimizing query performance or adding indexes.

## Required project context to read
- `.claude/rules/database.md`
- `LLD.md` (Sections 16, 17, 18)
- `docs/architecture-decisions.md` (ADRs 2, 5, 6, 10, 11)

## Step-by-step workflow
1. **Identify Entities:** Define table structures and relationships.
2. **Ensure Multi-Tenancy:** Every tenant-specific table must have a `school_id` — including `gps_locations` (ADR-11).
3. **Apply PostGIS:** Use `geography` or `geometry` types for location-related columns.
4. **Define Constraints:** Add FKs, UNIQUE constraints, and CHECK constraints. Enforce `UNIQUE(idempotency_key)` on `journey_events` (ADR-6). Enforce `UNIQUE(bus_id) WHERE status = 'ACTIVE'` on `rfid_devices` (ADR-10).
5. **Create Migration:** Write a SQL migration file in `supabase/migrations/`.
6. **Implement RLS:** Write policies that enforce `school_id` isolation based on the authenticated user.
7. **Audit Setup:** Ensure privileged tables have triggers or logic for `audit_logs`.

## Implementation constraints
- Use migrations for all schema changes.
- `journey_events` must be append-only.
- RLS is mandatory for all tenant-owned tables.
- Use snake_case for all SQL identifiers.
- `idempotency_key` values are UUID v7 strings (ADR-6).
- One ACTIVE RFID device per bus enforced at database level (ADR-10).

## Validation checklist
- [ ] Is there a `school_id` for tenant isolation (including `gps_locations`)?
- [ ] Is RLS enabled and tested?
- [ ] Is the migration file correctly formatted?
- [ ] Does it use appropriate spatial types and indexes?
- [ ] Is `UNIQUE(idempotency_key)` present on `journey_events`?
- [ ] Is the RFID partial unique index (`UNIQUE(bus_id) WHERE status = 'ACTIVE'`) present?

## Common mistakes to avoid
- Forgetting to enable RLS after table creation.
- Using application code to enforce tenant isolation instead of RLS.
- Modifying `journey_events` records (violating immutability).
- Omitting `school_id` from `gps_locations` (required for direct RLS — ADR-11).
- Embedding RFID device details in `buses` table instead of using `rfid_devices` table (ADR-10).

## Expected output from Claude
- A SQL migration file.
- Description of indexes and constraints added.
- RLS policy definitions.
