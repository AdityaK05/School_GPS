# Security, Tenant Isolation & Compliance Guide
**School Transport Safety & Accountability Platform**

This document details the multi-tenant isolation model, Row Level Security (RLS) enforcement, authentication architecture, role-based access control (RBAC), and privacy safeguards.

---

## 1. Multi-Tenant Isolation Architecture

The platform enforces strict multi-tenancy at every architectural layer:

```
+-------------------------------------------------------------------------+
|                              SUPABASE AUTH                              |
|                       JWT Token with authenticated UID                  |
+------------------------------------+------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
|                             API & RBAC GUARD                            |
|             Resolves user schoolId & validates tenant boundary          |
+------------------------------------+------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
|                       DATABASE ROW LEVEL SECURITY                       |
|           Enforces tenant isolation directly in PostgreSQL via:         |
|           `auth_school_id()`, `auth_user_role()`, and `is_super_admin()`|
+------------------------------------+------------------------------------+
                                     │
          ┌──────────────────────────┴──────────────────────────┐
          ▼                                                     ▼
+-------------------+                                 +-------------------+
|  SCHOOL A DATA    |                                 |  SCHOOL B DATA    |
|  (Completely      |                                 |  (Completely      |
|   Isolated)       |                                 |   Isolated)       |
+-------------------+                                 +-------------------+
```

### Direct Denormalization for RLS Performance (ADR-11)
To ensure maximum query throughput and eliminate multi-table join overhead in PostgreSQL RLS policies, `school_id` is intentionally denormalized onto high-volume telemetry tables (`gps_locations`, `journey_events`, `audit_logs`). 

---

## 2. Role-Based Access Control (RBAC) Matrix

| User Role | Tenant Scope | Allowed Operations | Forbidden Operations |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Platform-wide | Cross-tenant auditing, platform infrastructure monitoring | Casual student PII modification |
| **`SCHOOL_ADMIN`** | Single School | Full administrative control of school fleet, routes, stops, and rosters | Cross-school data access |
| **`TRANSPORT_MANAGER`**| Single School | Fleet operations, live tracking, trip manifests, exception resolution | Altering school legal billing or profile |
| **`ATTENDANT`** | Single School | Active trip manifest viewing, RFID scanning, manual overrides with reason | Changing routes, deleting devices, cross-school data |
| **`DRIVER`** | Single School | Vehicle navigation, vehicle telemetry display | No mandatory touch/typing interaction while driving |
| **`PARENT`** | Authorized Children | Read-only child journey timeline, GPS freshness badge, notifications | Fleet-wide tables, cross-school data, other children |

---

## 3. Privacy & Opaque Token Architecture (ADR-9)

1. **Zero Biometrics**:
   - Biometric identifiers (fingerprints, facial recognition vectors, voice signatures) are strictly prohibited across all data ingestion and storage layers.
2. **Opaque RFID Identifiers**:
   - Physical RFID smart cards contain only high-entropy random identifiers (e.g. `CARD_TOK_ABCD_1234`).
   - Cards carry zero printed or electronically stored personal data (no student name, photo, phone number, or home address).
   - If an RFID card is lost or stolen, it is completely meaningless to an unauthorized finder and can be immediately revoked and re-bound in seconds.
3. **Parent Data Isolation**:
   - Parents can only query student data where `student_guardians` binds their Supabase user ID to that specific student.
   - Any attempt to query unlinked children or school-wide fleet telemetry returns `HTTP 403 Forbidden` (`FORBIDDEN`).

---

## 4. Key Management & Secret Hygiene

1. **Client Bundles**:
   - Web applications and mobile client builds only contain the public `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
   - The `SUPABASE_SERVICE_ROLE_KEY` is strictly classified as `SERVER_ONLY` and is never bundled in frontend code, mobile APKs, or public repositories.
2. **Dual-Timestamp Auditability**:
   - High-throughput GPS and RFID events store both the hardware-asserted timestamp (`recordedAt`) and the server reception timestamp (`receivedAt`). This prevents clock-skew tampering or replay manipulation from obscuring the true physical timeline.
