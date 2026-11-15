# Security Rules

Follow `CLAUDE.md Section 13` and `docs/architecture-decisions.md` (ADRs 1, 9, 11).

## Authentication & Authorization
- **Supabase Auth:** Use standard Supabase Auth for all user sessions.
- **RBAC:** Enforce roles (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `TRANSPORT_MANAGER`, `DRIVER`, `ATTENDANT`, `PARENT`) at the backend/API layer.
- **Trust Boundaries:** Never trust the client to set roles, tenant IDs, or student associations. Verify everything on the backend.

## Data Security
- **Secrets:** Never commit API keys or secrets to the repository. Use environment variables (Supabase Edge Function secrets).
- **Sensitive Data:** Treat student and guardian info as PII. Avoid logging it in cleartext in observability tools.
- **Least Privilege:** Apply RLS policies that restrict data access to the authenticated user's `school_id` and assigned roles.
- **GPS Data Tenancy:** `gps_locations.school_id` enables direct RLS on GPS location data without join-based lookups. See ADR-11.

## RFID & Identity
- **RFID UID is an Opaque Token (ADR-9):** The RFID card UID must not contain or encode student PII. The backend maps UID to student identity; the card itself reveals nothing.
- **RFID is an Event Signal:** An RFID scan is not absolute proof of physical identity or handover. Do not use it as biometric evidence.

## AI Usage
- **Data Privacy:** Never send real student or guardian PII to external AI providers. Use synthetic data for local experimentation.
