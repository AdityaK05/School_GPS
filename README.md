# School Transport Safety & Accountability Platform

A production-grade, multi-tenant platform designed for school bus safety, real-time telemetry reconciliation, attendance verification, exception detection, and operational accountability.

---

## 1. Product Overview

The **School Transport Safety & Accountability Platform** provides deterministic, auditable tracking for K-12 school transportation.

### Core Capabilities
- **Deterministic Journey Lifecycle**: Real-time state machine tracking students through canonical states:
  $$\text{EXPECTED} \rightarrow \text{BOARDING\_PENDING} \rightarrow \text{BOARDED} \rightarrow \text{ONBOARD} \rightarrow \text{EXIT\_PENDING} \rightarrow \text{EXIT\_RECORDED} \rightarrow \text{COMPLETED}$$
- **Contactless 13.56 MHz RFID Verification**: ISO/IEC 14443 Type A/B compliant smart card ingestion. Uses high-entropy opaque tokens without storing or transmitting student PII on physical cards.
- **Sub-60-Second GPS Telemetry & Freshness Monitoring**: Real-time GPS stream evaluation classifying vehicles as `LIVE` ($\le 60\text{s}$), `STALE` ($> 60\text{s}$), or `UNAVAILABLE`.
- **Geospatial Geofencing & Stop Arrival**: Automated stop detection with a strict architectural guarantee: **bus reaching a stop never automatically marks a student as exited**.
- **Automated Exception Detection Engine**: Real-time detection across 8 canonical exception types (`WRONG_BUS`, `EXIT_MISSING`, `WRONG_STOP_EXIT`, `GPS_UNAVAILABLE`, `BOARDING_MISSING`, `DUPLICATE_SCAN`, `SYNC_FAILURE`, `MANUAL_ATTENDANCE_OVERRIDE`).
- **Offline-First Attendant Resilience**: SQLite local queue manager with UUID v7 idempotency keys ensuring zero scan loss during cellular blackouts.
- **Strict Multi-Tenant Isolation & Zero Biometrics**: Complete database Row Level Security (RLS) enforcement preventing cross-school data leakage. Biometric data is strictly prohibited.

---

## 2. Monorepo Structure

```
School_GPS/
├── apps/
│   ├── api/                  # Core Safety Engine HTTP REST Server & Domain Services
│   ├── admin-web/            # School Administrator Operations Web Portal
│   └── mobile/               # Mobile Attendant & Parent Application Workflows
├── packages/
│   ├── client-sdk/           # Typed API Client, Realtime Manager & Offline Sync Engine
│   ├── constants/            # Canonical Enums, Event Types, and Thresholds
│   ├── shared-types/         # Authoritative TypeScript Domain Interfaces & Types
│   ├── utils/                # UUID v7, Haversine Geofencing, Logger & ApiResponse
│   └── validation/           # Zod Ingestion & Configuration Schemas
├── supabase/
│   └── migrations/           # PostgreSQL Migrations 001 through 007
├── docs/                     # Production Deployment, Operations, Security & Testing Guides
└── tests/                    # Vitest Test Suites (54 tests, 100% pass rate)
```

---

## 3. Quick Start & Local Development

### Prerequisites
- Node.js 20.x or higher
- npm 9.x or higher
- (Optional) Docker or Supabase CLI for local database execution

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd School_GPS

# Install workspace dependencies
npm install --ignore-scripts
```

### Environment Configuration
```bash
# Copy the environment template
cp .env.example .env
```
Configure your `.env` placeholders:
- `PORT=3000`
- `NODE_ENV=development`
- `SUPABASE_URL=https://your-project.supabase.co`
- `SUPABASE_ANON_KEY=your_anon_key`

---

## 4. Running the Platform

### Running Automated Test Suites
```bash
# Run complete test suite (54 tests)
npm test

# Run tests with single-pass reporter
npx vitest run

# Run TypeScript static verification across all packages
npx tsc --noEmit
```

### Starting the Core Safety Engine API
```bash
# Launch the API server locally on port 3000
npm run start:api
```

---

## 5. Hardware Integration & Simulators

The platform features a vendor-independent device abstraction layer supporting enterprise GPS units (e.g. Teltonika AVL) and 13.56 MHz RFID readers.

For testing in non-vehicle environments, deterministic simulators are provided in `apps/api/src/domain/hardware/simulators/`:
- **`GPSSimulator`**: Simulates live coordinate movement, stale telemetry ($>60\text{s}$), recovery events, and malformed coordinate packets.
- **`RFIDSimulator`**: Simulates boarding taps, exit taps, duplicate taps ($<30\text{s}$), wrong bus taps, and offline queuing.

---

## 6. Documentation References

For exhaustive documentation, refer to the guides in the `docs/` directory:
- [Deployment Guide](file:///d:/School_GPS/docs/deployment.md): Topology, environment variables, migration sequence, and rollbacks.
- [Operations Runbook](file:///d:/School_GPS/docs/operations.md): Daily trip lifecycle, exception resolution, and manual overrides.
- [Security & Tenant Isolation](file:///d:/School_GPS/docs/security.md): RLS architecture, RBAC matrix, and opaque token security.
- [Hardware Integration Guide](file:///d:/School_GPS/docs/hardware-integration.md): GPS protocols, RFID standards, and simulator usage.
- [Testing Strategy](file:///d:/School_GPS/docs/testing.md): Automated testing pyramid and 15 end-to-end scenario specifications.
- [Architecture Decisions (ADRs)](file:///d:/School_GPS/docs/architecture-decisions.md): Formal rationale for ADR-1 through ADR-13.
