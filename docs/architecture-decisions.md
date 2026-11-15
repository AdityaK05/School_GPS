# Architecture Decision Record: Resolving Document Contradictions

## 1. Roles
**Conflict:** HLD defines `SUPER_ADMIN` but omits `DRIVER`. CLAUDE.md defines `DRIVER` but omits `SUPER_ADMIN`.
**Relevant Sections:** HLD (Section 6), CLAUDE.md (Section 11).
**Recommended Resolution:** Adopt a unified set: `SUPER_ADMIN`, `SCHOOL_ADMIN`, `TRANSPORT_MANAGER`, `DRIVER`, `ATTENDANT`, `PARENT`.
**Reasoning:** `SUPER_ADMIN` is essential for multi-tenant platform maintenance. `DRIVER` is essential for fleet accountability (the system tracks drivers in `Trip` entities in LLD Section 10).
**Final Rule:** The system shall support:
- `SUPER_ADMIN`: Cross-tenant platform management.
- `SCHOOL_ADMIN`: School-specific configuration and management.
- `TRANSPORT_MANAGER`: Fleet and route management.
- `DRIVER`: Vehicle operator (trackable in `Trip` entity).
- `ATTENDANT`: On-board safety and RFID event recorder.
- `PARENT`: Child transport status and location monitoring.

## 2. Exception Types
**Conflict:** HLD omits `SYNC_FAILURE` while LLD includes it.
**Relevant Sections:** HLD (Section 11), LLD (Section 15).
**Recommended Resolution:** Include `SYNC_FAILURE`. Distinguish between "Journey Exceptions" (operational issues) and "System Exceptions" (technical failures).
**Reasoning:** An exception engine needs to handle both domain failures and technical connectivity issues to ensure full auditability.
**Final Rule:** The canonical list of `JourneyException` types will include all HLD types plus `SYNC_FAILURE`. The `ExceptionEngine` must classify these as either `OPERATIONAL` or `SYSTEM` to separate business logic discrepancies from infrastructure failures.

## 3. API Design
**Conflict:** HLD suggests direct bus-specific location endpoint vs. LLD's aggregate fleet-wide endpoint.
**Relevant Sections:** HLD (Section 26), LLD (Section 42).
**Recommended Resolution:** Maintain both for different use cases. `GET /api/v1/buses/:id/location` is for precise, high-frequency bus tracking; `GET /api/v1/fleet/live` is for dashboard overview.
**Reasoning:** These endpoints solve different problems (single-bus focus vs. fleet-wide situational awareness) and are not contradictory.
**Final Rule:** `GET /api/v1/buses/:id/location` serves granular, single-vehicle tracking. `GET /api/v1/fleet/live` serves the administrative dashboard overview.

## 4. Mobile Structure
**Conflict:** LLD defines a specific directory routing structure `(auth)`, `(parent)`, `(attendant)` while HLD speaks generally of shared services.
**Relevant Sections:** LLD (Section 2), HLD (Section 5).
**Recommended Resolution:** Adopt the LLD's structure. The `(auth)`, `(parent)`, and `(attendant)` folders serve as the routing structure for a single Expo application.
**Reasoning:** The LLD structure provides the concrete implementation of the HLD's "one codebase" concept.
**Final Rule:** The mobile application is a single Expo project. The internal routing shall utilize a directory-based structure: `app/(auth)`, `app/(parent)`, and `app/(attendant)` to enforce clean operational boundaries while allowing shared services in `src/`.

## 5. Repository Structure
**Conflict:** N/A (Standardized on LLD).
**Relevant Sections:** LLD (Section 2).
**Recommended Resolution:** Authoritative layout as defined in LLD Section 2.
**Reasoning:** Provides a clear monorepo structure without microservices.
**Final Rule:** The repository structure defined in LLD Section 2 is canonical.

---

## 6. Idempotency Key Format
**Decision:** Use UUID v7 as the format for `idempotency_key` on `journey_events`.
**Relevant Sections:** CLAUDE.md (Section 6), LLD (Sections 12, 37).
**Reasoning:** UUID v7 is time-ordered (monotonically increasing), globally unique without coordination, and carries embedded timestamp information that aids debugging of delayed or reordered events. A composite string key (e.g. `ATT_001-TRIP_001-STU_001-07:12:01`) is fragile and collision-prone under clock drift or multi-device scenarios.
**Final Rule:**
- The **producer** (attendant device or server) generates the UUID v7 at the moment the event is first created.
- For offline events, the UUID v7 is generated on the attendant device at scan time and is preserved throughout the synchronization lifecycle.
- Retries of the same logical event (network retry, offline sync retry) **MUST reuse the same `idempotency_key`**. The key must never be regenerated on retry.
- The database enforces `UNIQUE(idempotency_key)` on the `journey_events` table.
- If the server receives an event whose `idempotency_key` already exists, it returns the previously-stored result without creating a duplicate record.
- The `idempotency_key` field on `JourneyEvent` is of type `string` (UUID v7 format: `xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx`).

## 7. Exit Missing Grace Period
**Decision:** Set the MVP EXIT_MISSING grace period to **5 minutes** after the assigned stop is reached.
**Relevant Sections:** CLAUDE.md (Section 21), LLD (Section 58).
**Reasoning:** An instantaneous EXIT_MISSING exception at the moment a bus enters a stop geofence would create false positives during normal operations (attendant physically verifying students, brief scan delays). A grace period allows for realistic operational latency while still protecting against genuinely missing students.
**Final Rule:**
- `EXIT_MISSING` is raised only when a student has a confirmed `STUDENT_BOARDING` event and **no** valid `STUDENT_EXIT` event exists within **5 minutes** of the system recording `BUS_REACHED_STOP` for the student's assigned stop.
- The bus reaching a stop (`BUS_REACHED_STOP`) is a **necessary condition** to begin the grace period timer, but is **not** itself evidence of a successful drop-off.
- The grace period is **configurable** via a system/school-level policy setting (e.g. `exit_missing_grace_period_seconds`), defaulting to `300` (5 minutes) for MVP.
- The grace period value must NOT be hard-coded throughout the codebase; it must be read from a central policy/configuration source.
- An `EXIT_MISSING` exception is immediately suppressible if a `MANUAL_ATTENDANCE_OVERRIDE` event is recorded before the grace period expires.

## 8. GPS Freshness Threshold
**Decision:** Set the MVP GPS freshness threshold to **60 seconds**.
**Relevant Sections:** CLAUDE.md (Section 8), HLD (Sections 15, 16), LLD (Section 38).
**Reasoning:** GPS devices can drop offline, lose satellite fix, or fail to transmit. A 60-second threshold provides a practical balance — short enough to alert operators to meaningful tracking gaps during active trips, long enough to avoid false alerts from transient transmission delays.
**Final Rule:**
- A GPS location update is considered **stale** when `server_received_at - recorded_at > 60 seconds` OR when no new update has arrived for the bus within 60 seconds of wall-clock time.
- Stale GPS triggers a `GPS_UNAVAILABLE` exception for any active trip associated with that bus.
- The threshold is **configurable** via a system/school-level policy setting (e.g. `gps_freshness_threshold_seconds`), defaulting to `60` for MVP.
- The threshold must NOT be hard-coded throughout the codebase; it must be read from a central policy/configuration source.
- Both timestamps are stored: `recorded_at` (the GPS device's own timestamp) and `received_at` (the server ingestion timestamp). These must remain separate fields to allow forensic investigation of transmission delays.
- RFID event processing continues unaffected when GPS is unavailable. GPS unavailability does not halt journey recording.

## 9. RFID Hardware and Adapter Layer
**Decision:** Specify 13.56 MHz ISO/IEC 14443-compatible readers as the MVP RFID hardware target. Introduce a formal RFID adapter boundary.
**Relevant Sections:** CLAUDE.md (Sections 20, 8), HLD (Section 13), LLD (Sections 28, 29).
**Reasoning:** 13.56 MHz HF RFID (ISO/IEC 14443) is the dominant standard for access-control and transit cards globally. Formalizing an adapter boundary prevents vendor lock-in and allows different reader hardware, BLE-bridged readers, or future NFC implementations to be supported without changing domain logic.
**Final Rule:**
- **Hardware target (MVP):** 13.56 MHz ISO/IEC 14443-A/B compatible RFID reader, connected to the attendant's mobile device.
- The core domain model is **not bound to a specific hardware vendor**. All hardware-specific logic is encapsulated in an `RFIDReaderAdapter` interface.
- The `RFIDReaderAdapter` interface normalizes reader output into a canonical `RFIDScan` event (`cardId`, `deviceId`, `timestamp`). Reader-specific protocol details do not propagate into domain logic.
- **RFID UID as token:** The RFID card UID is an opaque identifier/token only. It must NOT contain, encode, or reveal student PII. The mapping from UID to student identity is maintained exclusively in the backend database.
- **RFID is an event signal, not proof of physical handover:** An RFID scan records that a card was presented to a reader at a point in time. It does not constitute absolute proof that the specific student physically boarded or exited. This limitation must be acknowledged in the exception and audit model.
- **Offline buffering:** RFID scan events are always written to the local SQLite queue first, before any network attempt. This guarantees no event is lost due to connectivity failure.

## 10. RFID Device Cardinality
**Decision:** One active RFID reader/device per bus for MVP. Keep `rfid_devices` as a separate entity.
**Relevant Sections:** HLD (Section 8), LLD (Sections 5, 16).
**Reasoning:** Embedding the complete RFID device model directly into the `Bus` entity would prevent historical tracking of device changes and make it impossible to enforce the one-active-device constraint cleanly. A separate `rfid_devices` table with a status column and an active-device reference on `Bus` gives both operational efficiency and historical auditability.
**Final Rule:**
- `rfid_devices` is a **separate table** (not embedded in `buses`).
- The `buses` table retains an `active_rfid_device_id` nullable FK field pointing to the currently active device in `rfid_devices`. (The previous `rfidDeviceId` field is renamed to `activeRfidDeviceId` for clarity.)
- A bus may have **multiple historical records** in `rfid_devices` (decommissioned devices are retained for audit purposes).
- **Only one ACTIVE RFID device** may be assigned to a bus at any time. This is enforced by: (a) a `status` field on `rfid_devices` (`ACTIVE` | `INACTIVE` | `DECOMMISSIONED`), and (b) a **partial unique index**: `UNIQUE(bus_id) WHERE status = 'ACTIVE'`.
- The GPS device relationship follows the same pattern: `gps_devices` is a separate table; `buses.active_gps_device_id` holds the active FK.

## 11. GPS Locations Tenant Isolation
**Decision:** Add `school_id` to the `gps_locations` table and to the `GPSLocation` domain interface.
**Relevant Sections:** CLAUDE.md (Section 10), HLD (Section 23), LLD (Sections 38, 46).
**Reasoning:** While `school_id` can be derived by joining `gps_locations → buses → schools`, requiring a join for every RLS policy evaluation is a performance and security risk. Explicit denormalization of `school_id` onto `gps_locations` aligns with the platform's multi-tenancy principle (every tenant-owned record carries `school_id` directly), enables a simple, fast RLS policy, and ensures tenant isolation remains correct even if the join path changes.
**Final Rule:**
- `gps_locations` table includes a `school_id` column (non-nullable, FK to `schools`).
- `GPSLocation` domain interface includes `schoolId: string` as a required field.
- RLS policy on `gps_locations` enforces `school_id = authenticated_user_school_id`.
- The `school_id` on `gps_locations` is intentionally **denormalized** from `buses.school_id` for security and performance. It must remain consistent with the bus's school at all times. The bus assignment should not change school mid-operation.
- The `bus_id` FK is retained alongside `school_id`. Both are indexed.

## 12. Canonical Exception Taxonomy
**Decision:** Establish the following as the canonical, exhaustive list of `JourneyException` type names.
**Relevant Sections:** CLAUDE.md (Section 21), HLD (Section 11), LLD (Section 15).
**Conflict Resolved:** CLAUDE.md used `WRONG_STOP_EXIT` and `MANUAL_ATTENDANCE_OVERRIDE`; LLD/shared-types used `WRONG_STOP` and `MANUAL_OVERRIDE`. CLAUDE.md's names are more precise and are adopted as canonical.
**Final Rule — Canonical Exception Types:**

| Type | Category | Severity | Description |
| :--- | :--- | :--- | :--- |
| `BOARDING_MISSING` | OPERATIONAL | WARNING | Student on manifest; no boarding event recorded by trip end |
| `WRONG_BUS` | OPERATIONAL | CRITICAL | Student scanned on a bus not matching their assignment |
| `WRONG_STOP_EXIT` | OPERATIONAL | CRITICAL | Student exit event recorded outside authorized stop geofence |
| `EXIT_MISSING` | OPERATIONAL | CRITICAL | Confirmed boarding but no exit event within grace period |
| `GPS_UNAVAILABLE` | SYSTEM | WARNING | GPS data exceeds freshness threshold |
| `DUPLICATE_SCAN` | OPERATIONAL | INFO | Idempotent scan; no new journey state change |
| `SYNC_FAILURE` | SYSTEM | WARNING | Technical sync failure; event not yet confirmed by server |
| `MANUAL_ATTENDANCE_OVERRIDE` | OPERATIONAL | INFO | Admin or attendant manually recorded a journey state change |

- `WRONG_STOP` is **retired** as a canonical name. Use `WRONG_STOP_EXIT` exclusively.
- `MANUAL_OVERRIDE` is **retired** as a canonical name. Use `MANUAL_ATTENDANCE_OVERRIDE` exclusively.
- These names must be used consistently in: `JourneyException.type`, `JourneyEventType`, `CLAUDE.md`, `HLD.md`, `LLD.md`, rules, skills, and shared-types.

## 13. Journey State Terminology Standardisation
**Decision:** Use the precise HLD/LLD state machine terminology universally. Retire the abbreviated prose descriptions from CLAUDE.md.
**Relevant Sections:** CLAUDE.md (Section 4), HLD (Section 11), LLD (Sections 14, 30).
**Conflict Resolved:** CLAUDE.md described states as "Expected → Boarding Recorded → Onboard → Exit Recorded → Journey Completed". HLD/LLD use the precise enum names. The HLD/LLD/shared-types names are authoritative.
**Final Rule — Canonical Journey States:**

| State | Meaning |
| :--- | :--- |
| `EXPECTED` | Student is on the trip manifest; no events recorded yet |
| `BOARDING_PENDING` | Boarding process initiated but not yet confirmed |
| `BOARDED` | Valid `STUDENT_BOARDING` event recorded |
| `ONBOARD` | Student confirmed onboard; transit in progress |
| `EXIT_PENDING` | Bus has reached student's assigned stop; exit verification window open |
| `EXIT_RECORDED` | Valid `STUDENT_EXIT` event recorded |
| `COMPLETED` | Journey fully reconciled and closed |

- CLAUDE.md Section 4 must be updated to use these canonical state names.
- No abbreviated or informal state names should be used in any technical specification, rule, skill, or type definition.
- `student_journey_states.state` column uses these exact string values.

---

## Implementation Baseline (Updated)

| Feature | Decision |
| :--- | :--- |
| **Roles** | `SUPER_ADMIN`, `SCHOOL_ADMIN`, `TRANSPORT_MANAGER`, `DRIVER`, `ATTENDANT`, `PARENT` |
| **Exception Types** | Canonical set per ADR-12; `SYNC_FAILURE` classified as `SYSTEM` |
| **API Design** | Both `buses/:id/location` (granular) and `fleet/live` (dashboard) are maintained |
| **Mobile Structure** | Single Expo app using directory-based routing: `(auth)`, `(parent)`, `(attendant)` |
| **Repo Structure** | LLD Section 2 layout is authoritative |
| **Idempotency Key** | UUID v7; producer-generated at event creation; reused on retries |
| **EXIT_MISSING Grace Period** | 5 minutes (configurable via policy setting `exit_missing_grace_period_seconds`) |
| **GPS Freshness Threshold** | 60 seconds (configurable via policy setting `gps_freshness_threshold_seconds`) |
| **RFID Hardware** | 13.56 MHz ISO/IEC 14443; adapter-layer boundary; UID is opaque token |
| **RFID Cardinality** | One ACTIVE device per bus; `rfid_devices` is a separate table with partial unique index |
| **GPS Tenancy** | `school_id` explicitly on `gps_locations`; intentional denormalization for RLS |
| **Exception Taxonomy** | `WRONG_STOP_EXIT`, `MANUAL_ATTENDANCE_OVERRIDE` are canonical; aliases retired |
| **Journey State Names** | HLD/LLD enum names are canonical; CLAUDE.md abbreviated names retired |
