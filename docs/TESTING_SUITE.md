# Testing Strategy & Test Suites

## 1. Test Suite Coverage

| Test Suite | File | Focus | Tests |
| :--- | :--- | :--- | :--- |
| **Supabase Repositories & CRUD** | `tests/supabase-integration.test.ts` | Snake_case mapping, RLS, tenant isolation | 6 |
| **FCM Push Notifications** | `tests/realtime-fcm.test.ts` | HTTP v1 format, token routing, dry-run | 5 |
| **Mobile Persistent Queue** | `tests/persistent-queue.test.ts` | Crash recovery, deduplication, retry backoff | 5 |
| **Deterministic Safety Engine** | `tests/safety-engine.test.ts` | 7-state lifecycle, transitions, grace period | 15 |
| **API Server & RBAC Guards** | `tests/api-server.test.ts` | Health, auth context, school boundary | 7 |
| **Parent Experience & Scoped Safety** | `tests/parent-portal.test.ts` | Multi-child switching, stale GPS, notifications | 5 |
| **Hardware & End-to-End Safety** | `tests/hardware-e2e.test.ts` | Telematics ingestion, card tap, cross-tenant | 14 |
| **Frontend Surfaces & Views** | `tests/frontend-surfaces.test.ts` | Admin views, manifest items, triage modals | 18 |

**Total Automated Tests:** 75 (100% Pass Rate).

## 2. Running Verification

```bash
# Typecheck
npm run typecheck

# Full Vitest Suite
npm run test:run

# End-to-End Live Trip Simulation
npm run simulate

# UI Scraper & Proxied Endpoints Audit
npm run audit:ui
```
