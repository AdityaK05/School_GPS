# School Transport Safety & Accountability Platform

## 1. Project Mission

Build a production-oriented, multi-tenant SaaS platform for school transportation safety and accountability.

The platform combines:

- GPS bus location
- RFID student boarding/exit events
- Route and stop assignments
- Trip manifests
- Student journey state
- Exception detection
- School administration
- Attendant operations
- Parent visibility
- Notifications
- Audit and reconciliation

The core product concept is **Journey Reconciliation**.

The system must answer:

1. Where is the bus?
2. Which students are expected on the journey?
3. Which students have actually boarded?
4. Which students have exited?
5. Was the exit recorded at the authorized stop?
6. Which journeys/events remain unresolved?
7. Can the school audit what happened later?

This is **not merely a GPS tracking system** and **not merely an RFID attendance system**.

---

# 2. Architecture Principles

Use a **modular monolith with an event-driven core**.

Do NOT introduce microservices unless explicitly requested.

Primary architecture:

- Admin Web: React + TypeScript + Vite
- Mobile: React Native + Expo
- Backend: Supabase
- Database: PostgreSQL + PostGIS
- Shared packages: TypeScript
- State/query management: TanStack Query + Zustand
- Validation: Zod
- UI: Tailwind CSS + shadcn/ui
- Offline mobile storage: SQLite
- Maps/geospatial: PostGIS + approved map provider
- Testing: Vitest + Playwright

The architecture must remain modular even though the initial deployment is a monolith.

---

# 3. Core Domain Model

Core entities include:

- School
- User
- Guardian
- Student
- RFID Card
- Bus
- GPS Device
- Driver
- Attendant
- Route
- Stop
- Trip
- Trip Manifest
- Journey
- Journey Event
- Exception
- Notification
- Audit Event

Important relationships must remain explicit.

A student belongs to a school.

A student may have an assigned RFID identifier.

A bus belongs to a school.

A trip references a bus, route and operational date/time.

A trip has an expected student manifest.

Journey events record what actually happened.

---

# 4. Journey State

The primary student journey lifecycle is:

EXPECTED
→ BOARDING_PENDING
→ BOARDED
→ ONBOARD
→ EXIT_PENDING
→ EXIT_RECORDED
→ COMPLETED

See `docs/architecture-decisions.md` ADR-13 for canonical state definitions.

Possible exception states include:

- BOARDING_MISSING
- WRONG_BUS
- WRONG_STOP_EXIT
- EXIT_MISSING
- GPS_UNAVAILABLE
- DUPLICATE_SCAN
- SYNC_FAILURE
- MANUAL_ATTENDANCE_OVERRIDE

See `docs/architecture-decisions.md` ADR-12 for canonical exception taxonomy.

Do not infer that a student exited merely because:

- the bus reached a stop
- the bus entered a geofence
- the trip ended
- GPS stopped
- another student exited

A bus reaching a stop is NOT proof that every assigned student exited.

---

# 5. Event-Driven Design

Journey events are append-only and auditable.

Examples:

- BUS_TRIP_STARTED
- BUS_TRIP_COMPLETED
- BUS_LOCATION_UPDATE
- STUDENT_BOARDING
- STUDENT_EXIT
- GPS_DEVICE_OFFLINE
- WRONG_STOP_EXIT
- MANUAL_ATTENDANCE_OVERRIDE

Events must contain sufficient metadata to reconstruct what happened.

Do not mutate historical events to represent a correction.

Corrections must create new auditable events or explicit correction records.

---

# 6. Idempotency

All externally generated operational events must be processed idempotently.

Duplicate RFID scans, GPS messages, retries and network retransmissions must not create duplicate logical events.

Every ingestible event must have a deterministic idempotency key.

Idempotency keys use **UUID v7** format. The producer generates the key once at event creation. Retries reuse the same key — never regenerate it. See `docs/architecture-decisions.md` ADR-6.

Never assume network delivery occurs exactly once.

Design for:

- retries
- duplicates
- delayed events
- reordered events
- offline synchronization

---

# 7. Offline-First Mobile

The Attendant application must operate when connectivity is unavailable.

Offline events must:

1. Be recorded locally.
2. Preserve their original event timestamp.
3. Receive a unique local event identifier.
4. Enter a synchronization queue.
5. Synchronize when connectivity returns.
6. Be safely deduplicated by the backend.
7. Preserve auditability.

Never discard an operational RFID event simply because the network is unavailable.

Do not silently overwrite conflicting event history.

Conflict resolution must be explicit and deterministic.

---

# 8. GPS Integration

GPS providers must be isolated behind adapters.

The core system must consume a normalized GPS representation rather than provider-specific payloads.

Conceptually:

GPS Provider
→ Provider Adapter
→ Normalized Location Event
→ Core Event Processing
→ Journey/Trip State

Never spread vendor-specific GPS logic throughout the application.

GPS data may vary in:

- timestamp format
- coordinate format
- device identifiers
- update frequency
- connectivity status
- payload structure
- accuracy
- latency

The normalization layer must account for these differences.

---

# 9. Geospatial Rules

Use PostGIS for authoritative geospatial operations.

Important concepts include:

- bus location
- stop coordinates
- route geometry
- stop geofences
- distance calculations
- route deviation
- location freshness

Do not use arbitrary client-side distance calculations as the authoritative source for safety-critical decisions.

GPS freshness and accuracy must be considered when evaluating location-dependent events.

MVP freshness threshold: **60 seconds** (configurable via `gps_freshness_threshold_seconds`). A location update older than this threshold is considered stale for real-time safety monitoring. See `docs/architecture-decisions.md` ADR-8.

---

# 10. Multi-Tenancy

The system is multi-tenant.

`school_id` must be treated as a fundamental tenant boundary.

Every school-owned record must have an appropriate tenant relationship.

Supabase Row Level Security must enforce tenant isolation.

Never rely solely on frontend filtering for authorization.

A user must never be able to access another school's:

- students
- guardians
- buses
- trips
- GPS data
- journey events
- reports
- notifications
- audit records

---

# 11. Authentication & Authorization

Use Supabase Auth.

Authorization must be role-based.

Initial roles may include:

- SCHOOL_ADMIN
- TRANSPORT_MANAGER
- ATTENDANT
- DRIVER
- PARENT

Role permissions must be explicitly defined.

Parents must only access their own children's information.

Operational staff must only access resources belonging to their authorized school.

Do not implement authorization solely through UI hiding.

Backend/database authorization is mandatory.

---

# 12. Data Validation

Use Zod for application-boundary validation.

Validate:

- API input
- external GPS payloads
- RFID events
- authentication-related payloads
- form submissions
- configuration
- synchronization payloads

Never trust external input.

Database constraints must complement application-level validation.

---

# 13. Security

Security is a first-class requirement.

Never:

- commit secrets
- hardcode API keys
- expose Supabase service-role credentials to clients
- expose private credentials in mobile applications
- bypass RLS for convenience
- log sensitive student information unnecessarily
- send real student/guardian data to arbitrary AI providers

Use synthetic data during development and testing.

Student and guardian information must be treated as sensitive.

Location information must be protected.

Audit security-sensitive operations.

---

# 14. Privacy

The system handles information relating to school students and transportation.

Minimize collected data.

Collect only what is required for the product.

Do not use biometrics unless explicitly introduced as a future requirement.

RFID identifies the assigned card/event identity; it must not be treated as biometric proof of identity or handover.

Do not expose unnecessary personal information through RFID cards.

---

# 15. AI Policy

AI is NOT a required component of the core safety engine.

Do not introduce AI merely because the project is an AI-enabled development workflow.

Core safety decisions must remain deterministic and explainable.

Examples:

- RFID event processing → deterministic
- Student journey state → deterministic
- Stop validation → deterministic
- Exception detection → deterministic
- Tenant authorization → deterministic

AI may be considered later for non-critical functionality such as:

- operational analytics
- report summarization
- anomaly investigation assistance
- support tooling

AI must never silently replace deterministic safety rules.

---

# 16. Backend Architecture

Prefer a modular backend structure.

Conceptual modules:

- Identity
- School Management
- Student Management
- Fleet Management
- Route Management
- Trip Management
- RFID/Event Ingestion
- GPS Integration
- Journey Engine
- Exception Engine
- Notification Engine
- Reporting
- Audit

Modules should have clear responsibilities.

Avoid circular dependencies.

Do not create giant controllers/services containing unrelated business logic.

---

# 17. Database Principles

PostgreSQL is the authoritative operational database.

Use migrations for schema changes.

Never manually modify production schema without a migration.

Use:

- foreign keys
- unique constraints
- check constraints
- indexes
- appropriate timestamps
- tenant-aware indexes
- PostGIS types/functions where appropriate

Historical operational events must remain auditable.

Do not delete historical safety events simply to simplify application logic.

---

# 18. Database Performance

Design indexes according to real query patterns.

Pay particular attention to:

- school_id
- trip_id
- student_id
- bus_id
- event timestamp
- event type
- GPS timestamps
- geospatial queries

Do not prematurely introduce Redis or additional infrastructure.

Measure before optimizing.

Avoid expensive PostGIS queries inside high-frequency request paths when unnecessary.

---

# 19. Mobile Architecture

The mobile application must prioritize operational reliability.

The attendant workflow must be:

- fast
- simple
- readable
- usable under poor connectivity
- resistant to accidental duplicate actions

Avoid unnecessary animations.

Avoid complex navigation for critical operational workflows.

The driver should not be expected to perform distracting interactions while driving.

Where possible, operational RFID workflows should be designed around the attendant.

---

# 20. RFID Rules

RFID is used for student journey event recording.

MVP RFID hardware target: **13.56 MHz ISO/IEC 14443-A/B** compatible readers. All reader-specific logic is encapsulated in an `RFIDReaderAdapter` interface. The RFID card UID is an opaque token and must NOT contain student PII. RFID is an event signal, not proof of physical handover. See `docs/architecture-decisions.md` ADRs 9, 10.

The system must support:

- card assignment
- card activation/deactivation
- boarding scan
- exit scan
- duplicate scan handling
- offline scanning
- synchronization
- event timestamps
- scan status feedback

A scan must generate an auditable event.

The system must distinguish:

- valid boarding
- duplicate boarding
- invalid card
- wrong bus
- unexpected student
- valid exit
- wrong-stop exit
- duplicate exit

---

# 21. Exception Engine

Exceptions must be deterministic and explainable.

Examples:

### Boarding Missing

Student expected on trip but no boarding event exists within the configured operational window.

### Wrong Bus

Student scans on a bus that is not assigned to their active trip.

### Wrong Stop Exit

Student exit event occurs outside the student's authorized stop/geofence. Canonical exception type: `WRONG_STOP_EXIT`.

### Exit Missing

Student has a confirmed boarding event but no confirmed exit event within the configured grace period after the bus reaches the student's assigned stop. MVP grace period: **5 minutes** (configurable via `exit_missing_grace_period_seconds`). See `docs/architecture-decisions.md` ADR-7.

### GPS Unavailable

Location data becomes stale beyond the configured threshold.

Exceptions must contain:

- type
- severity
- related entity
- timestamp
- evidence
- current status
- resolution information

Do not silently resolve exceptions.

---

# 22. Notifications

Notifications should be generated from validated system events.

Potential channels:

- Push notification
- Email
- SMS where explicitly required

Do not make notification delivery itself part of the authoritative journey state.

A notification failure must not rewrite the underlying journey event.

Notifications must be retryable and observable.

---

# 23. Reporting

Operational dashboards and historical reporting must be separated conceptually.

Operational queries should remain responsive.

Historical reporting should use appropriate aggregation/query strategies as the dataset grows.

Do not introduce a separate analytics warehouse until actual scale requires it.

---

# 24. Frontend Rules

Admin Web:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand

Prefer:

- reusable components
- clear information hierarchy
- responsive layouts
- accessible controls
- consistent loading states
- explicit empty states
- meaningful error states

Avoid:

- unnecessary gradients
- excessive cards
- visual clutter
- decorative UI without purpose
- inconsistent spacing
- excessive animations

The product should feel like a premium operational system, not a generic admin template.

---

# 25. State Management

Use TanStack Query for server state.

Use Zustand only for genuine client/application state.

Do not duplicate server state into Zustand without a clear reason.

Avoid global state when local state is sufficient.

---

# 26. Testing

Core business logic must be testable independently from UI and infrastructure.

Priority:

1. Journey state machine
2. Event idempotency
3. Offline synchronization
4. Exception engine
5. Geofence/stop validation
6. GPS normalization
7. RBAC
8. RLS
9. API behavior
10. UI flows

Use:

- Vitest for unit/integration testing
- Playwright for end-to-end testing

Critical safety rules require automated tests.

---

# 27. Development Workflow

Before implementing a feature:

1. Understand the requirement.
2. Inspect relevant architecture.
3. Identify affected modules.
4. Identify database changes.
5. Identify security implications.
6. Identify tests required.
7. Implement the smallest coherent change.
8. Run type checking.
9. Run linting.
10. Run relevant tests.
11. Review git diff.
12. Report changed files and remaining risks.

Do not make unrelated refactors.

Do not rewrite working architecture without justification.

---

# 28. Code Quality

TypeScript must use strict mode.

Prefer explicit types over `any`.

Avoid:

- `any`
- unnecessary abstractions
- giant files
- duplicated business rules
- hidden side effects
- magic constants
- dead code

Business rules should be named and testable.

---

# 29. Git Discipline

Use small, meaningful commits.

Commit messages should describe the actual change.

Do not commit:

- `.env`
- secrets
- credentials
- generated private data
- local database files
- build artifacts unless explicitly required

Before committing:

- inspect git diff
- run relevant tests
- verify no secrets are present

---

# 30. Implementation Priority

Build in this general order:

Phase 0 — Development Environment
Phase 1 — Repository Foundation
Phase 2 — Database + Authentication + RBAC
Phase 3 — School + Student Management
Phase 4 — Fleet + Routes + Stops
Phase 5 — Trip + Manifest Management
Phase 6 — RFID Event Engine
Phase 7 — Offline Attendant Application
Phase 8 — GPS Integration
Phase 9 — Journey Engine
Phase 10 — Exception Engine
Phase 11 — Admin Dashboard
Phase 12 — Parent Application
Phase 13 — Notifications
Phase 14 — Security + Testing + Hardening
Phase 15 — Pilot Deployment

Do not skip foundational phases merely to demonstrate UI functionality.

---

# 31. Current Development Status

Current repository contains:

- HLD.md
- LLD.md

The next objective is to establish the repository foundation and development rules before functional implementation.

Do not begin large-scale implementation unless explicitly instructed.

---

# 32. Claude Operating Rules

When working on this repository:

- Read this CLAUDE.md first.
- Read relevant HLD/LLD sections before architectural changes.
- Follow existing decisions unless a contradiction is identified.
- Use canonical exception names (`WRONG_STOP_EXIT`, `MANUAL_ATTENDANCE_OVERRIDE`) and canonical journey state names per `docs/architecture-decisions.md` ADRs 12, 13.
- Clearly identify assumptions.
- Do not invent requirements.
- Do not silently change architecture.
- Do not introduce unnecessary technologies.
- Do not add AI to deterministic safety workflows.
- Prefer simple, reliable solutions.
- Ask for approval before major architectural changes.
- Explain security and data-integrity implications of significant changes.
- Keep changes scoped to the requested task.

When uncertain, inspect the repository and architecture before making assumptions.