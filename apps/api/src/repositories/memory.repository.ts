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
} from '@school-transport-platform/shared-types';
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
}

export class MemoryDeviceRepository implements IDeviceRepository {
  constructor(private db: MemoryDatabase) {}
  async findGpsById(id: string): Promise<GPSDevice | null> {
    return this.db.gpsDevices.get(id) || null;
  }
  async findGpsByBus(busId: string): Promise<GPSDevice | null> {
    return Array.from(this.db.gpsDevices.values()).find((d) => d.busId === busId && d.status === 'ONLINE') || null;
  }
  async findGpsByExternalId(externalDeviceId: string): Promise<GPSDevice | null> {
    return Array.from(this.db.gpsDevices.values()).find((d) => d.externalDeviceId === externalDeviceId) || null;
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

  async findRfidById(id: string): Promise<RFIDDevice | null> {
    return this.db.rfidDevices.get(id) || null;
  }
  async findRfidByBus(busId: string): Promise<RFIDDevice | null> {
    return Array.from(this.db.rfidDevices.values()).find((d) => d.busId === busId && d.status === 'ACTIVE') || null;
  }
  async findRfidByReaderId(readerHardwareId: string): Promise<RFIDDevice | null> {
    return Array.from(this.db.rfidDevices.values()).find((d) => d.readerHardwareId === readerHardwareId) || null;
  }
  async createRfid(device: RFIDDevice): Promise<RFIDDevice> {
    if (device.status === 'ACTIVE') {
      const activeExisting = await this.findRfidByBus(device.busId);
      if (activeExisting && activeExisting.id !== device.id) {
        throw new Error(`Bus ${device.busId} already has an ACTIVE RFID reader: ${activeExisting.id}`);
      }
    }
    this.db.rfidDevices.set(device.id, { ...device });
    return device;
  }
  async updateRfid(id: string, updates: Partial<RFIDDevice>): Promise<RFIDDevice> {
    const existing = this.db.rfidDevices.get(id);
    if (!existing) throw new Error(`RFID device ${id} not found`);
    const targetBusId = updates.busId || existing.busId;
    const targetStatus = updates.status || existing.status;
    if (targetStatus === 'ACTIVE') {
      const activeExisting = await this.findRfidByBus(targetBusId);
      if (activeExisting && activeExisting.id !== id) {
        throw new Error(`Bus ${targetBusId} already has an ACTIVE RFID reader`);
      }
    }
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.db.rfidDevices.set(id, updated);
    return updated;
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
    return Array.from(this.db.trips.values()).find(
      (t) => t.busId === busId && (t.status === 'STARTED' || t.status === 'IN_PROGRESS')
    ) || null;
  }
  async create(trip: Trip): Promise<Trip> {
    if (trip.status === 'STARTED' || trip.status === 'IN_PROGRESS') {
      const active = await this.findActiveTripByBus(trip.busId);
      if (active) throw new Error(`Bus ${trip.busId} already has an active trip: ${active.id}`);
    }
    this.db.trips.set(trip.id, { ...trip });
    return trip;
  }
  async update(id: string, updates: Partial<Trip>): Promise<Trip> {
    const existing = this.db.trips.get(id);
    if (!existing) throw new Error(`Trip ${id} not found`);
    const newStatus = updates.status || existing.status;
    if ((newStatus === 'STARTED' || newStatus === 'IN_PROGRESS') && existing.status !== newStatus) {
      const active = await this.findActiveTripByBus(existing.busId);
      if (active && active.id !== id) {
        throw new Error(`Bus ${existing.busId} already has an active trip`);
      }
    }
    const updated = { ...existing, ...updates };
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
  async findByRfidCard(cardId: string): Promise<Student | null> {
    return Array.from(this.db.students.values()).find((s) => s.rfidCardId === cardId) || null;
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
  async findAssignment(studentId: string): Promise<StudentRouteAssignment | null> {
    return (
      Array.from(this.db.assignments.values()).find(
        (a) => a.studentId === studentId && a.status === 'ACTIVE'
      ) || null
    );
  }
  async createAssignment(assignment: StudentRouteAssignment): Promise<StudentRouteAssignment> {
    this.db.assignments.set(assignment.id, { ...assignment });
    return assignment;
  }
  async updateAssignment(id: string, updates: Partial<StudentRouteAssignment>): Promise<StudentRouteAssignment> {
    const existing = this.db.assignments.get(id);
    if (!existing) throw new Error(`Assignment ${id} not found`);
    const updated = { ...existing, ...updates };
    this.db.assignments.set(id, updated);
    return updated;
  }
  async findGuardiansByStudent(studentId: string): Promise<Guardian[]> {
    return Array.from(this.db.guardians.values()).filter((g) => g.studentId === studentId);
  }
  async findStudentsByGuardianUser(userId: string): Promise<Student[]> {
    const studentIds = Array.from(this.db.guardians.values())
      .filter((g) => g.userId === userId)
      .map((g) => g.studentId);
    return Array.from(this.db.students.values()).filter((s) => studentIds.includes(s.id));
  }
}

export class MemoryJourneyRepository implements IJourneyRepository {
  constructor(private db: MemoryDatabase) {}
  async createEvent(event: JourneyEvent): Promise<JourneyEvent> {
    if (this.db.journeyEventKeys.has(event.idempotencyKey)) {
      throw new Error(`UNIQUE_VIOLATION: Duplicate idempotencyKey ${event.idempotencyKey}`);
    }
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
    return Array.from(this.db.journeyEvents.values()).filter((e) => e.studentId === studentId);
  }
  async getStudentJourneyState(studentId: string, tripId: string): Promise<StudentJourneyState | null> {
    return this.db.journeyStates.get(`${studentId}:${tripId}`) || null;
  }
  async upsertStudentJourneyState(state: StudentJourneyState): Promise<StudentJourneyState> {
    this.db.journeyStates.set(`${state.studentId}:${state.tripId}`, { ...state });
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
    return busLocs.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
  }
  async getLocationsByBus(busId: string, limit: number = 50): Promise<GPSLocation[]> {
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
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export class MemoryUserRepository implements IUserRepository {
  constructor(private db: MemoryDatabase) {}
  async findById(id: string): Promise<User | null> {
    return this.db.users.get(id) || null;
  }
  async resolveAuthContext(userId: string): Promise<AuthContext | null> {
    return this.db.authContexts.get(userId) || null;
  }
}

export class MemoryContainer implements IRepositoryContainer {
  public db = new MemoryDatabase();
  public schoolRepo = new MemorySchoolRepository(this.db);
  public busRepo = new MemoryBusRepository(this.db);
  public deviceRepo = new MemoryDeviceRepository(this.db);
  public routeRepo = new MemoryRouteRepository(this.db);
  public tripRepo = new MemoryTripRepository(this.db);
  public studentRepo = new MemoryStudentRepository(this.db);
  public journeyRepo = new MemoryJourneyRepository(this.db);
  public gpsRepo = new MemoryGpsRepository(this.db);
  public exceptionRepo = new MemoryExceptionRepository(this.db);
  public notificationRepo = new MemoryNotificationRepository(this.db);
  public auditRepo = new MemoryAuditRepository(this.db);
  public userRepo = new MemoryUserRepository(this.db);
}
