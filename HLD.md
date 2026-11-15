# 1. System Overview

The School Transport Safety & Accountability Platform is a **multi-tenant SaaS platform** connecting:

- School administrators
- Transport managers
- Bus attendants
- Parents
- Students
- School buses
- GPS devices
- RFID readers

The platform maintains a real-time relationship between:

**Student → Trip → Bus → Route → Stop → Journey Events**

The core principle is:

> **GPS tells us where the bus is. RFID tells us which student event occurred. The Journey Engine reconciles both into an accountable student journey.**

---

# 2. High-Level Architecture

```text
                         ┌──────────────────────────┐
                         │       SCHOOL ADMIN       │
                         │      React Web App       │
                         └────────────┬─────────────┘
                                      │ HTTPS
                                      │
                         ┌────────────▼─────────────┐
                         │       API / BFF Layer    │
                         │   Supabase Edge Functions │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
             ┌────────────┐   ┌──────────────┐  ┌─────────────┐
             │    Auth    │   │ Journey      │  │ Notification│
             │ & RBAC/RLS │   │ Engine       │  │ Service     │
             └────────────┘   └──────┬───────┘  └─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
             ┌────────────┐   ┌──────────────┐  ┌─────────────┐
             │ PostgreSQL │   │ PostGIS      │  │ Realtime    │
             │            │   │ Geospatial   │  │             │
             └────────────┘   └──────────────┘  └─────────────┘
                    ▲                 ▲
                    │                 │
        ┌───────────┴─────────────────┴───────────┐
        │                                           │
        │             EVENT INGESTION              │
        │                                           │
        ▼                                           ▼
┌──────────────────┐                     ┌────────────────────┐
│ RFID Event Layer │                     │   GPS Adapter      │
│                  │                     │                    │
│ Attendant Device │                     │ Existing GPS APIs  │
│ Offline Queue    │                     │ New GPS/VLTD       │
└────────┬─────────┘                     └─────────┬──────────┘
         │                                          │
         ▼                                          ▼
┌──────────────────┐                     ┌────────────────────┐
│ Attendant Mobile │                     │ GPS Devices/Buses  │
│ React Native     │                     │                    │
└──────────────────┘                     └────────────────────┘


                         ┌──────────────────────┐
                         │      PARENT APP      │
                         │ React Native + Expo  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                           Realtime/API Layer
```

---

# 3. Architectural Style

The MVP should use a:

### Modular Monolith + Event-Driven Core

Not microservices.

```text
                    Backend
                       │
       ┌───────────────┼────────────────┐
       │               │                │
   Identity         Transport        Journey
   Module           Module           Module
       │               │                │
       ├───────────────┼────────────────┤
       │               │                │
    Students         Fleet          Event Engine
    Guardians        Routes         Reconciliation
    Staff            Buses          Exceptions
    Roles            Stops          Notifications
```

Each module has clear boundaries, but they initially run within the same backend infrastructure.

This gives us:

- Simple deployment
- Lower cost
- Clear architecture
- Easier debugging
- Easier testing
- Future microservice extraction if scale requires it

---

# 4. Client Architecture

## 4.1 Admin Web

```text
React
 │
 ├── Pages
 │
 ├── Components
 │
 ├── Feature Modules
 │
 ├── TanStack Query
 │
 ├── Zustand
 │
 └── API Client
```

Main modules:

```text
Dashboard
Live Fleet
Students
Buses
Routes & Stops
Trips
Alerts
Reports
Settings
```

---

# 5. Mobile Architecture

One React Native/Expo codebase.

```text
                 Mobile Application
                        │
              ┌─────────┴─────────┐
              │                   │
          ATTENDANT             PARENT
              │                   │
       Attendant UI          Parent UI
              │                   │
              └─────────┬─────────┘
                        │
                 Shared Services
                        │
        ┌───────────────┼────────────────┐
        │               │                │
      Auth          API Client       Local DB
                                        │
                                      SQLite
                                        │
                                   Sync Engine
```

---

# 6. Backend Modules

## Module 1 — Identity & Access Management

Responsible for:

- Authentication
- User accounts
- Roles
- Permissions
- School tenancy
- Parent-child relationships
- Staff assignment

Roles:

```text
SUPER_ADMIN
SCHOOL_ADMIN
TRANSPORT_MANAGER
ATTENDANT
PARENT
```

Every request must be evaluated against:

```text
User
 ↓
Role
 ↓
School/Tenant
 ↓
Resource
 ↓
Permission
```

---

# 7. School Management Module

Entities:

```text
School
Campus
Academic Year
Class
Section
Student
Guardian
Staff
```

Relationships:

```text
School
  │
  ├── Students
  ├── Guardians
  ├── Staff
  └── Transport Fleet
```

---

# 8. Fleet Management Module

Responsible for:

- Buses
- Drivers
- Attendants
- GPS devices
- RFID readers
- Device status

Core relationship:

```text
Bus
 │
 ├── Active GPS Device (gps_devices, one ACTIVE per bus)
 ├── Active RFID Device (rfid_devices, one ACTIVE per bus — ADR-10)
 ├── Driver
 └── Attendant
```

Historical/decommissioned devices are retained in `gps_devices` and `rfid_devices` tables for audit. The `buses` table holds `active_gps_device_id` and `active_rfid_device_id` nullable FKs.

A bus can change drivers/attendants without changing its identity.

---

# 9. Route Management Module

Entities:

```text
Route
 ├── Stops
 ├── Assigned Students
 └── Assigned Bus
```

Example:

```text
Route A

School
  │
  ├── Stop 01
  ├── Stop 02
  ├── Stop 03
  ├── Stop 04
  └── Stop 05
```

Each stop contains:

```text
stop_id
name
latitude
longitude
geofence_radius
sequence
expected_arrival_time
```

---

# 10. Trip Management Module

A route is a reusable definition.

A trip is a specific execution of that route.

Example:

```text
Route A
   ↓
Morning Trip
   ↓
15 Jan 2026
   ↓
Bus 07
   ↓
Attendant X
```

Trip states:

```text
SCHEDULED
STARTED
IN_PROGRESS
COMPLETED
CANCELLED
```

---

# 11. Student Journey Engine

This is the **core business logic of the product**.

Every student has a journey state.

```text
EXPECTED
   │
   ▼
BOARDING_PENDING
   │
   ▼
BOARDED
   │
   ▼
ONBOARD
   │
   ▼
EXIT_PENDING
   │
   ▼
EXIT_RECORDED
   │
   ▼
COMPLETED
```

Exception states:

```text
BOARDING_MISSING
WRONG_BUS
WRONG_STOP_EXIT
DUPLICATE_SCAN
EXIT_MISSING
GPS_UNAVAILABLE
SYNC_FAILURE
MANUAL_ATTENDANCE_OVERRIDE
```

See `docs/architecture-decisions.md` ADR-12 for canonical exception taxonomy.

The system must **never infer a successful drop-off merely because the bus reached a stop**.

---

# 12. Event-Driven Core

Instead of directly modifying every table from every client, important actions become events.

Example:

```text
STUDENT_BOARDING
STUDENT_EXIT
BUS_TRIP_STARTED
BUS_TRIP_COMPLETED
BUS_LOCATION_UPDATED
GPS_OFFLINE
GPS_RECOVERED
WRONG_STOP_EXIT
DUPLICATE_RFID_SCAN
MANUAL_ATTENDANCE_OVERRIDE
```

See `docs/architecture-decisions.md` ADR-12 for canonical event and exception taxonomy.

Event flow:

```text
RFID Scan
    │
    ▼
Event Validation
    │
    ▼
Event Created
    │
    ▼
Journey Engine
    │
    ├── Update Student State
    │
    ├── Check Route/Stop
    │
    ├── Detect Exception
    │
    ├── Create Audit Record
    │
    └── Trigger Notification
```

---

# 13. RFID Event Architecture

```text
Student Card
     │
     ▼
RFID Reader
     │
     ▼
Attendant Device
     │
     ▼
Local SQLite
     │
     ├── Internet Available ────────┐
     │                              │
     └── Internet Unavailable       │
            │                       │
            ▼                       ▼
        Pending Queue          Sync API
                                    │
                                    ▼
                              Event Validation
                                    │
                                    ▼
                              Journey Engine
```

Each event gets a unique `event_id` using **UUID v7** format. See ADR-6.

This provides **idempotency**.

MVP RFID hardware target: 13.56 MHz ISO/IEC 14443-A/B compatible readers. All reader-specific logic is encapsulated behind an `RFIDReaderAdapter` interface. The RFID card UID is an opaque token — it must not encode student PII. See ADRs 9, 10.

If the same event reaches the server twice:

```text
event_id = EVT_123
```

the backend must not create two boarding records.

---

# 14. Offline-First Strategy

The attendant application must work when the network disappears.

Local event:

```text
event_id
student_id
trip_id
bus_id
event_type
device_timestamp
sync_status
```

Sync states:

```text
PENDING
SYNCING
SYNCED
FAILED
```

When connectivity returns:

```text
Local Queue
     ↓
Batch Sync
     ↓
Server Validation
     ↓
Acknowledgement
     ↓
Mark SYNCED
```

The original event timestamp must be preserved.

---

# 15. GPS Architecture

GPS must use an abstraction layer.

```text
              GPS Integration Layer
                       │
       ┌───────────────┼────────────────┐
       │               │                │
   Provider A      Provider B       New Device
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                GPS Normalizer
                       │
                       ▼
                 GPS Event
```

Normalized event:

```text
vehicle_id
latitude
longitude
speed
heading
timestamp
accuracy
provider
```

This prevents vendor lock-in.

MVP GPS freshness threshold: **60 seconds** (configurable via `gps_freshness_threshold_seconds`). See ADR-8.

---

# 16. GPS Processing

```text
GPS Update
    │
    ▼
Validate Coordinates
    │
    ▼
Normalize Provider Format
    │
    ▼
Store Location
    │
    ▼
PostGIS
    │
    ├── Current Bus Location
    ├── Route Matching
    ├── Stop Proximity
    └── Geofence Detection
```

---

# 17. Geofencing

Each stop has a geofence.

Example:

```text
                 Stop 03
                   ●
              .-----------.
            .'             '.
           /    100m        \
          |    GEOFENCE      |
           \                 /
            '.             .'
              '-----------'
```

When:

```text
Bus enters geofence
```

the system generates:

```text
BUS_REACHED_STOP
```

But:

```text
BUS_REACHED_STOP
```

does **not** automatically mean:

```text
STUDENT_EXITED
```

The student's exit must still be recorded/verified.

---

# 18. Exception Engine

The system continuously evaluates expected vs actual events.

Example:

```text
Expected:

Student A
 ↓
Board Bus 07
 ↓
Exit Stop 03
```

Actual:

```text
Student A
 ↓
Boarded Bus 07
 ↓
Bus reached Stop 03
 ↓
NO EXIT EVENT
```

System creates:

```text
EXIT_MISSING
```

Another example:

```text
Student A
Expected Stop 03

Actual:
Exit at Stop 05
```

System creates:

```text
WRONG_STOP_EXIT
```

---

# 19. Exception Severity

Use deterministic severity initially.

```text
INFO
WARNING
CRITICAL
```

Example:

| Exception | Severity |
|---|---|
| Duplicate RFID scan | INFO |
| GPS delayed | WARNING |
| Boarding missing | WARNING |
| Exit missing | CRITICAL |
| Wrong stop exit | CRITICAL |
| Device offline | WARNING |

AI is **not required** for this engine.

Deterministic rules are safer and easier to audit.

---

# 20. Notification Architecture

```text
Event
  │
  ▼
Exception/Notification Engine
  │
  ├── Parent
  │     └── FCM
  │
  ├── School Admin
  │     └── Web Realtime
  │
  └── Attendant
        └── Mobile Notification
```

Notifications should be generated from meaningful state changes rather than every GPS update.

---

# 21. Realtime Architecture

GPS should not blindly broadcast every raw GPS packet to every client.

Instead:

```text
GPS Device
     ↓
GPS Ingestion
     ↓
Processing
     ↓
Current Vehicle State
     ↓
Realtime Channel
     ↓
Authorized Clients
```

Admin receives:

```text
Bus 07 → Current Location
```

Parent receives only:

```text
Child's assigned Bus → Current Location
```

---

# 22. Database High-Level Model

Core entities:

```text
schools
users
students
guardians
staff

buses
drivers
attendants
gps_devices
rfid_devices

routes
stops
route_stops
student_route_assignments

trips
trip_students

journey_events
student_journey_states

gps_locations         -- includes school_id for direct RLS (ADR-11)

exceptions
notifications

audit_logs
```

Simplified relationship:

```text
School
 │
 ├── Students
 │      │
 │      └── Journey
 │
 ├── Buses
 │      │
 │      └── GPS Device
 │
 ├── Routes
 │      │
 │      └── Stops
 │
 └── Trips
        │
        ├── Bus
        ├── Route
        ├── Attendant
        └── Students
```

---

# 23. Multi-Tenant Architecture

The platform must support multiple schools from day one.

```text
                 PLATFORM
                    │
        ┌───────────┼───────────┐
        │           │           │
     School A    School B    School C
        │           │           │
     Students    Students    Students
     Buses       Buses       Buses
     Routes      Routes      Routes
```

Every tenant-owned record contains:

```text
school_id
```

Example:

```text
students
----------------
id
school_id
name
...
```

Supabase Row Level Security ensures users cannot access another school's data.

---

# 24. Security Architecture

```text
Client
  │
 HTTPS
  │
  ▼
Authentication
  │
  ▼
JWT
  │
  ▼
Role Verification
  │
  ▼
Tenant Verification
  │
  ▼
RLS
  │
  ▼
Database
```

Security requirements:

```text
HTTPS
JWT authentication
RBAC
Row Level Security
Tenant isolation
Input validation
Audit logging
Encrypted sensitive data
Secure secrets
No personal information on RFID card
Least-privilege access
```

---

# 25. Audit Architecture

Important actions must be auditable.

Example:

```text
Admin manually changes:

Student A
Status:
EXIT_MISSING → EXIT_RECORDED
```

Audit log:

```text
actor_id
school_id
action
entity_type
entity_id
old_value
new_value
reason
timestamp
```

This is important for accountability.

---

# 26. API Architecture

Use REST APIs initially.

Example:

```text
POST /auth/login

GET /schools/{id}/students

GET /buses

GET /buses/{id}/location

GET /routes

GET /trips/{id}

POST /trips/{id}/start

POST /journey-events

POST /journey-events/batch

GET /students/{id}/journey

GET /exceptions

PATCH /exceptions/{id}

GET /reports/journeys
```

Internal APIs should be versioned:

```text
/api/v1/...
```

---

# 27. API Request Flow

Example: RFID boarding.

```text
Attendant scans card
        │
        ▼
POST /api/v1/journey-events
        │
        ▼
Authentication
        │
        ▼
Validate Payload
        │
        ▼
Check School/Tenant
        │
        ▼
Check Trip
        │
        ▼
Check Student Assignment
        │
        ▼
Check Duplicate
        │
        ▼
Create Event
        │
        ▼
Journey Engine
        │
        ├── Update State
        ├── Create Exception if required
        └── Create Notification
```

---

# 28. Frontend Data Flow

Admin:

```text
React UI
   ↓
TanStack Query
   ↓
API
   ↓
Supabase
   ↓
PostgreSQL
```

Realtime:

```text
GPS/Event
    ↓
Backend
    ↓
Realtime
    ↓
React Query Cache
    ↓
UI Update
```

---

# 29. Parent Data Isolation

Parent A:

```text
Parent A
   │
   └── Child A
          │
          └── Bus 07
```

Parent A can access:

```text
Child A
Bus 07
Assigned Route
Assigned Stop
Child Journey
Relevant Notifications
```

Parent A cannot access:

```text
Other students
Other parents
Other schools
Unassigned buses
```

---

# 30. Deployment Architecture — MVP

```text
                     INTERNET
                         │
              ┌──────────▼──────────┐
              │       Vercel       │
              │     React Web       │
              └──────────┬──────────┘
                         │
                         │ HTTPS
                         ▼
              ┌─────────────────────┐
              │      Supabase       │
              │                     │
              │ Auth                │
              │ PostgreSQL          │
              │ PostGIS             │
              │ Realtime            │
              │ Edge Functions      │
              └──────────┬──────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Parent App    Attendant App    GPS Providers
       Expo            Expo
```

This keeps the MVP infrastructure extremely small.

---

# 31. Observability

The application should have:

```text
Application Logs
API Logs
Authentication Logs
GPS Ingestion Logs
RFID Event Logs
Sync Logs
Exception Logs
Audit Logs
```

Use Sentry initially for application errors.

Important metrics:

```text
GPS update latency
GPS availability
RFID sync success rate
Offline queue size
API response time
Notification delivery
Journey completion rate
Exception rate
```

---

# 32. Reliability Requirements

The system should be designed around these principles:

### No event loss

RFID events must survive temporary connectivity loss.

### Idempotency

Duplicate events must not create duplicate journey records.

### Event timestamps

Use the original device event timestamp.

### Server timestamps

Also store server receipt time.

```text
event_timestamp
server_received_at
```

This allows investigation of delays.

### Graceful degradation

If:

```text
GPS fails
```

RFID should continue.

If:

```text
Internet fails
```

local RFID events should continue.

If:

```text
RFID fails
```

attendant should have controlled manual verification.

---

# 33. Data Flow — Complete Journey

```text
                    STUDENT
                       │
                       ▼
                  RFID CARD
                       │
                       ▼
                 RFID READER
                       │
                       ▼
              ATTENDANT DEVICE
                       │
                       ▼
                LOCAL EVENT
                       │
                       ▼
                  SYNC API
                       │
                       ▼
              EVENT VALIDATION
                       │
                       ▼
              JOURNEY ENGINE
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      PostgreSQL    Exception    Notification
          │            │            │
          │            │            ▼
          │            │          Parent
          │            ▼
          │         Admin
          │
          ▼
       Realtime
          │
     ┌────┴────┐
     ▼         ▼
   Admin      Parent
   Web         App
```

---

# 34. Technology Mapping

| Layer | Technology |
|---|---|
| Admin Web | React + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Icons | Lucide |
| Mobile | React Native + Expo |
| Mobile Styling | NativeWind |
| Backend | Supabase |
| API | Edge Functions |
| Database | PostgreSQL |
| Geospatial | PostGIS |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| State | Zustand |
| Server State | TanStack Query |
| Validation | Zod |
| Offline DB | SQLite |
| Maps | MapLibre |
| Map Tiles | OpenFreeMap for MVP |
| Push | Firebase Cloud Messaging |
| Testing | Vitest + Playwright |
| Monitoring | Sentry |
| CI/CD | GitHub Actions |
| Web Hosting | Vercel |

---

# 35. Key Architectural Decisions

### Decision 1 — Modular Monolith

Use one backend initially.

**Reason:** MVP simplicity and low infrastructure cost.

### Decision 2 — PostgreSQL

**Reason:** highly relational domain + strong transactional guarantees.

### Decision 3 — PostGIS

**Reason:** routes, stops and geofencing require geospatial operations.

### Decision 4 — Event-driven journey processing

**Reason:** every boarding/exit/GPS action needs an auditable history.

### Decision 5 — Offline-first RFID

**Reason:** buses cannot depend entirely on continuous connectivity.

### Decision 6 — GPS adapter layer

**Reason:** schools may already have different GPS vendors.

### Decision 7 — Deterministic exception engine

**Reason:** safety/accountability decisions should initially be explainable and auditable rather than AI-generated.

### Decision 8 — Multi-tenancy from day one

**Reason:** the product is intended to become a school SaaS platform.

---

# 36. Future Scale Path

The MVP does **not** need microservices.

When scale actually requires it:

```text
                    API Gateway
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
   Identity         Journey          GPS Service
   Service          Service           Service
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                  Event Broker
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
        Notification   Analytics   Audit
```

Possible future technologies:

```text
Redis
Kafka / Redpanda
Dedicated GPS ingestion service
Dedicated notification service
Object storage
Analytics warehouse
Kubernetes
```

**None of these should be introduced into the first MVP unless actual requirements justify them.**

---

# 37. Final Architecture Principle

The system should be built around one central concept:

```text
                    STUDENT JOURNEY
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
       RFID              GPS              ROUTE
        │                 │                 │
        ▼                 ▼                 ▼
   Who boarded?      Where is bus?    Where should
                                      student exit?
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
                 JOURNEY ENGINE
                          │
                          ▼
                  ACCOUNTABILITY
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          SCHOOL        PARENT       AUDIT
```

The **GPS system is not the product**.

The **RFID system is not the product**.

The product is the **student journey accountability layer that combines GPS + RFID + route/stop context + event history + exception management**.

That is the architectural foundation I would use for the actual implementation.