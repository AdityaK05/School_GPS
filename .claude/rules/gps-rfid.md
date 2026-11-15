# GPS & RFID Integration Rules

Follow `HLD Section 13, 15` and `LLD Section 27-29`. See ADRs 7, 8, 9, 10, 12.

## GPS Integration
- **Adapter Layer:** Abstract vendor-specific GPS payloads into a `NormalizedGPSLocation` format before feeding them into the processing pipeline.
- **Geofencing:** Use PostGIS functions (e.g., `ST_DWithin`) to compute stop arrivals and generate `BUS_REACHED_STOP` events.
- **Location Freshness (ADR-8):** A GPS update is considered stale when `server_received_at - recorded_at > 60 seconds` OR when no new update arrives within 60 seconds. Stale GPS triggers a `GPS_UNAVAILABLE` exception. The threshold is configurable via `gps_freshness_threshold_seconds` policy setting.
- **Dual Timestamps:** Always store both `recorded_at` (device timestamp) and `received_at` (server ingestion timestamp). Never overwrite the original device timestamp.
- **Tenant Field:** `gps_locations` includes `school_id` for direct RLS enforcement. See ADR-11.

## RFID Processing
- **Hardware (ADR-9):** MVP targets 13.56 MHz ISO/IEC 14443-A/B compatible readers. All reader-specific logic is encapsulated in an `RFIDReaderAdapter` interface. Domain logic receives only a canonical `RFIDScan { cardId, deviceId, timestamp }`.
- **UID as Token:** The RFID card UID is an opaque identifier. It must NOT contain or encode student PII.
- **Scan Validation:** Validate scans against the trip manifest. Check for:
  - Valid student assignment
  - Correct bus assignment → `WRONG_BUS` exception
  - Correct stop exit → `WRONG_STOP_EXIT` exception (ADR-12)
  - Duplicate scans → `DUPLICATE_SCAN` exception
- **Idempotency (ADR-6):** Use UUID v7 as the `idempotencyKey`. Generated once at scan time. Never regenerated on retry.
- **No Automatic Exits:** Never mark a student as exited because the bus entered a geofence. A `STUDENT_EXIT` RFID event is always required.
- **EXIT_MISSING Grace Period (ADR-7):** `EXIT_MISSING` is raised 5 minutes after `BUS_REACHED_STOP` for the student's assigned stop, if no valid exit event exists. Grace period is configurable via `exit_missing_grace_period_seconds`.
- **RFID is an Event Signal:** An RFID scan records that a card was presented at a point in time. It is not absolute proof of physical handover. Exceptions and audit logs reflect this limitation.
