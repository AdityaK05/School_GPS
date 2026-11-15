# Security Architecture & Hardening

## 1. Threat Model & Mitigations

- **Card Cloning / Replay Attacks:**
  - 30-second deduplication debounce window.
  - Idempotency enforced via UUID v7 on all ingestion endpoints.
  - Tapping card does not prove handover; physical exit and supervisor accountability required.
- **Tenant Data Isolation:**
  - Multi-tenant school data strictly separated.
  - PostgreSQL Row Level Security (RLS) active on all 19 public tables.
  - Application RBAC guards enforce tenant boundary at API route layer.
- **DDoS & Brute Force:**
  - In-memory sliding-window token bucket rate limiter protects sensitive endpoints:
    - `/api/v1/rfid/scan`: 120 req/min per IP
    - `/api/v1/gps/events`: 300 req/min per IP
    - `/api/v1/health`: 120 req/min per IP
- **Audit Immutability:**
  - `journey_events` and `audit_logs` are protected by database triggers that raise exceptions on `UPDATE` or `DELETE`.
