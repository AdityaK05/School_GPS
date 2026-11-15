# Comprehensive Testing Strategy & Verification Guide
**School Transport Safety & Accountability Platform**

This guide documents the automated testing pyramid, test suites, execution commands, and scenario coverage used to validate the platform.

---

## 1. Test Architecture & Directory Structure

```
tests/
├── safety-engine.test.ts      # Domain state machine, geofences, grace periods, exceptions (15 tests)
├── api-server.test.ts         # HTTP REST endpoints, RBAC, tenant isolation, routes (7 tests)
├── frontend-surfaces.test.ts  # Client SDK, offline queue, attendant/parent UI workflows (18 tests)
└── hardware-e2e.test.ts       # Full hardware adapters, telematics lifecycle, 15 E2E scenarios (14 tests)
```

---

## 2. Running Automated Tests

```bash
# Run all automated test suites with Vitest
npm test

# Run tests in single-run mode with full reporting
npx vitest run

# Run TypeScript compiler static verification
npx tsc --noEmit
```

---

## 3. End-to-End Scenario Matrix

| Scenario | Objective | Validation Layer | Status |
| :--- | :--- | :--- | :--- |
| **1. Normal Journey** | Full lifecycle: `EXPECTED` $\rightarrow$ `BOARDED` $\rightarrow$ `ONBOARD` $\rightarrow$ `EXIT_RECORDED` $\rightarrow$ `COMPLETED` | Safety Engine + E2E | **PASS** |
| **2. Wrong Bus** | Student taps unassigned bus $\rightarrow$ raises `WRONG_BUS` critical exception | RFID Service + E2E | **PASS** |
| **3. Duplicate RFID** | Tap within 30s $\rightarrow$ `DUPLICATE_SCAN` info exception, zero state mutation | RFID Service + E2E | **PASS** |
| **4. Offline Boarding**| Offline tap $\rightarrow$ buffered in local queue $\rightarrow$ synced upon network recovery | Offline Sync Engine | **PASS** |
| **5. Offline Retry** | Duplicate retransmission with identical UUID v7 key $\rightarrow$ idempotent success | API Idempotency | **PASS** |
| **6. GPS Stale** | Telemetry age $>60\text{s}$ $\rightarrow$ device marked `OFFLINE`, `GPS_UNAVAILABLE` raised | GPS Engine + E2E | **PASS** |
| **7. GPS Recovery** | Fresh telemetry arrives $\rightarrow$ `GPS_RECOVERED` emitted, exception resolved | GPS Engine + E2E | **PASS** |
| **8. Stop Arrival** | Bus enters $75\text{m}$ geofence $\rightarrow$ `EXIT_PENDING` (not auto-exited) | Geospatial Engine | **PASS** |
| **9. Missing Exit** | 5 minutes elapse without exit tap $\rightarrow$ `EXIT_MISSING` critical exception | Grace Period Engine | **PASS** |
| **10. Wrong Stop Exit**| Exit $>150\text{m}$ from assigned stop $\rightarrow$ `WRONG_STOP_EXIT` critical exception | Geospatial Engine | **PASS** |
| **11. Manual Override**| Staff overrides attendance with mandatory justification $\rightarrow$ durable audit log | Manual Override | **PASS** |
| **12. Tenant Boundary**| School B admin denied access to School A fleet and trips (`TENANT_ACCESS_DENIED`)| RBAC Guard | **PASS** |
| **13. Parent Isolation**| Parent denied access to non-authorized student data (`FORBIDDEN`) | Parent Service | **PASS** |
| **14. RFID Replacement**| Active reader replaced $\rightarrow$ previous `DECOMMISSIONED`, 1 active reader rule enforced | Device Manager | **PASS** |
| **15. GPS Replacement** | GPS replaced $\rightarrow$ historical location stream permanently preserved | Device Manager | **PASS** |

---

## 4. Current Test Results

- Total Test Suites: **4 passing**
- Total Automated Tests: **54 passing (100% Pass Rate)**
- Compiler Status: **0 errors** (`npx tsc --noEmit`)
