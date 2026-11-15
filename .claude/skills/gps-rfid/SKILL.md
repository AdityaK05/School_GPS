# Skill: GPS & RFID Integration Engineering

## Purpose
Build robust GPS provider adapters and process high-frequency RFID operational events accurately.

## When to use this skill
- When building a new GPS vendor adapter.
- When expanding the Journey Engine's RFID event validation.
- When implementing the RFID reader adapter layer.

## Required project context to read
- `.claude/rules/gps-rfid.md`
- `HLD.md` (Sections 13, 15, 17)
- `LLD.md` (Sections 27-29, 55-58)
- `docs/architecture-decisions.md` (ADRs 6, 7, 8, 9, 10, 12)

## Step-by-step workflow
1. **Develop GPS Adapter:** Implement `GPSProviderAdapter` to normalize location payloads into `NormalizedGPSLocation`.
2. **Apply Freshness (ADR-8):** Validate GPS freshness: stale if `received_at - recorded_at > gps_freshness_threshold_seconds` (default 60s). Raise `GPS_UNAVAILABLE` on staleness.
3. **Execute Geofence Check:** Use PostGIS `ST_DWithin` to generate `BUS_REACHED_STOP`. Start `EXIT_MISSING` grace period timer (default 5 minutes, configurable via `exit_missing_grace_period_seconds` — ADR-7).
4. **Develop RFID Adapter (ADR-9):** Implement `RFIDReaderAdapter` to normalize hardware output into `RFIDScan { cardId, deviceId, timestamp }`. Reader-specific protocol stays in the adapter.
5. **Ingest RFID Scans:** Validate card registration, trip status, student assignment, and duplicates.
6. **Assign Idempotency Key (ADR-6):** Use UUID v7, generated at scan creation on the device. Reuse on retries — never regenerate.
7. **Update State:** Generate the `JourneyEvent` and transition the `StudentJourneyState`.
8. **Raise Exceptions (ADR-12):** Trigger `WRONG_BUS`, `WRONG_STOP_EXIT`, or `DUPLICATE_SCAN` exceptions when appropriate.

## Implementation constraints
- Normalize all vendor GPS data via adapter.
- GPS data alone MUST NOT trigger a student exit event.
- Use UUID v7 idempotency keys for RFID events (ADR-6).
- Preserved device timestamps are mandatory for delayed offline events.
- RFID UID must not contain student PII (ADR-9).
- Freshness threshold and grace period are configurable policy values, not hard-coded constants (ADRs 7, 8).

## Validation checklist
- [ ] Is vendor GPS data properly normalized via adapter?
- [ ] Is freshness threshold read from policy configuration (not hard-coded)?
- [ ] Are idempotency keys UUID v7 format?
- [ ] Is PostGIS used for spatial calculations?
- [ ] Are canonical exception names used (`WRONG_STOP_EXIT`, not `WRONG_STOP`)?
- [ ] Is EXIT_MISSING grace period read from policy configuration?

## Common mistakes to avoid
- Automatically marking students as exited on stop reach.
- Hardcoding vendor-specific GPS payloads outside the adapter layer.
- Hardcoding freshness threshold or grace period values.
- Using `WRONG_STOP` or `MANUAL_OVERRIDE` — these are retired names (ADR-12).
- Losing original event timestamps during ingestion.
- Storing student PII in the RFID card UID.

## Expected output from Claude
- GPS Adapter class implementing `GPSProviderAdapter`.
- RFID Adapter class implementing `RFIDReaderAdapter`.
- RFID event processing logic with idempotency.
- PostGIS spatial query example for geofencing.
