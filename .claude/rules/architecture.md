# Architecture Rules

Follow `CLAUDE.md` and `docs/architecture-decisions.md` (ADRs 1–13) as the primary authorities.

## Core Pattern
- **Modular Monolith:** Maintain clear module boundaries (Identity, School, Fleet, Trip, Journey, Notification) even within the unified backend.
- **Event-Driven Core:** Use `journey_events` as the authoritative source of truth for student journeys. Events are append-only and immutable.
- **No Microservices:** Do not introduce distributed services unless explicitly authorized by a new ADR.

## Repository & Dependencies
- **LLD Structure:** Follow the monorepo layout defined in `LLD Section 2` (canonical per ADR-5).
- **Shared Packages:** Place domain types, Zod schemas, and shared utilities in `packages/`.
- **Dependency Direction:** Follow the hierarchy: Identity -> School -> Domain (Student/Fleet/Route) -> Operational (Trip/Journey) -> Utility (Exception/Notification/Audit).

## Adapter Boundaries
- **GPS Adapter:** Vendor-specific GPS logic is encapsulated in `GPSProviderAdapter` implementations. Domain logic receives only `NormalizedGPSLocation`.
- **RFID Adapter (ADR-9):** Hardware-specific RFID reader logic is encapsulated in `RFIDReaderAdapter` implementations. Domain logic receives only canonical `RFIDScan { cardId, deviceId, timestamp }`.

## Canonical Terminology
- **Exception Types (ADR-12):** Use `WRONG_STOP_EXIT` (not `WRONG_STOP`) and `MANUAL_ATTENDANCE_OVERRIDE` (not `MANUAL_OVERRIDE`) throughout.
- **Journey States (ADR-13):** Use `EXPECTED`, `BOARDING_PENDING`, `BOARDED`, `ONBOARD`, `EXIT_PENDING`, `EXIT_RECORDED`, `COMPLETED` as the canonical state names.

## Service Layer
- **Separation of Concerns:** Business logic must reside in domain services, not in API handlers or database triggers.
- **Repository Pattern:** Abstract database access behind repository interfaces to keep business logic testable.
