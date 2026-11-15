# Mobile Rules

Follow `LLD Section 2, 35` and `ADR Section 4`.

## Application Structure
- **Unified Expo App:** Maintain one codebase for both Parent and Attendant experiences.
- **Routing:** Use Expo Router directory groups: `app/(auth)`, `app/(parent)`, and `app/(attendant)`.

## Offline-First
- **Local Storage:** Use SQLite for local event caching.
- **Sync Engine:** 
  - Store all RFID scans locally with `sync_status = PENDING`.
  - Maintain original `device_timestamp` for all events.
  - Implement an exponential backoff strategy for retries when connectivity is restored.
- **Conflict Handling:** Use the server's event ingestion endpoint to handle deduplication via `idempotency_key`.

## Operational Reliability
- **UX:** Prioritize fast, simple, and readable interfaces for the attendant. Avoid heavy animations.
- **Feedback:** Provide immediate, clear feedback for scans (Success/Duplicate/Error).
