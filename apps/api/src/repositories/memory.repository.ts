import {
  School,
  Student,
  Bus,
  GPSDevice,
  RFIDDevice,
  Route,
  Stop,
  StudentRouteAssignment,
  Trip,
  TripStudent,
  JourneyEvent,
  StudentJourneyState,
  JourneyException,
  Notification,
  AuditLog,
  GPSLocation,
  Guardian,
  User,
  AuthContext,
  NotificationOutboxItem,
  PlatformSettings,
  BusMaintenanceRecord,
  StaffProfile,
} from '@school-transport-platform/shared-types';
import { isWithinGeofence } from '@school-transport-platform/utils';
import {
  ISchoolRepository,
  IBusRepository,
  IDeviceRepository,
  IRouteRepository,
  ITripRepository,
  IStudentRepository,
  IJourneyRepository,
  IGpsRepository,
  IExceptionRepository,
  INotificationRepository,
  IAuditRepository,
  IUserRepository,
  ISettingsRepository,
  IMaintenanceRepository,
  IStaffRepository,
  INotificationOutboxRepository,
  IRepositoryContainer,
} from './interfaces';

export class MemoryDatabase {
  public schools = new Map<string, School>();
  public buses = new Map<string, Bus>();
  public gpsDevices = new Map<string, GPSDevice>();
  public rfidDevices = new Map<string, RFIDDevice>();
  public routes = new Map<string, Route>();
  public stops = new Map<string, Stop>();
  public trips = new Map<string, Trip>();
  public tripStudents = new Map<string, TripStudent>();
  public students = new Map<string, Student>();
  public assignments = new Map<string, StudentRouteAssignment>();
  public guardians = new Map<string, Guardian>();
  public journeyEvents = new Map<string, JourneyEvent>();
  public journeyEventKeys = new Map<string, JourneyEvent>();
  public journeyStates = new Map<string, StudentJourneyState>();
  public gpsLocations: GPSLocation[] = [];
  public exceptions = new Map<string, JourneyException>();
  public notifications = new Map<string, Notification>();
  public auditLogs: AuditLog[] = [];
  public users = new Map<string, User>();
  public authContexts = new Map<string, AuthContext>();
  public settings = new Map<string, PlatformSettings>();
  public maintenance = new Map<string, BusMaintenanceRecord>();
  public staff = new Map<string, StaffProfile>();
  public outbox = new Map<string, NotificationOutboxItem>();
  public parentInvitationCodes = new Map<
    string,
    { admissionNumber: string; studentId: string; schoolId: string; claimedByUserId?: string }
  >();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const schoolId = '11111111-1111-1111-1111-111111111111';
    this.schools.set(schoolId, {
      id: schoolId,
      name: 'Delhi Public International School (Noida)',
      code: 'DPIS-NOIDA',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.settings.set(schoolId, {
      schoolId,
      schoolName: 'Delhi Public International School (Noida)',
      gpsFreshnessSeconds: 60,
      gpsStaleSeconds: 120,
      geofenceRadiusMeters: 75,
      mapTileProvider: 'carto-dark',
      fcmEnabled: true,
      dataRetentionDays: 90,
      updatedAt: new Date().toISOString(),
    });

    // Default Buses
    const bus12Id = '66666666-6666-6666-6666-666666666612';
    const bus08Id = '66666666-6666-6666-6666-666666666608';
    const bus04Id = '66666666-6666-6666-6666-666666666604';

    this.buses.set(bus12Id, {
      id: bus12Id,
      schoolId,
      registrationNumber: 'UP-16-BT-9912',
      fleetNumber: 'BUS-12',
      capacity: 40,
      status: 'ACTIVE',
      activeGpsDeviceId: 'gps_bus12',
      activeRfidDeviceId: 'rfid_bus12',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.buses.set(bus08Id, {
      id: bus08Id,
      schoolId,
      registrationNumber: 'UP-16-BT-9908',
      fleetNumber: 'BUS-08',
      capacity: 40,
      status: 'ACTIVE',
      activeGpsDeviceId: 'gps_bus08',
      activeRfidDeviceId: 'rfid_bus08',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.buses.set(bus04Id, {
      id: bus04Id,
      schoolId,
      registrationNumber: 'UP-16-BT-9904',
      fleetNumber: 'BUS-04',
      capacity: 32,
      status: 'MAINTENANCE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Default GPS Devices
    this.gpsDevices.set('gps_bus12', {
      id: 'gps_bus12',
      busId: bus12Id,
      schoolId,
      provider: 'TRACCAR',
      externalDeviceId: '860123456789012', // Commercial Tracker IMEI
      status: 'ONLINE',
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    this.gpsDevices.set('gps_bus08', {
      id: 'gps_bus08',
      busId: bus08Id,
      schoolId,
      provider: 'TRACCAR',
      externalDeviceId: '860123456789008',
      status: 'ONLINE',
      lastSeenAt: new Date(Date.now() - 35000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Initial GPS Location for Bus 12
    this.gpsLocations.push({
      id: 'loc_bus12_initial',
      busId: bus12Id,
      schoolId,
      latitude: 28.6320,
      longitude: 77.3680,
      location: { type: 'Point', coordinates: [77.3680, 28.6320] },
      speed: 38,
      heading: 84,
      accuracy: 8,
      recordedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    });

    // Default Route & Stops
    const routeId = '77777777-7777-7777-7777-777777777701';
    this.routes.set(routeId, {
      id: routeId,
      schoolId,
      name: 'North Expressway - Sector 62 Corridor',
      code: 'NE-01',
      direction: 'MORNING',
      createdAt: new Date().toISOString(),
    });

    const stop1Id = '88888888-8888-8888-8888-888888888801';
    const stop2Id = '88888888-8888-8888-8888-888888888802';
    const stop3Id = '88888888-8888-8888-8888-888888888803';
    const stop4Id = '88888888-8888-8888-8888-888888888804';

    this.stops.set(stop1Id, {
      id: stop1Id,
      routeId,
      name: 'Stop 1: Sector 62 Metro Gate #2',
      latitude: 28.6280,
      longitude: 77.3649,
      sequence: 1,
      geofenceRadiusMeters: 75,
      expectedArrivalTime: '07:15',
    });

    this.stops.set(stop2Id, {
      id: stop2Id,
      routeId,
      name: 'Stop 2: Shipra Sun City Gate #4',
      latitude: 28.6360,
      longitude: 77.3715,
      sequence: 2,
      geofenceRadiusMeters: 75,
      expectedArrivalTime: '07:25',
    });

    this.stops.set(stop3Id, {
      id: stop3Id,
      routeId,
      name: 'Stop 3: Indirapuram Habitat Centre',
      latitude: 28.6410,
      longitude: 77.3780,
      sequence: 3,
      geofenceRadiusMeters: 75,
      expectedArrivalTime: '07:35',
    });

    this.stops.set(stop4Id, {
      id: stop4Id,
      routeId,
      name: 'Terminus: DPIS Main Campus',
      latitude: 28.6495,
      longitude: 77.3890,
      sequence: 4,
      geofenceRadiusMeters: 100,
      expectedArrivalTime: '07:55',
    });

    // Default Students
    const student1Id = 'c1111111-1111-1111-1111-111111111101';
    const student2Id = 'c1111111-1111-1111-1111-111111111102';
    const student3Id = 'c1111111-1111-1111-1111-111111111103';

    this.students.set(student1Id, {
      id: student1Id,
      schoolId,
      admissionNumber: 'ADM-2024-001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      className: 'Grade 5',
      section: 'A',
      rfidCardId: 'RFID-AARAV-001',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.students.set(student2Id, {
      id: student2Id,
      schoolId,
      admissionNumber: 'ADM-2024-002',
      firstName: 'Diya',
      lastName: 'Sharma',
      className: 'Grade 2',
      section: 'B',
      rfidCardId: 'RFID-DIYA-002',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.students.set(student3Id, {
      id: student3Id,
      schoolId,
      admissionNumber: 'ADM-2024-003',
      firstName: 'Kabir',
      lastName: 'Mehta',
      className: 'Grade 7',
      section: 'C',
      rfidCardId: 'RFID-KABIR-003',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Default Route Assignments
    this.assignments.set(student1Id, {
      id: 'asgn_01',
      studentId: student1Id,
      routeId,
      stopId: stop1Id,
      effectiveFrom: '2026-01-01',
      createdAt: new Date().toISOString(),
    });

    this.assignments.set(student2Id, {
      id: 'asgn_02',
      studentId: student2Id,
      routeId,
      stopId: stop2Id,
      effectiveFrom: '2026-01-01',
      createdAt: new Date().toISOString(),
    });

    this.assignments.set(student3Id, {
      id: 'asgn_03',
      studentId: student3Id,
      routeId,
      stopId: stop3Id,
      effectiveFrom: '2026-01-01',
      createdAt: new Date().toISOString(),
    });

    // Parent Invitation Codes for Secure Linking
    this.parentInvitationCodes.set('AEGIS-9912', {
      admissionNumber: 'ADM-2024-001',
      studentId: student1Id,
      schoolId,
    });
    this.parentInvitationCodes.set('AEGIS-9913', {
      admissionNumber: 'ADM-2024-002',
      studentId: student2Id,
      schoolId,
    });

    // Default Parent User
    const parentUserId = '55555555-5555-5555-5555-555555555555';
    this.users.set(parentUserId, {
      id: parentUserId,
      schoolId,
      firstName: 'Vikram',
      lastName: 'Sharma',
      phone: '+919811223344',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.guardians.set('g_01', {
      id: 'g_01',
      userId: parentUserId,
      studentId: student1Id,
      relationship: 'FATHER',
      isEmergencyContact: true,
      canPickup: true,
      createdAt: new Date().toISOString(),
    });

    this.guardians.set('g_02', {
      id: 'g_02',
      userId: parentUserId,
      studentId: student2Id,
      relationship: 'FATHER',
      isEmergencyContact: true,
      canPickup: true,
      createdAt: new Date().toISOString(),
    });

    // Default Staff
    this.staff.set('staff_driver_01', {
      id: 'staff_driver_01',
      userId: '33333333-3333-3333-3333-333333333333',
      schoolId,
      role: 'DRIVER',
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      licenseNumber: 'DL-UP16-2015-8821',
      assignedBusId: bus12Id,
      assignedRouteId: routeId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    this.staff.set('staff_attendant_01', {
      id: 'staff_attendant_01',
      userId: '44444444-4444-4444-4444-444444444444',
      schoolId,
      role: 'ATTENDANT',
      name: 'Sunita Devi',
      phone: '+91 98765 43211',
      assignedBusId: bus12Id,
      assignedRouteId: routeId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    // Today's Active Trip
    const today = new Date().toISOString().split('T')[0];
    const tripId = '99999999-9999-9999-9999-999999999901';
    this.trips.set(tripId, {
      id: tripId,
      schoolId,
      routeId,
      busId: bus12Id,
      driverId: '33333333-3333-3333-3333-333333333333',
      attendantId: '44444444-4444-4444-4444-444444444444',
      tripDate: today,
      direction: 'MORNING',
      status: 'IN_PROGRESS',
      startedAt: new Date(Date.now() - 1800000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.tripStudents.set('ts_01', {
      id: 'ts_01',
      tripId,
      studentId: student1Id,
      expectedStopId: stop1Id,
      isBoarded: true,
      boardedAt: new Date(Date.now() - 1200000).toISOString(),
      isExited: false,
    });

    this.tripStudents.set('ts_02', {
      id: 'ts_02',
      tripId,
      studentId: student2Id,
      expectedStopId: stop2Id,
      isBoarded: true,
      boardedAt: new Date(Date.now() - 600000).toISOString(),
      isExited: false,
    });

    this.tripStudents.set('ts_03', {
      id: 'ts_03',
      tripId,
      studentId: student3Id,
      expectedStopId: stop3Id,
      isBoarded: false,
      isExited: false,
    });

    this.journeyStates.set(`${student1Id}_${tripId}`, {
      id: 'js_01',
      studentId: student1Id,
      tripId,
      state: 'ONBOARD',
      lastEventTimestamp: new Date(Date.now() - 1200000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.journeyStates.set(`${student2Id}_${tripId}`, {
      id: 'js_02',
      studentId: student2Id,
      tripId,
      state: 'ONBOARD',
      lastEventTimestamp: new Date(Date.now() - 600000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.journeyStates.set(`${student3Id}_${tripId}`, {
      id: 'js_03',
      studentId: student3Id,
      tripId,
      state: 'EXPECTED',
      lastEventTimestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Sample Maintenance Record
    this.maintenance.set('maint_01', {
      id: 'maint_01',
      busId: bus04Id,
      schoolId,
      serviceDate: today,
      serviceType: 'Brake Inspection & Filter Replacement',
      odometerReading: 48210,
      cost: 4500,
      notes: 'Scheduled 50k service. Replacing front brake pads and transmission fluid.',
      technicianName: 'Sharma Auto Works',
      createdAt: new Date().toISOString(),
    });

    // Sample Notification Outbox
    this.outbox.set('notif_out_01', {
      id: 'notif_out_01',
      schoolId,
      userId: parentUserId,
      title: 'Bus Approaching Sector 62',
      body: 'Bus 12 is approximately 2 minutes from Stop 1: Sector 62 Metro Gate #2.',
      type: 'BUS_APPROACHING',
      status: 'DELIVERED',
      retryCount: 0,
      maxRetries: 3,
      sentAt: new Date(Date.now() - 1500000).toISOString(),
      createdAt: new Date(Date.now() - 1500000).toISOString(),
    });
  }
}

export class MemorySchoolRepository implements ISchoolRepository {
  constructor(private db: MemoryDatabase) {}
  async findById(id: string): Promise<School | null> {
    return this.db.schools.get(id) || null;
  }
  async create(school: School): Promise<School> {
    this.db.schools.set(school.id, { ...school });
    return school;
  }
  async update(id: string, updates: Partial<School>): Promise<School> {
    const existing = this.db.schools.get(id);
    if (!existing) throw new Error(`School ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.db.schools.set(id, updated);
    return updated;
  }
}

export class MemoryBusRepository implements IBusRepository {
  constructor(private db: MemoryDatabase) {}
  async findById(id: string): Promise<Bus | null> {
    return this.db.buses.get(id) || null;
  }
  async findBySchool(schoolId: string): Promise<Bus[]> {
    return Array.from(this.db.buses.values()).filter((b) => b.schoolId === schoolId);
  }
  async create(bus: Bus): Promise<Bus> {
    this.db.buses.set(bus.id, { ...bus });
    return bus;
  }
  async update(id: string, updates: Partial<Bus>): Promise<Bus> {
    const existing = this.db.buses.get(id);
    if (!existing) throw new Error(`Bus ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.db.buses.set(id, updated);
    return updated;
  }
  async deleteBus(id: string): Promise<void> {
    const existing = this.db.buses.get(id);
    if (existing) {
      this.db.buses.set(id, { ...existing, status: 'INACTIVE', updatedAt: new Date().toISOString() });
    }
  }
}

export class MemoryDeviceRepository implements IDeviceRepository {
  constructor(private db: MemoryDatabase) {}
  async findGpsById(id: string): Promise<GPSDevice | null> {
    return this.db.gpsDevices.get(id) || null;
  }
  async findGpsByBus(busId: string): Promise<GPSDevice | null> {
    return Array.from(this.db.gpsDevices.values()).find((d) => d.busId === busId) || null;
  }
  async findGpsByExternalId(externalDeviceId: string): Promise<GPSDevice | null> {
    return (
      Array.from(this.db.gpsDevices.values()).find(
        (d) => d.externalDeviceId === externalDeviceId
      ) || null
    );
  }
  async listGpsBySchool(schoolId: string): Promise<GPSDevice[]> {
    return Array.from(this.db.gpsDevices.values()).filter(
      (d) => !d.schoolId || d.schoolId === schoolId
    );
  }
  async createGps(device: GPSDevice): Promise<GPSDevice> {
    this.db.gpsDevices.set(device.id, { ...device });
    return device;
  }
  async updateGps(id: string, updates: Partial<GPSDevice>): Promise<GPSDevice> {
    const existing = this.db.gpsDevices.get(id);
    if (!existing) throw new Error(`GPS device ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.gpsDevices.set(id, updated);
    return updated;
  }
  async deleteGps(id: string): Promise<void> {
    this.db.gpsDevices.delete(id);
  }

  async findRfidById(id: string): Promise<RFIDDevice | null> {
    return this.db.rfidDevices.get(id) || null;
  }
  async findRfidByBus(busId: string): Promise<RFIDDevice | null> {
    return Array.from(this.db.rfidDevices.values()).find((d) => d.busId === busId) || null;
  }
  async findRfidByReaderId(readerHardwareId: string): Promise<RFIDDevice | null> {
    return (
      Array.from(this.db.rfidDevices.values()).find(
        (d) => d.readerHardwareId === readerHardwareId
      ) || null
    );
  }
  async listRfidBySchool(schoolId: string): Promise<RFIDDevice[]> {
    return Array.from(this.db.rfidDevices.values()).filter(
      (d) => !d.schoolId || d.schoolId === schoolId
    );
  }
  async createRfid(device: RFIDDevice): Promise<RFIDDevice> {
    this.db.rfidDevices.set(device.id, { ...device });
    return device;
  }
  async updateRfid(id: string, updates: Partial<RFIDDevice>): Promise<RFIDDevice> {
    const existing = this.db.rfidDevices.get(id);
    if (!existing) throw new Error(`RFID device ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.rfidDevices.set(id, updated);
    return updated;
  }
  async deleteRfid(id: string): Promise<void> {
    this.db.rfidDevices.delete(id);
  }
}

export class MemoryRouteRepository implements IRouteRepository {
  constructor(private db: MemoryDatabase) {}
  async findRouteById(id: string): Promise<Route | null> {
    return this.db.routes.get(id) || null;
  }
  async findRoutesBySchool(schoolId: string): Promise<Route[]> {
    return Array.from(this.db.routes.values()).filter((r) => r.schoolId === schoolId);
  }
  async createRoute(route: Route): Promise<Route> {
    this.db.routes.set(route.id, { ...route });
    return route;
  }
  async updateRoute(id: string, updates: Partial<Route>): Promise<Route> {
    const existing = this.db.routes.get(id);
    if (!existing) throw new Error(`Route ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.routes.set(id, updated);
    return updated;
  }
  async deleteRoute(id: string): Promise<void> {
    this.db.routes.delete(id);
  }

  async findStopsByRoute(routeId: string): Promise<Stop[]> {
    return Array.from(this.db.stops.values())
      .filter((s) => s.routeId === routeId)
      .sort((a, b) => a.sequence - b.sequence);
  }
  async findStopById(id: string): Promise<Stop | null> {
    return this.db.stops.get(id) || null;
  }
  async createStop(stop: Stop): Promise<Stop> {
    this.db.stops.set(stop.id, { ...stop });
    return stop;
  }
  async updateStop(id: string, updates: Partial<Stop>): Promise<Stop> {
    const existing = this.db.stops.get(id);
    if (!existing) throw new Error(`Stop ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.stops.set(id, updated);
    return updated;
  }
  async deleteStop(id: string): Promise<void> {
    this.db.stops.delete(id);
  }
  async isPointWithinStopGeofence(stopId: string, latitude: number, longitude: number): Promise<boolean> {
    const stop = this.db.stops.get(stopId);
    if (!stop) return false;
    return isWithinGeofence(
      latitude,
      longitude,
      stop.latitude,
      stop.longitude,
      stop.geofenceRadiusMeters
    );
  }
}

export class MemoryTripRepository implements ITripRepository {
  constructor(private db: MemoryDatabase) {}
  async findById(id: string): Promise<Trip | null> {
    return this.db.trips.get(id) || null;
  }
  async findBySchoolAndDate(schoolId: string, date: string): Promise<Trip[]> {
    return Array.from(this.db.trips.values()).filter(
      (t) => t.schoolId === schoolId && t.tripDate === date
    );
  }
  async findActiveTripByBus(busId: string): Promise<Trip | null> {
    return (
      Array.from(this.db.trips.values()).find(
        (t) => t.busId === busId && (t.status === 'IN_PROGRESS' || t.status === 'STARTED')
      ) || null
    );
  }
  async create(trip: Trip): Promise<Trip> {
    this.db.trips.set(trip.id, { ...trip });
    return trip;
  }
  async update(id: string, updates: Partial<Trip>): Promise<Trip> {
    const existing = this.db.trips.get(id);
    if (!existing) throw new Error(`Trip ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.db.trips.set(id, updated);
    return updated;
  }

  async findTripStudents(tripId: string): Promise<TripStudent[]> {
    return Array.from(this.db.tripStudents.values()).filter((ts) => ts.tripId === tripId);
  }
  async findTripStudent(tripId: string, studentId: string): Promise<TripStudent | null> {
    return (
      Array.from(this.db.tripStudents.values()).find(
        (ts) => ts.tripId === tripId && ts.studentId === studentId
      ) || null
    );
  }
  async createTripStudent(tripStudent: TripStudent): Promise<TripStudent> {
    this.db.tripStudents.set(tripStudent.id, { ...tripStudent });
    return tripStudent;
  }
  async updateTripStudent(id: string, updates: Partial<TripStudent>): Promise<TripStudent> {
    const existing = this.db.tripStudents.get(id);
    if (!existing) throw new Error(`TripStudent ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.tripStudents.set(id, updated);
    return updated;
  }
}

export class MemoryStudentRepository implements IStudentRepository {
  constructor(private db: MemoryDatabase) {}
  async findById(id: string): Promise<Student | null> {
    return this.db.students.get(id) || null;
  }
  async findByAdmissionNumber(schoolId: string, admissionNumber: string): Promise<Student | null> {
    return (
      Array.from(this.db.students.values()).find(
        (s) => s.schoolId === schoolId && s.admissionNumber === admissionNumber
      ) || null
    );
  }
  async findByRfidCard(cardId: string): Promise<Student | null> {
    return (
      Array.from(this.db.students.values()).find((s) => s.rfidCardId === cardId) || null
    );
  }
  async findBySchool(schoolId: string): Promise<Student[]> {
    return Array.from(this.db.students.values()).filter((s) => s.schoolId === schoolId);
  }
  async create(student: Student): Promise<Student> {
    this.db.students.set(student.id, { ...student });
    return student;
  }
  async update(id: string, updates: Partial<Student>): Promise<Student> {
    const existing = this.db.students.get(id);
    if (!existing) throw new Error(`Student ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.db.students.set(id, updated);
    return updated;
  }
  async deleteStudent(id: string): Promise<void> {
    const existing = this.db.students.get(id);
    if (existing) {
      this.db.students.set(id, { ...existing, status: 'INACTIVE', updatedAt: new Date().toISOString() });
    }
  }

  async findAssignment(studentId: string): Promise<StudentRouteAssignment | null> {
    return this.db.assignments.get(studentId) || null;
  }
  async createAssignment(assignment: StudentRouteAssignment): Promise<StudentRouteAssignment> {
    this.db.assignments.set(assignment.studentId, { ...assignment });
    return assignment;
  }
  async updateAssignment(
    id: string,
    updates: Partial<StudentRouteAssignment>
  ): Promise<StudentRouteAssignment> {
    const existing = Array.from(this.db.assignments.values()).find((a) => a.id === id);
    if (!existing) throw new Error(`Assignment ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.assignments.set(updated.studentId, updated);
    return updated;
  }

  async findGuardiansByStudent(studentId: string): Promise<Guardian[]> {
    return Array.from(this.db.guardians.values()).filter((g) => g.studentId === studentId);
  }
  async findStudentsByGuardianUser(userId: string): Promise<Student[]> {
    const guardianLinks = Array.from(this.db.guardians.values()).filter(
      (g) => g.userId === userId
    );
    const students: Student[] = [];
    for (const link of guardianLinks) {
      const student = this.db.students.get(link.studentId);
      if (student) students.push(student);
    }
    return students;
  }
  async linkGuardian(guardian: Guardian): Promise<Guardian> {
    this.db.guardians.set(guardian.id, { ...guardian });
    return guardian;
  }
  async unlinkGuardian(guardianId: string): Promise<void> {
    this.db.guardians.delete(guardianId);
  }
  async createParentInvitationCode(input: {
    code: string;
    studentId: string;
    schoolId: string;
    admissionNumber: string;
  }): Promise<void> {
    this.db.parentInvitationCodes.set(input.code, {
      admissionNumber: input.admissionNumber,
      studentId: input.studentId,
      schoolId: input.schoolId,
    });
  }
  async claimParentInvitationCode(
    code: string,
    admissionNumber: string,
    userId: string,
    schoolId?: string
  ): Promise<{ studentId: string; schoolId: string } | null> {
    const invitation = this.db.parentInvitationCodes.get(code);
    if (
      !invitation ||
      invitation.admissionNumber !== admissionNumber ||
      invitation.claimedByUserId ||
      (schoolId && invitation.schoolId !== schoolId)
    ) {
      return null;
    }
    this.db.parentInvitationCodes.set(code, { ...invitation, claimedByUserId: userId });
    return { studentId: invitation.studentId, schoolId: invitation.schoolId };
  }
}

export class MemoryJourneyRepository implements IJourneyRepository {
  constructor(private db: MemoryDatabase) {}
  async createEvent(event: JourneyEvent): Promise<JourneyEvent> {
    this.db.journeyEvents.set(event.id, { ...event });
    this.db.journeyEventKeys.set(event.idempotencyKey, { ...event });
    return event;
  }
  async findEventByIdempotencyKey(key: string): Promise<JourneyEvent | null> {
    return this.db.journeyEventKeys.get(key) || null;
  }
  async findEventsByTrip(tripId: string): Promise<JourneyEvent[]> {
    return Array.from(this.db.journeyEvents.values()).filter((e) => e.tripId === tripId);
  }
  async findEventsByStudent(studentId: string): Promise<JourneyEvent[]> {
    return Array.from(this.db.journeyEvents.values())
      .filter((e) => e.studentId === studentId)
      .sort((a, b) => new Date(a.eventTimestamp).getTime() - new Date(b.eventTimestamp).getTime());
  }

  async getStudentJourneyState(
    studentId: string,
    tripId: string
  ): Promise<StudentJourneyState | null> {
    const key = `${studentId}_${tripId}`;
    return this.db.journeyStates.get(key) || null;
  }
  async upsertStudentJourneyState(state: StudentJourneyState): Promise<StudentJourneyState> {
    const key = `${state.studentId}_${state.tripId}`;
    this.db.journeyStates.set(key, { ...state });
    return state;
  }
}

export class MemoryGpsRepository implements IGpsRepository {
  constructor(private db: MemoryDatabase) {}
  async createLocation(location: GPSLocation): Promise<GPSLocation> {
    this.db.gpsLocations.push({ ...location });
    return location;
  }
  async getLatestLocationByBus(busId: string): Promise<GPSLocation | null> {
    const busLocs = this.db.gpsLocations.filter((l) => l.busId === busId);
    if (busLocs.length === 0) return null;
    return busLocs.sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    )[0];
  }
  async getLocationsByBus(busId: string, limit: number = 100): Promise<GPSLocation[]> {
    return this.db.gpsLocations
      .filter((l) => l.busId === busId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
      .slice(0, limit);
  }
}

export class MemoryExceptionRepository implements IExceptionRepository {
  constructor(private db: MemoryDatabase) {}
  async create(exception: JourneyException): Promise<JourneyException> {
    this.db.exceptions.set(exception.id, { ...exception });
    return exception;
  }
  async findById(id: string): Promise<JourneyException | null> {
    return this.db.exceptions.get(id) || null;
  }
  async findByTrip(tripId: string): Promise<JourneyException[]> {
    return Array.from(this.db.exceptions.values()).filter((e) => e.tripId === tripId);
  }
  async findBySchool(schoolId: string, status?: string): Promise<JourneyException[]> {
    return Array.from(this.db.exceptions.values()).filter(
      (e) => e.schoolId === schoolId && (!status || e.status === status)
    );
  }
  async update(id: string, updates: Partial<JourneyException>): Promise<JourneyException> {
    const existing = this.db.exceptions.get(id);
    if (!existing) throw new Error(`Exception ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.exceptions.set(id, updated);
    return updated;
  }
}

export class MemoryNotificationRepository implements INotificationRepository {
  constructor(private db: MemoryDatabase) {}
  async create(notification: Notification): Promise<Notification> {
    this.db.notifications.set(notification.id, { ...notification });
    return notification;
  }
  async findByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.db.notifications.values()).filter((n) => n.userId === userId);
  }
  async findBySchool(schoolId: string): Promise<Notification[]> {
    return Array.from(this.db.notifications.values()).filter(
      (n) => (n as any).schoolId === schoolId
    );
  }
  async update(id: string, updates: Partial<Notification>): Promise<Notification> {
    const existing = this.db.notifications.get(id);
    if (!existing) throw new Error(`Notification ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.notifications.set(id, updated);
    return updated;
  }
}

export class MemoryAuditRepository implements IAuditRepository {
  constructor(private db: MemoryDatabase) {}
  async create(log: AuditLog): Promise<AuditLog> {
    this.db.auditLogs.push({ ...log });
    return log;
  }
  async findBySchool(schoolId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.db.auditLogs
      .filter((l) => l.schoolId === schoolId)
      .sort((a, b) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime())
      .slice(0, limit);
  }
}

export class MemoryUserRepository implements IUserRepository {
  constructor(private db: MemoryDatabase) {}
  async findById(id: string): Promise<User | null> {
    return this.db.users.get(id) || null;
  }
  async findByPhoneOrEmail(identifier: string): Promise<User | null> {
    const trimmed = identifier.trim().toLowerCase();
    return (
      Array.from(this.db.users.values()).find(
        (u) =>
          u.phone?.trim().toLowerCase() === trimmed ||
          (u as any).email?.trim().toLowerCase() === trimmed
      ) || null
    );
  }
  async resolveAuthContext(userId: string): Promise<AuthContext | null> {
    if (this.db.authContexts.has(userId)) {
      return this.db.authContexts.get(userId)!;
    }
    const user = this.db.users.get(userId);
    if (!user) return null;
    return {
      userId: user.id,
      schoolId: user.schoolId,
      role: 'PARENT',
      email: user.email || '',
      isSuperAdmin: false,
    };
  }
  async createUser(user: User): Promise<User> {
    this.db.users.set(user.id, { ...user });
    return user;
  }
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const existing = this.db.users.get(id);
    if (!existing) throw new Error(`User ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.db.users.set(id, updated);
    return updated;
  }
  async listUsersBySchool(schoolId: string): Promise<User[]> {
    return Array.from(this.db.users.values()).filter((u) => u.schoolId === schoolId);
  }
}

export class MemorySettingsRepository implements ISettingsRepository {
  constructor(private db: MemoryDatabase) {}
  async getSettings(schoolId: string): Promise<PlatformSettings> {
    const existing = this.db.settings.get(schoolId);
    if (existing) return existing;
    const defaults: PlatformSettings = {
      schoolId,
      schoolName: 'Delhi Public International School',
      gpsFreshnessSeconds: 60,
      gpsStaleSeconds: 120,
      geofenceRadiusMeters: 75,
      mapTileProvider: 'carto-dark',
      fcmEnabled: true,
      dataRetentionDays: 90,
      updatedAt: new Date().toISOString(),
    };
    this.db.settings.set(schoolId, defaults);
    return defaults;
  }
  async updateSettings(
    schoolId: string,
    updates: Partial<PlatformSettings>
  ): Promise<PlatformSettings> {
    const current = await this.getSettings(schoolId);
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    this.db.settings.set(schoolId, updated);
    return updated;
  }
}

export class MemoryMaintenanceRepository implements IMaintenanceRepository {
  constructor(private db: MemoryDatabase) {}
  async findByBus(busId: string): Promise<BusMaintenanceRecord[]> {
    return Array.from(this.db.maintenance.values()).filter((m) => m.busId === busId);
  }
  async findBySchool(schoolId: string): Promise<BusMaintenanceRecord[]> {
    return Array.from(this.db.maintenance.values()).filter((m) => m.schoolId === schoolId);
  }
  async create(record: BusMaintenanceRecord): Promise<BusMaintenanceRecord> {
    this.db.maintenance.set(record.id, { ...record });
    return record;
  }
}

export class MemoryStaffRepository implements IStaffRepository {
  constructor(private db: MemoryDatabase) {}
  async findBySchool(schoolId: string): Promise<StaffProfile[]> {
    return Array.from(this.db.staff.values()).filter((s) => s.schoolId === schoolId);
  }
  async findById(id: string): Promise<StaffProfile | null> {
    return this.db.staff.get(id) || null;
  }
  async create(staff: StaffProfile): Promise<StaffProfile> {
    this.db.staff.set(staff.id, { ...staff });
    return staff;
  }
  async update(id: string, updates: Partial<StaffProfile>): Promise<StaffProfile> {
    const existing = this.db.staff.get(id);
    if (!existing) throw new Error(`Staff profile ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.staff.set(id, updated);
    return updated;
  }
  async deleteStaff(id: string): Promise<void> {
    const existing = this.db.staff.get(id);
    if (existing) {
      this.db.staff.set(id, { ...existing, status: 'INACTIVE' });
    }
  }
}

export class MemoryNotificationOutboxRepository implements INotificationOutboxRepository {
  constructor(private db: MemoryDatabase) {}
  async queueNotification(item: NotificationOutboxItem): Promise<NotificationOutboxItem> {
    this.db.outbox.set(item.id, { ...item });
    return item;
  }
  async getPending(limit: number = 50): Promise<NotificationOutboxItem[]> {
    return Array.from(this.db.outbox.values())
      .filter((n) => n.status === 'PENDING' || n.status === 'FAILED')
      .slice(0, limit);
  }
  async update(
    id: string,
    updates: Partial<NotificationOutboxItem>
  ): Promise<NotificationOutboxItem> {
    const existing = this.db.outbox.get(id);
    if (!existing) throw new Error(`Outbox notification ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.outbox.set(id, updated);
    return updated;
  }
  async listBySchool(schoolId: string): Promise<NotificationOutboxItem[]> {
    return Array.from(this.db.outbox.values()).filter((n) => n.schoolId === schoolId);
  }
}

export class MemoryContainer implements IRepositoryContainer {
  public db: MemoryDatabase;
  public schoolRepo: ISchoolRepository;
  public busRepo: IBusRepository;
  public deviceRepo: IDeviceRepository;
  public routeRepo: IRouteRepository;
  public tripRepo: ITripRepository;
  public studentRepo: IStudentRepository;
  public journeyRepo: IJourneyRepository;
  public gpsRepo: IGpsRepository;
  public exceptionRepo: IExceptionRepository;
  public notificationRepo: INotificationRepository;
  public auditRepo: IAuditRepository;
  public userRepo: IUserRepository;
  public settingsRepo: ISettingsRepository;
  public maintenanceRepo: IMaintenanceRepository;
  public staffRepo: IStaffRepository;
  public outboxRepo: INotificationOutboxRepository;

  constructor() {
    this.db = new MemoryDatabase();
    this.schoolRepo = new MemorySchoolRepository(this.db);
    this.busRepo = new MemoryBusRepository(this.db);
    this.deviceRepo = new MemoryDeviceRepository(this.db);
    this.routeRepo = new MemoryRouteRepository(this.db);
    this.tripRepo = new MemoryTripRepository(this.db);
    this.studentRepo = new MemoryStudentRepository(this.db);
    this.journeyRepo = new MemoryJourneyRepository(this.db);
    this.gpsRepo = new MemoryGpsRepository(this.db);
    this.exceptionRepo = new MemoryExceptionRepository(this.db);
    this.notificationRepo = new MemoryNotificationRepository(this.db);
    this.auditRepo = new MemoryAuditRepository(this.db);
    this.userRepo = new MemoryUserRepository(this.db);
    this.settingsRepo = new MemorySettingsRepository(this.db);
    this.maintenanceRepo = new MemoryMaintenanceRepository(this.db);
    this.staffRepo = new MemoryStaffRepository(this.db);
    this.outboxRepo = new MemoryNotificationOutboxRepository(this.db);
  }
}
