# Testing Rules

Follow `CLAUDE.md Section 26` and `LLD Section 66-68`.

## Tools
- **Unit/Integration:** Vitest
- **End-to-End:** Playwright

## Coverage Priorities
- **Journey State Machine:** Test all transitions (e.g., `BOARDED` -> `ONBOARD` -> `EXIT_RECORDED`).
- **Idempotency:** Verify that duplicate events do not create duplicate records.
- **Offline Sync:** Test the local SQLite queue and batch upload logic.
- **Exception Engine:** Verify deterministic logic for `BOARDING_MISSING`, `EXIT_MISSING`, and `WRONG_STOP_EXIT`.
- **Security:** Test RBAC roles and RLS policies for data isolation.

## Safety Path
- Automated tests are mandatory for the "Critical Safety Path" (RFID Scan -> Journey Engine -> Exception/Notification).
