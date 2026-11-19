import { ApiClient, ApiClientError } from '@school-transport-platform/client-sdk';
import {
  Bus,
  GPSLocation,
  JourneyException,
  Route,
  Student,
  Stop,
} from '@school-transport-platform/shared-types';

const schoolId = '11111111-1111-4111-8111-111111111111';
const routeId = '77777777-7777-4777-8777-777777777701';
const busId = '66666666-6666-4666-8666-666666666612';
const tripId = '55555555-5555-4555-8555-555555555501';
const now = new Date().toISOString();

const stops: Stop[] = [
  {
    id: '88888888-8888-4888-8888-888888888801',
    routeId,
    name: 'Demo Stop 1: Sector 62 Metro Gate',
    latitude: 28.628,
    longitude: 77.3649,
    sequence: 1,
    geofenceRadiusMeters: 75,
    expectedArrivalTime: '07:15',
  },
  {
    id: '88888888-8888-4888-8888-888888888802',
    routeId,
    name: 'Demo Stop 2: Shipra Sun City Gate',
    latitude: 28.636,
    longitude: 77.3715,
    sequence: 2,
    geofenceRadiusMeters: 75,
    expectedArrivalTime: '07:25',
  },
  {
    id: '88888888-8888-4888-8888-888888888803',
    routeId,
    name: 'Demo Stop 3: Indirapuram Habitat Centre',
    latitude: 28.641,
    longitude: 77.378,
    sequence: 3,
    geofenceRadiusMeters: 75,
    expectedArrivalTime: '07:35',
  },
];

const route: Route & { stops: Stop[] } = {
  id: routeId,
  schoolId,
  name: 'Demo North Corridor',
  code: 'DEMO-N-01',
  direction: 'MORNING',
  status: 'ACTIVE',
  description: 'Synthetic route for product preview only.',
  createdAt: now,
  stops,
};

const students = [
  {
    id: 'c1111111-1111-4111-8111-111111111101',
    schoolId,
    admissionNumber: 'DEMO-2026-001',
    firstName: 'Aarav',
    lastName: 'Sharma',
    className: 'Grade 5',
    section: 'A',
    status: 'ACTIVE',
    createdAt: now,
    assignment: { routeId, stopId: stops[0].id },
  },
  {
    id: 'c1111111-1111-4111-8111-111111111102',
    schoolId,
    admissionNumber: 'DEMO-2026-002',
    firstName: 'Diya',
    lastName: 'Patel',
    className: 'Grade 2',
    section: 'B',
    status: 'ACTIVE',
    createdAt: now,
    assignment: { routeId, stopId: stops[1].id },
  },
  {
    id: 'c1111111-1111-4111-8111-111111111103',
    schoolId,
    admissionNumber: 'DEMO-2026-003',
    firstName: 'Kabir',
    lastName: 'Mehta',
    className: 'Grade 7',
    section: 'C',
    status: 'ACTIVE',
    createdAt: now,
    assignment: { routeId, stopId: stops[2].id },
  },
] satisfies Array<Student & { assignment: { routeId: string; stopId: string } }>;

const location: GPSLocation = {
  id: 'demo-location-bus-12',
  busId,
  schoolId,
  latitude: 28.632,
  longitude: 77.368,
  location: { type: 'Point', coordinates: [77.368, 28.632] },
  speed: 28,
  heading: 84,
  accuracy: 10,
  recordedAt: now,
  receivedAt: now,
};

const buses: Array<Bus & { latestLocation: GPSLocation | null }> = [
  {
    id: busId,
    schoolId,
    registrationNumber: 'DEMO-00-001',
    fleetNumber: 'DEMO-BUS-12',
    capacity: 40,
    status: 'ACTIVE',
    activeGpsDeviceId: 'demo-gps-12',
    activeRfidDeviceId: 'demo-rfid-12',
    latestLocation: location,
  },
  {
    id: '66666666-6666-4666-8666-666666666608',
    schoolId,
    registrationNumber: 'DEMO-00-002',
    fleetNumber: 'DEMO-BUS-08',
    capacity: 35,
    status: 'ACTIVE',
    latestLocation: null,
  },
  {
    id: '66666666-6666-4666-8666-666666666604',
    schoolId,
    registrationNumber: 'DEMO-00-003',
    fleetNumber: 'DEMO-BUS-04',
    capacity: 30,
    status: 'MAINTENANCE',
    latestLocation: null,
  },
];

const trips = [
  {
    id: tripId,
    schoolId,
    routeId,
    busId,
    tripDate: now.slice(0, 10),
    direction: 'MORNING',
    status: 'IN_PROGRESS',
    startedAt: now,
    busFleetNumber: 'DEMO-BUS-12',
    routeName: route.name,
    totalStudents: 3,
    boardedCount: 1,
    exitedCount: 0,
  },
  {
    id: '55555555-5555-4555-8555-555555555502',
    schoolId,
    routeId,
    busId: buses[1].id,
    tripDate: now.slice(0, 10),
    direction: 'MORNING',
    status: 'SCHEDULED',
    busFleetNumber: 'DEMO-BUS-08',
    routeName: route.name,
    totalStudents: 0,
    boardedCount: 0,
    exitedCount: 0,
  },
];

const journeys = students.map((student, index) => ({
  id: `${tripId}:${student.id}`,
  tripId,
  student: {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    admissionNumber: student.admissionNumber,
    className: student.className,
    section: student.section,
  },
  bus: { fleetNumber: 'DEMO-BUS-12', registrationNumber: 'DEMO-00-001' },
  route: { name: route.name },
  state: index === 0 ? 'ONBOARD' : 'EXPECTED',
  boardingStatus: index === 0 ? 'BOARDED' : 'PENDING',
  exitStatus: 'PENDING',
  boardedAt: index === 0 ? now : undefined,
  location: {
    latitude: location.latitude,
    longitude: location.longitude,
    recordedAt: location.recordedAt,
  },
  tripStatus: 'IN_PROGRESS',
}));

const exceptions: JourneyException[] = [
  {
    id: 'demo-exception-gps-01',
    schoolId,
    tripId,
    busId,
    type: 'GPS_UNAVAILABLE',
    severity: 'WARNING',
    status: 'OPEN',
    description: 'Sample alert: GPS signal has not refreshed within the preview threshold.',
    metadata: { demo: true },
    createdAt: now,
  },
];

const responses: Record<string, unknown> = {
  '/api/v1/dashboard/overview': {
    activeBuses: 2,
    totalBuses: buses.length,
    totalStudents: students.length,
    accountedStudents: 1,
    manifestStudents: students.length,
    studentsOnboard: 1,
    openExceptions: exceptions.length,
    recentIncidents: exceptions,
  },
  '/api/v1/buses': buses,
  '/api/v1/trips': trips,
  '/api/v1/journeys': journeys,
  '/api/v1/students': students,
  '/api/v1/routes': [route],
  '/api/v1/stops': stops,
  '/api/v1/exceptions': exceptions,
  '/api/v1/audit-logs': [],
  '/api/v1/health': { status: 'DEMO', timestamp: now },
  '/api/v1/reports/summary': {
    demo: true,
    students: students.length,
    buses: buses.length,
    routes: 1,
    journeys: journeys.length,
  },
  '/api/v1/settings': {
    schoolId,
    schoolName: 'Sample School (Demo)',
    gpsFreshnessSeconds: 60,
    geofenceRadiusMeters: 75,
  },
  '/api/v1/staff': [],
  '/api/v1/notifications/outbox': [],
};

export class PreviewDemoApiClient extends ApiClient {
  public override async request<T>(
    endpoint: string,
    options: { method?: string; body?: unknown } = {}
  ): Promise<T> {
    if ((options.method || 'GET').toUpperCase() !== 'GET') {
      throw new ApiClientError(
        'This isolated preview uses sample data. Operational changes are disabled.',
        403,
        'DEMO_READ_ONLY'
      );
    }

    const path = new URL(endpoint, 'https://preview-demo.invalid').pathname;
    if (!(path in responses)) {
      throw new ApiClientError(`No sample data is available for ${path}.`, 404, 'DEMO_DATA_NOT_FOUND');
    }

    return structuredClone(responses[path]) as T;
  }
}
