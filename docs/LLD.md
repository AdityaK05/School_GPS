# 1. LLD Objective

The Low-Level Design defines the internal implementation of the School Transport Safety & Accountability Platform.

The system is divided into:

1. Admin Web Application
2. Parent Mobile Application
3. Attendant Mobile Application
4. Backend/API Layer
5. Journey Processing Engine
6. GPS Integration Layer
7. RFID/Event Processing Layer
8. Notification Layer
9. PostgreSQL/PostGIS Database
10. Offline Synchronization Layer
11. Authentication & Authorization
12. Audit & Monitoring

---

# 2. Repository Structure

Use a monorepo.

```text
school-transport-platform/
│
├── apps/
│   │
│   ├── admin-web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── students/
│   │   │   │   ├── buses/
│   │   │   │   ├── routes/
│   │   │   │   ├── trips/
│   │   │   │   ├── alerts/
│   │   │   │   └── reports/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── stores/
│   │   │   └── types/
│   │   └── package.json
│   │
│   └── mobile/
│       ├── app/
│       │   ├── (auth)/
│       │   ├── (parent)/
│       │   └── (attendant)/
│       ├── src/
│       │   ├── components/
│       │   ├── features/
│       │   ├── services/
│       │   ├── database/
│       │   ├── sync/
│       │   ├── stores/
│       │   └── types/
│       └── package.json
│
├── packages/
│   ├── shared-types/
│   ├── validation/
│   ├── constants/
│   └── utils/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   ├── journey-events/
│   │   ├── gps-ingestion/
│   │   ├── notifications/
│   │   └── reports/
│   └── seed.sql
│
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── database/
│
├── .github/
│   └── workflows/
│
├── package.json
└── README.md
```

The important principle is:

> **Shared domain types and validation are written once and reused by web, mobile and backend.**

---

# 3. Domain Modules

The backend/domain layer contains these modules:

```text
Identity
School
Student
Guardian
Fleet
Driver
Attendant
GPS
RFID
Route
Stop
Trip
Journey
Event
Exception
Notification
Audit
Report
```

Dependency direction:

```text
Identity
   ↓
School
   ↓
Fleet / Student / Route
   ↓
Trip
   ↓
Journey
   ↓
Events
   ↓
Exceptions / Notifications / Audit
```

---

# 4. Core Domain Objects

## School

```typescript
interface School {
  id: string;
  name: string;
  code: string;
  timezone: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}
```

---

## Student

```typescript
interface Student {
  id: string;
  schoolId: string;

  admissionNumber: string;
  firstName: string;
  lastName: string;

  className?: string;
  section?: string;

  rfidCardId?: string;

  status: "ACTIVE" | "INACTIVE";

  createdAt: string;
  updatedAt: string;
}
```

---

## Guardian

```typescript
interface Guardian {
  id: string;
  userId: string;
  studentId: string;

  relationship: "FATHER" | "MOTHER" | "GUARDIAN";

  notificationEnabled: boolean;
}
```

---

# 5. Bus

```typescript
interface Bus {
  id: string;
  schoolId: string;

  registrationNumber: string;
  fleetNumber: string;

  capacity: number;

  status:
    | "ACTIVE"
    | "MAINTENANCE"
    | "INACTIVE";

  /**
   * FK to gps_devices.id — the currently active GPS device.
   * Historical/decommissioned devices remain in gps_devices table.
   * See ADR-10.
   */
  activeGpsDeviceId?: string;

  /**
   * FK to rfid_devices.id — the currently active RFID reader.
   * Only one ACTIVE rfid_device may exist per bus at any time.
   * Enforced by partial unique index: UNIQUE(bus_id) WHERE status = 'ACTIVE'.
   * See ADR-10.
   */
  activeRfidDeviceId?: string;

  createdAt: string;
  updatedAt: string;
}
```

---

# 6. GPS Device

```typescript
interface GPSDevice {
  id: string;

  busId: string;

  provider: string;
  externalDeviceId: string;

  status:
    | "ONLINE"
    | "OFFLINE"
    | "UNKNOWN";

  lastSeenAt?: string;

  createdAt: string;
}
```

---

# 7. Route

```typescript
interface Route {
  id: string;
  schoolId: string;

  name: string;
  code: string;

  direction: "MORNING" | "EVENING";

  status: "ACTIVE" | "INACTIVE";
}
```

---

# 8. Stop

```typescript
interface Stop {
  id: string;

  routeId: string;

  name: string;

  latitude: number;
  longitude: number;

  geofenceRadiusMeters: number;

  sequence: number;

  expectedArrivalTime?: string;
}
```

---

# 9. Student Route Assignment

A student must be explicitly assigned to a route and stop.

```typescript
interface StudentRouteAssignment {
  id: string;

  studentId: string;
  routeId: string;
  stopId: string;

  effectiveFrom: string;
  effectiveUntil?: string;

  status: "ACTIVE" | "INACTIVE";
}
```

This prevents the system from guessing where a student should be dropped.

---

# 10. Trip

A route is a template.

A trip is an actual journey.

```typescript
interface Trip {
  id: string;

  schoolId: string;

  routeId: string;
  busId: string;

  driverId?: string;
  attendantId?: string;

  tripDate: string;

  direction: "MORNING" | "EVENING";

  status:
    | "SCHEDULED"
    | "STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

  startedAt?: string;
  completedAt?: string;
}
```

---

# 11. Trip Student Manifest

At trip creation/start, the system generates the expected student manifest.

```typescript
interface TripStudent {
  id: string;

  tripId: string;
  studentId: string;

  expectedBoardingStopId: string;
  expectedExitStopId: string;

  boardingStatus:
    | "PENDING"
    | "BOARDED"
    | "MISSED";

  exitStatus:
    | "PENDING"
    | "EXITED"
    | "MISSING";
}
```

This becomes the source against which actual journey events are reconciled.

---

# 12. Journey Event

This is one of the most important tables.

```typescript
interface JourneyEvent {
  id: string;

  schoolId: string;

  tripId: string;
  studentId?: string;
  busId?: string;

  eventType: JourneyEventType;

  eventTimestamp: string;
  serverReceivedAt: string;

  latitude?: number;
  longitude?: number;

  source:
    | "RFID"
    | "GPS"
    | "ATTENDANT"
    | "ADMIN"
    | "SYSTEM";

  deviceId?: string;

  idempotencyKey: string;

  metadata?: Record<string, unknown>;
}
```

Event types:

```typescript
export type JourneyEventType =
  | "TRIP_STARTED"
  | "TRIP_COMPLETED"

  | "STUDENT_BOARDING"
  | "STUDENT_EXIT"

  | "BUS_LOCATION_UPDATE"
  | "BUS_REACHED_STOP"

  | "GPS_OFFLINE"
  | "GPS_RECOVERED"

  | "DUPLICATE_RFID_SCAN"

  | "MANUAL_ATTENDANCE_OVERRIDE";
```

---

# 13. Event Immutability

Journey events should be treated as **append-only records**.

Do not modify:

```text
STUDENT_BOARDING
```

into:

```text
STUDENT_EXIT
```

Instead:

```text
Event 1
STUDENT_BOARDING

Event 2
STUDENT_EXIT
```

The current state is derived from the events.

This creates a reliable audit trail.

---

# 14. Student Journey State

The system also maintains the current state for fast querying.

```typescript
interface StudentJourneyState {
  id: string;

  tripId: string;
  studentId: string;

  state:
    | "EXPECTED"
    | "BOARDING_PENDING"
    | "BOARDED"
    | "ONBOARD"
    | "EXIT_PENDING"
    | "EXIT_RECORDED"
    | "COMPLETED";

  lastEventId?: string;

  boardingAt?: string;
  exitAt?: string;

  updatedAt: string;
}
```

This table is a **materialized current state**, while `journey_events` remains the historical source.

---

# 15. Exception Model

```typescript
interface JourneyException {
  id: string;

  schoolId: string;
  tripId: string;

  studentId?: string;
  busId?: string;

  type:
    | "BOARDING_MISSING"
    | "WRONG_BUS"
    | "WRONG_STOP_EXIT"
    | "EXIT_MISSING"
    | "GPS_UNAVAILABLE"
    | "DUPLICATE_SCAN"
    | "SYNC_FAILURE";

  severity:
    | "INFO"
    | "WARNING"
    | "CRITICAL";

  status:
    | "OPEN"
    | "ACKNOWLEDGED"
    | "RESOLVED"
    | "DISMISSED";

  description: string;

  createdAt: string;
  resolvedAt?: string;

  resolvedBy?: string;
  resolutionReason?: string;
}
```

---

# 16. Database Schema

Core tables:

```text
schools
users
user_roles

students
guardians
student_guardians

buses
drivers
attendants
gps_devices           -- separate table; buses.active_gps_device_id holds active FK (ADR-10)
rfid_devices          -- separate table; buses.active_rfid_device_id holds active FK; UNIQUE(bus_id) WHERE status='ACTIVE' (ADR-10)

routes
stops
route_stops

student_route_assignments

trips
trip_students

journey_events
student_journey_states

gps_locations         -- includes school_id for direct RLS; intentional denorm from buses.school_id (ADR-11)

exceptions
notifications

audit_logs
```

---

# 17. Important Database Relationships

```text
schools
   │
   ├──────── students
   │              │
   │              └──── student_guardians
   │
   ├──────── buses
   │              │
   │              └──── gps_devices
   │
   ├──────── routes
   │              │
   │              └──── stops
   │
   └──────── trips
                  │
                  ├──── bus
                  ├──── route
                  ├──── attendant
                  ├──── driver
                  │
                  └──── trip_students
                              │
                              └──── student
```

---

# 18. Database Indexes

These are important for performance.

```sql
CREATE INDEX idx_students_school
ON students(school_id);

CREATE INDEX idx_buses_school
ON buses(school_id);

CREATE INDEX idx_trips_school_date
ON trips(school_id, trip_date);

CREATE INDEX idx_trip_students_trip
ON trip_students(trip_id);

CREATE INDEX idx_journey_events_trip
ON journey_events(trip_id);

CREATE INDEX idx_journey_events_student
ON journey_events(student_id);

CREATE INDEX idx_journey_events_timestamp
ON journey_events(event_timestamp);

CREATE UNIQUE INDEX idx_event_idempotency
ON journey_events(idempotency_key);

CREATE INDEX idx_exceptions_school_status
ON exceptions(school_id, status);
```

For GPS:

```sql
CREATE INDEX idx_gps_locations_bus_time
ON gps_locations(bus_id, recorded_at DESC);
```

And spatial indexing:

```sql
CREATE INDEX idx_stops_location
ON stops
USING GIST(location);
```

---

# 19. API Layer

All APIs use:

```text
/api/v1
```

## Authentication

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

---

# 20. Student APIs

```text
GET    /api/v1/students
GET    /api/v1/students/:id
POST   /api/v1/students
PATCH  /api/v1/students/:id
DELETE /api/v1/students/:id
```

---

# 21. Bus APIs

```text
GET   /api/v1/buses
GET   /api/v1/buses/:id
POST  /api/v1/buses
PATCH /api/v1/buses/:id
```

---

# 22. Route APIs

```text
GET   /api/v1/routes
GET   /api/v1/routes/:id
POST  /api/v1/routes
PATCH /api/v1/routes/:id

GET   /api/v1/routes/:id/stops
POST  /api/v1/routes/:id/stops
PATCH /api/v1/stops/:id
```

---

# 23. Trip APIs

```text
GET  /api/v1/trips
GET  /api/v1/trips/:id

POST /api/v1/trips
POST /api/v1/trips/:id/start
POST /api/v1/trips/:id/complete
POST /api/v1/trips/:id/cancel

GET /api/v1/trips/:id/manifest
```

---

# 24. Journey Event API

Primary endpoint:

```text
POST /api/v1/journey-events
```

Request:

```json
{
  "eventId": "EVT_01JABC",
  "eventType": "STUDENT_BOARDING",
  "tripId": "TRIP_001",
  "studentId": "STU_001",
  "busId": "BUS_007",
  "eventTimestamp": "2026-01-15T07:12:14+05:30",
  "latitude": 28.628,
  "longitude": 77.376,
  "source": "RFID",
  "deviceId": "ATT_001"
}
```

Response:

```json
{
  "success": true,
  "eventId": "EVT_01JABC",
  "journeyState": "BOARDED",
  "exception": null
}
```

---

# 25. Batch Sync API

Offline devices should not send events individually when reconnecting.

```text
POST /api/v1/journey-events/batch
```

Request:

```json
{
  "deviceId": "ATT_001",
  "events": [
    {
      "idempotencyKey": "EVT_001",
      "eventType": "STUDENT_BOARDING",
      "studentId": "STU_001",
      "tripId": "TRIP_001",
      "eventTimestamp": "..."
    },
    {
      "idempotencyKey": "EVT_002",
      "eventType": "STUDENT_BOARDING",
      "studentId": "STU_002",
      "tripId": "TRIP_001",
      "eventTimestamp": "..."
    }
  ]
}
```

Response:

```json
{
  "accepted": [
    "EVT_001",
    "EVT_002"
  ],
  "rejected": []
}
```

---

# 26. GPS API

Normalized GPS endpoint:

```text
POST /api/v1/gps/events
```

Payload:

```json
{
  "deviceId": "GPS_007",
  "vehicleId": "BUS_007",
  "latitude": 28.628,
  "longitude": 77.376,
  "speed": 32.5,
  "heading": 90,
  "accuracy": 8,
  "timestamp": "2026-01-15T07:18:42+05:30"
}
```

The adapter converts vendor-specific payloads into this format.

---

# 27. GPS Adapter Interface

```typescript
interface GPSProviderAdapter {

  authenticate(): Promise<void>;

  normalizeLocation(
    payload: unknown
  ): NormalizedGPSLocation;

  getVehicleLocations(): Promise<NormalizedGPSLocation[]>;

  getVehicleLocation(
    externalVehicleId: string
  ): Promise<NormalizedGPSLocation>;
}
```

Provider implementation:

```text
GPSProviderAdapter
       │
       ├── VendorAAdapter
       ├── VendorBAdapter
       └── GenericHTTPAdapter
```

---

# 28. RFID Service

```typescript
interface RFIDService {

  assignCard(
    studentId: string,
    cardId: string
  ): Promise<void>;

  processScan(
    scan: RFIDScan
  ): Promise<JourneyEventResult>;

  validateCard(
    cardId: string
  ): Promise<Student | null>;
}
```

RFID scan:

```typescript
interface RFIDScan {
  cardId: string;
  deviceId: string;
  tripId: string;
  timestamp: string;
}
```

---

# 29. RFID Processing Logic

```text
RFID Scan (via RFIDReaderAdapter → canonical RFIDScan)
   │
   ▼
Find Card (UID lookup — card itself contains no PII — ADR-9)
   │
   ├── Not Found → Reject
   │
   ▼
Find Student
   │
   ▼
Check Active Trip
   │
   ├── No Trip → Exception
   │
   ▼
Check Student Manifest
   │
   ├── Not Assigned → WRONG_BUS exception
   │
   ▼
Check Idempotency Key (UUID v7 — ADR-6)
   │
   ├── Already Processed → Return previous result (DUPLICATE_SCAN)
   │
   ▼
Create BOARDING Event
   │
   ▼
Update Journey State (EXPECTED/BOARDING_PENDING → BOARDED)
   │
   ▼
Create Notification
```

---

# 30. Journey State Machine

### Initial state

```text
EXPECTED
```

Boarding:

```text
EXPECTED
    ↓
BOARDED
```

After boarding:

```text
BOARDED
    ↓
ONBOARD
```

Near expected exit:

```text
ONBOARD
    ↓
EXIT_PENDING
```

Exit:

```text
EXIT_PENDING
    ↓
EXIT_RECORDED
    ↓
COMPLETED
```

Failure:

```text
BOARDED
   ↓
EXIT_MISSING
```

Wrong location:

```text
ONBOARD
   ↓
WRONG_STOP_EXIT
```

---

# 31. State Transition Rules

Example:

```typescript
function transition(
  currentState: JourneyState,
  event: JourneyEvent
): JourneyState {

  switch (event.eventType) {

    case "STUDENT_BOARDING":

      if (
        currentState === "EXPECTED" ||
        currentState === "BOARDING_PENDING"
      ) {
        return "BOARDED";
      }

      return currentState;

    case "STUDENT_EXIT":

      if (
        currentState === "BOARDED" ||
        currentState === "ONBOARD" ||
        currentState === "EXIT_PENDING"
      ) {
        return "EXIT_RECORDED";
      }

      return currentState;

    default:
      return currentState;
  }
}
```

The actual implementation should additionally validate trip, stop, bus and assignment before permitting the transition.

---

# 32. Boarding Validation

A boarding event is valid only if:

```text
Student exists
        AND
Student is active
        AND
Trip is active
        AND
Student belongs to trip manifest
        AND
Bus matches assignment
        AND
Event isn't duplicate
```

Then:

```text
BOARDING_RECORDED
```

Otherwise:

```text
EXCEPTION_CREATED
```

---

# 33. Exit Validation

Exit should validate:

```text
Student is onboard
        AND
Trip is active
        AND
Current bus location is near assigned stop
        AND
Exit event is valid
```

For example:

```text
Expected Stop = Stop 03
Actual Location = 70m from Stop 03
```

→ Valid.

But:

```text
Expected Stop = Stop 03
Actual Location = 1.8km from Stop 03
```

→ `WRONG_STOP_EXIT`.

---

# 34. Important Safety Rule

Never implement:

```typescript
if (busReachedStop) {
  student.status = "DROPPED_OFF";
}
```

Instead:

```text
Bus reaches stop
        ↓
Stop event generated
        ↓
Check students expected at stop
        ↓
Wait for exit verification
        ↓
Unverified students
        ↓
EXIT_MISSING exception
```

This is central to the product's accountability model.

---

# 35. Offline Sync Engine

Mobile application:

```text
RFID Scan
   ↓
Validate locally
   ↓
SQLite INSERT
   ↓
syncStatus = PENDING
```

Background sync:

```text
Network Available?
       │
       ├── NO → Wait
       │
       └── YES
            ↓
        Fetch PENDING
            ↓
        Batch API
            ↓
       Server Response
            ↓
       ┌────┴────┐
       ▼         ▼
   Accepted    Rejected
       │         │
    SYNCED     FAILED
```

Retry strategy:

```text
1st retry → 5 seconds
2nd retry → 30 seconds
3rd retry → 2 minutes
4th retry → 10 minutes
```

Use exponential backoff with a maximum retry interval.

---

# 36. Offline Event Ordering

Events must preserve device order.

Example:

```text
07:12:01 → Student A boarded
07:12:05 → Student B boarded
07:12:12 → Student C boarded
```

Even if network synchronization occurs later:

```text
07:30 → all three events uploaded
```

the original timestamps remain:

```text
07:12:01
07:12:05
07:12:12
```

---

# 37. Duplicate Event Handling

Every event has an `idempotencyKey` using **UUID v7** format (see ADR-6).

Example:

```text
018e4c92-b1a7-7000-9d3f-2a4c8f1b3e7a
```

The producer (attendant device or server) generates the UUID v7 at the moment the event is first created. For offline events, this is at RFID scan time on the device.

**Key rule:** Retries of the same logical event MUST reuse the same `idempotency_key`. Never regenerate it on retry.

Database:

```sql
UNIQUE(idempotency_key)
```

If the device retries:

```text
Same event
      ↓
Same idempotencyKey (UUID v7, unchanged)
      ↓
Database detects duplicate
      ↓
Return previous result
```

No duplicate journey record is created.

---

# 38. GPS Location Storage

GPS locations:

```typescript
interface GPSLocation {
  id: string;

  busId: string;

  /**
   * Intentionally denormalized from buses.school_id.
   * Required for direct RLS enforcement on gps_locations without join-based lookups.
   * See ADR-11.
   */
  schoolId: string;

  latitude: number;
  longitude: number;

  location: GeoJSONPoint;

  speed?: number;
  heading?: number;
  accuracy?: number;

  /**
   * Timestamp from the GPS device itself.
   * Preserved throughout ingestion. Never overwritten.
   */
  recordedAt: string;

  /**
   * Timestamp when the server received/ingested this location.
   * Used to calculate GPS freshness (ADR-8): stale if receivedAt - recordedAt > threshold.
   */
  receivedAt: string;
}
```

Keep raw historical GPS data separately from current vehicle state.

---

# 39. Current Bus State

For fast dashboard queries:

```typescript
interface CurrentBusState {
  busId: string;

  latitude: number;
  longitude: number;

  speed?: number;
  heading?: number;

  currentStopId?: string;

  tripId?: string;

  status:
    | "MOVING"
    | "STOPPED"
    | "OFFLINE"
    | "IDLE";

  lastUpdatedAt: string;
}
```

The dashboard should query this rather than scanning millions of GPS records.

---

# 40. Realtime Channels

Use logical channels such as:

```text
school:{schoolId}:fleet
trip:{tripId}
bus:{busId}
student:{studentId}
```

Access must be authorized.

Example:

```text
school:ABC:fleet
```

can only be subscribed to by authorized school users.

A parent should not receive the entire school's fleet channel.

---

# 41. Parent API

Parent:

```text
GET /api/v1/parent/children
GET /api/v1/parent/children/:id/journey
GET /api/v1/parent/children/:id/bus
GET /api/v1/parent/children/:id/notifications
```

The backend derives the permitted child IDs from the authenticated user.

The client must **not** be trusted to supply arbitrary student IDs.

---

# 42. Admin Dashboard Data

Dashboard endpoint:

```text
GET /api/v1/dashboard/overview
```

Response:

```json
{
  "activeBuses": 18,
  "totalStudents": 746,
  "studentsOnJourney": 732,
  "openExceptions": 14,
  "gpsOffline": 1
}
```

Live fleet:

```text
GET /api/v1/fleet/live
```

Returns:

```json
[
  {
    "busId": "BUS_007",
    "tripId": "TRIP_001",
    "latitude": 28.628,
    "longitude": 77.376,
    "status": "MOVING",
    "studentsOnboard": 32
  }
]
```

---

# 43. Notification Data Model

```typescript
interface Notification {
  id: string;

  userId: string;
  schoolId: string;

  type:
    | "BOARDING"
    | "EXIT"
    | "BUS_APPROACHING"
    | "DELAY"
    | "EXCEPTION";

  title: string;
  body: string;

  readAt?: string;

  createdAt: string;
}
```

---

# 44. Notification Rules

Example:

```text
STUDENT_BOARDING
       ↓
Find guardians
       ↓
notificationEnabled?
       ↓
YES
       ↓
FCM
```

For exception:

```text
EXIT_MISSING
       ↓
School transport manager
       ↓
Critical notification
```

Avoid sending parents every low-level technical event.

---

# 45. Authentication

Supabase Auth handles authentication.

Application profile:

```text
auth.users
     │
     ▼
profiles
     │
     ▼
user_roles
     │
     ▼
school membership
```

Example:

```text
User
 ├── userId
 ├── schoolId
 └── role
```

---

# 46. Authorization

Use both application-level authorization and database RLS.

Example policy concept:

```text
school_id = authenticated user's school_id
```

Parent policy:

```text
student_id belongs to authenticated guardian
```

Attendant policy:

```text
trip_id assigned to authenticated attendant
```

Admin policy:

```text
school_id matches authenticated administrator
```

---

# 47. Audit Log

Every privileged operation creates an audit record.

```typescript
interface AuditLog {
  id: string;

  schoolId: string;
  actorUserId?: string;

  action: string;

  entityType: string;
  entityId: string;

  before?: unknown;
  after?: unknown;

  reason?: string;

  createdAt: string;
}
```

Examples:

```text
STUDENT_CREATED
STUDENT_UPDATED
RFID_ASSIGNED
TRIP_STARTED
MANUAL_EXIT_RECORDED
EXCEPTION_RESOLVED
ROUTE_UPDATED
```

---

# 48. Manual Attendance Override

Manual override must never silently change history.

Example:

```text
Student
EXIT_MISSING

Admin:
"Verified student was dropped off manually."

```

System creates:

```text
MANUAL_ATTENDANCE_OVERRIDE
```

with:

```text
actor
timestamp
reason
previous state
new state
```

Original RFID/GPS events remain untouched.

---

# 49. Error Handling

Standard API response:

```json
{
  "success": false,
  "error": {
    "code": "STUDENT_NOT_ASSIGNED_TO_TRIP",
    "message": "Student is not assigned to this trip."
  },
  "requestId": "REQ_123"
}
```

Error codes should be machine-readable.

Examples:

```text
AUTH_REQUIRED
FORBIDDEN
STUDENT_NOT_FOUND
BUS_NOT_FOUND
TRIP_NOT_ACTIVE
STUDENT_NOT_ASSIGNED
DUPLICATE_EVENT
INVALID_RFID
INVALID_GPS_DATA
SYNC_CONFLICT
INTERNAL_ERROR
```

---

# 50. API Validation

Use Zod.

Example:

```typescript
const JourneyEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum([
    "STUDENT_BOARDING",
    "STUDENT_EXIT"
  ]),
  tripId: z.string().uuid(),
  studentId: z.string().uuid(),
  busId: z.string().uuid(),
  eventTimestamp: z.string().datetime(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});
```

Never trust frontend validation alone.

The backend validates again.

---

# 51. Service Layer

Backend functions should not contain everything in one handler.

Bad:

```text
journey-events/index.ts
    1000 lines
```

Instead:

```text
journey-events/
│
├── handler.ts
├── validator.ts
├── service.ts
├── repository.ts
├── state-machine.ts
├── exception-service.ts
└── notification-service.ts
```

Flow:

```text
HTTP Handler
     ↓
Validator
     ↓
Journey Service
     ↓
Repository
     ↓
Database
```

---

# 52. Repository Pattern

Example:

```typescript
interface JourneyEventRepository {

  create(
    event: JourneyEvent
  ): Promise<JourneyEvent>;

  findByIdempotencyKey(
    key: string
  ): Promise<JourneyEvent | null>;

  findByTrip(
    tripId: string
  ): Promise<JourneyEvent[]>;
}
```

This prevents database code from spreading throughout business logic.

---

# 53. Journey Service

```typescript
class JourneyService {

  async processEvent(
    event: JourneyEvent
  ): Promise<JourneyEventResult> {

    await validateEvent(event);

    const existing =
      await repository.findByIdempotencyKey(
        event.idempotencyKey
      );

    if (existing) {
      return existingResult(existing);
    }

    const state =
      await stateMachine.process(event);

    await repository.create(event);

    await updateJourneyState(state);

    await evaluateExceptions(event, state);

    await triggerNotifications(event, state);

    return result(state);
  }
}
```

---

# 54. Exception Engine

```typescript
class ExceptionEngine {

  evaluateBoarding(
    tripStudent: TripStudent,
    event: JourneyEvent
  ): Exception | null;

  evaluateExit(
    tripStudent: TripStudent,
    event: JourneyEvent
  ): Exception | null;

  evaluateGPS(
    busState: CurrentBusState
  ): Exception | null;
}
```

Rules remain deterministic.

---

# 55. Stop Detection

When GPS arrives:

```text
GPS location
     ↓
Find nearby stops
     ↓
Check active trip route
     ↓
Check geofence
     ↓
Bus entered?
     ↓
Generate BUS_REACHED_STOP
```

PostGIS can perform the spatial query.

Conceptually:

```sql
ST_DWithin(
  bus_location,
  stop_location,
  geofence_radius
)
```

---

# 56. Wrong Stop Exit Detection

```text
Student expected Stop 03

Bus reaches Stop 03
       ↓
Student exits
       ↓
Compare actual stop
       ↓
Expected = Stop 03
Actual = Stop 03
       ↓
VALID
```

But:

```text
Expected = Stop 03
Actual = Stop 05
       ↓
WRONG_STOP_EXIT
```

---

# 57. Boarding Exception

At trip completion:

```text
Trip Manifest
     ↓
Find students
     ↓
boarded = false
     ↓
BOARDING_MISSING
```

Example:

```text
Assigned = 40
Boarded = 38

Missing = 2
```

Dashboard:

```text
Boarding Exceptions: 2
```

---

# 58. Exit Exception

After the trip reaches the relevant stops:

```text
Boarded students
       ↓
Bus reaches assigned stop (BUS_REACHED_STOP)
       ↓
Grace period timer starts (default: 5 minutes)
       ↓
No valid STUDENT_EXIT event within grace period?
       ↓
EXIT_MISSING exception raised
```

**MVP Grace Period: 5 minutes** (configurable via `exit_missing_grace_period_seconds` policy setting — ADR-7).

This must NOT be triggered immediately at stop arrival. The grace period accounts for realistic operational latency.

The grace period is suppressible if a `MANUAL_ATTENDANCE_OVERRIDE` event is recorded before it expires.

The grace period value MUST be read from a central policy/configuration source. It must NOT be hard-coded in the codebase.

---

# 59. Trip Completion

```text
Attendant → End Journey
             ↓
      Verify manifest
             ↓
      Process unresolved
             ↓
      Generate exceptions
             ↓
      Mark trip COMPLETED
             ↓
      Generate report
```

A trip should not simply disappear when the attendant presses "End".

---

# 60. Mobile Screen Architecture

## Attendant

```text
Login
 ↓
Assigned Trip
 ↓
Trip Dashboard
 ├── Start Journey
 ├── Boarding Mode
 ├── Student Manifest
 ├── Exit Mode
 ├── Route & Stops
 └── End Journey
```

## Parent

```text
Login
 ↓
Children
 ↓
Child Journey
 ├── Boarding Status
 ├── Bus Location
 ├── ETA
 ├── Journey Timeline
 └── Notifications
```

---

# 61. Attendant Boarding Flow

```text
Attendant opens trip
        ↓
Start Journey
        ↓
Trip becomes IN_PROGRESS
        ↓
Boarding Mode
        ↓
Scan RFID
        ↓
Local validation
        ↓
Store event
        ↓
Success feedback
        ↓
Sync
```

The RFID scan interaction should provide:

```text
Green
✓ Student boarded
```

or:

```text
Amber
! Duplicate scan
```

or:

```text
Red
× Student not assigned
```

---

# 62. Parent Journey Flow

```text
Parent opens app
        ↓
Select child
        ↓
Fetch active journey
        ↓
Show state
        ↓
Subscribe to permitted realtime updates
        ↓
Bus location updates
        ↓
ETA updates
        ↓
Boarding / exit notification
```

---

# 63. Admin Live Fleet Flow

```text
Admin Dashboard
       ↓
Fetch active trips
       ↓
Fetch current bus states
       ↓
Render map
       ↓
Realtime subscription
       ↓
GPS update
       ↓
Update bus marker
```

Do not reload the entire dashboard for every GPS update.

---

# 64. Security Boundaries

```text
                    Internet
                       │
                       ▼
                Authentication
                       │
                       ▼
                 API Validation
                       │
                       ▼
                 Authorization
                       │
                       ▼
                  Tenant Check
                       │
                       ▼
                    RLS
                       │
                       ▼
                  PostgreSQL
```

---

# 65. Secrets

Never put:

```text
SUPABASE_SERVICE_ROLE_KEY
GPS_VENDOR_SECRET
FCM_SERVER_SECRET
```

inside frontend/mobile code.

Frontend gets only public configuration such as:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

Server secrets remain in Edge Function environment variables.

---

# 66. Testing Structure

## Unit tests

Test:

```text
State transitions
GPS calculations
Geofence logic
Exception rules
Validation
Permission rules
```

Example:

```text
EXPECTED + BOARDING
→ BOARDED

BOARDED + EXIT
→ EXIT_RECORDED

EXIT at wrong stop
→ WRONG_STOP_EXIT
```

---

# 67. Integration Tests

Test complete flows:

```text
RFID
 ↓
API
 ↓
Journey Event
 ↓
Journey State
 ↓
Exception
 ↓
Notification
```

GPS:

```text
GPS Provider
 ↓
Adapter
 ↓
Normalized Event
 ↓
PostGIS
 ↓
Stop Detection
```

---

# 68. E2E Tests

Playwright:

```text
Admin Login
 ↓
Create Student
 ↓
Create Bus
 ↓
Create Route
 ↓
Assign Student
 ↓
Create Trip
 ↓
View Journey
```

Mobile:

```text
Attendant Login
 ↓
Start Trip
 ↓
Scan Student
 ↓
Student becomes BOARDED
 ↓
Parent receives update
```

---

# 69. Performance Targets for MVP

Initial engineering targets:

```text
Normal API response:
< 300 ms

RFID event processing:
< 1 second under normal connectivity

Dashboard realtime update:
~1–3 seconds depending on GPS/provider latency

Offline event:
0 events intentionally lost

Duplicate event:
0 duplicate journey records
```

These are **engineering targets**, not guarantees.

---

# 70. Critical Failure Scenarios

### Internet unavailable

```text
RFID
 ↓
SQLite
 ↓
Pending
 ↓
Sync later
```

### GPS unavailable

```text
GPS offline
 ↓
Create GPS_UNAVAILABLE
 ↓
RFID continues
```

### RFID unavailable

```text
RFID failure
 ↓
Attendant notified
 ↓
Controlled manual verification
 ↓
Audit log
```

### Backend unavailable

```text
Mobile
 ↓
Offline queue
 ↓
Retry
```

### Duplicate scan

```text
Duplicate
 ↓
Idempotency check
 ↓
No duplicate event
```

---

# 71. Data Retention Architecture

Separate operational and historical data.

```text
Operational
────────────
current_bus_state
active_trip
current_journey_state

Historical
──────────
journey_events
gps_locations
audit_logs
notifications
```

This keeps frequently accessed tables small and fast.

Retention periods should ultimately be configurable based on the school's contractual and legal requirements.

---

# 72. Reporting

Reports should be generated from historical events rather than mutable UI state.

Examples:

```text
Daily Trip Report
Student Journey Report
Boarding Report
Exit Report
Exception Report
GPS Availability Report
Bus Utilization Report
```

Example:

```text
Student
  ↓
Trip
  ↓
Boarding Event
  ↓
Exit Event
  ↓
Journey Duration
  ↓
Journey Status
```

---

# 73. Final End-to-End Flow

The complete system can be reduced to:

```text
                    SCHOOL
                       │
                       ▼
                CREATE STUDENT
                       │
                       ▼
                 ASSIGN RFID
                       │
                       ▼
                 ASSIGN ROUTE
                       │
                       ▼
                 ASSIGN STOP
                       │
                       ▼
                  CREATE TRIP
                       │
                       ▼
             ┌─────────────────┐
             │    BUS STARTS   │
             └────────┬────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
        GPS                     RFID
          │                       │
          ▼                       ▼
   Bus Location             Student Event
          │                       │
          └───────────┬───────────┘
                      ▼
               JOURNEY ENGINE
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       STATE       EXCEPTION    AUDIT
       UPDATE       ENGINE       LOG
          │           │
          └─────┬─────┘
                ▼
         NOTIFICATION
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
     SCHOOL   PARENT   ATTENDANT
```

# 74. The Core Implementation Rule

The most important LLD decision is this:

```text
                 RAW EVENTS
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
      GPS                         RFID
       │                           │
       └─────────────┬─────────────┘
                     ▼
              EVENT PROCESSOR
                     │
                     ▼
              STATE MACHINE
                     │
                     ▼
              EXCEPTION ENGINE
                     │
             ┌───────┴───────┐
             ▼               ▼
          CURRENT          HISTORY
           STATE             EVENTS
             │               │
             └───────┬───────┘
                     ▼
             APPLICATION UI
```

**GPS and RFID are data sources. They should not contain the core business logic.**

The **Journey Engine** is the heart of the system.

That gives us a clean separation:

```text
UI
 ↓
API
 ↓
Domain Services
 ↓
Journey Engine
 ↓
Events + State
 ↓
Database
```

This LLD is detailed enough to start implementation without prematurely introducing microservices, Kafka, Kubernetes, Redis, or paid infrastructure.