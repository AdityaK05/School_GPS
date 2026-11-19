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

export interface ISchoolRepository {
  findById(id: string): Promise<School | null>;
  create(school: School): Promise<School>;
  update(id: string, updates: Partial<School>): Promise<School>;
}

export interface IBusRepository {
  findById(id: string): Promise<Bus | null>;
  findBySchool(schoolId: string): Promise<Bus[]>;
  create(bus: Bus): Promise<Bus>;
  update(id: string, updates: Partial<Bus>): Promise<Bus>;
  deleteBus(id: string): Promise<void>;
}

export interface IDeviceRepository {
  findGpsById(id: string): Promise<GPSDevice | null>;
  findGpsByBus(busId: string): Promise<GPSDevice | null>;
  findGpsByExternalId(externalDeviceId: string): Promise<GPSDevice | null>;
  listGpsBySchool(schoolId: string): Promise<GPSDevice[]>;
  createGps(device: GPSDevice): Promise<GPSDevice>;
  updateGps(id: string, updates: Partial<GPSDevice>): Promise<GPSDevice>;
  deleteGps(id: string): Promise<void>;

  findRfidById(id: string): Promise<RFIDDevice | null>;
  findRfidByBus(busId: string): Promise<RFIDDevice | null>;
  findRfidByReaderId(readerHardwareId: string): Promise<RFIDDevice | null>;
  listRfidBySchool(schoolId: string): Promise<RFIDDevice[]>;
  createRfid(device: RFIDDevice): Promise<RFIDDevice>;
  updateRfid(id: string, updates: Partial<RFIDDevice>): Promise<RFIDDevice>;
  deleteRfid(id: string): Promise<void>;
}

export interface IRouteRepository {
  findRouteById(id: string): Promise<Route | null>;
  findRoutesBySchool(schoolId: string): Promise<Route[]>;
  createRoute(route: Route): Promise<Route>;
  updateRoute(id: string, updates: Partial<Route>): Promise<Route>;
  deleteRoute(id: string): Promise<void>;

  findStopsByRoute(routeId: string): Promise<Stop[]>;
  findStopById(id: string): Promise<Stop | null>;
  createStop(stop: Stop): Promise<Stop>;
  updateStop(id: string, updates: Partial<Stop>): Promise<Stop>;
  deleteStop(id: string): Promise<void>;
  isPointWithinStopGeofence(stopId: string, latitude: number, longitude: number): Promise<boolean>;
}

export interface ITripRepository {
  findById(id: string): Promise<Trip | null>;
  findBySchoolAndDate(schoolId: string, date: string): Promise<Trip[]>;
  findActiveTripByBus(busId: string): Promise<Trip | null>;
  create(trip: Trip): Promise<Trip>;
  update(id: string, updates: Partial<Trip>): Promise<Trip>;

  findTripStudents(tripId: string): Promise<TripStudent[]>;
  findTripStudent(tripId: string, studentId: string): Promise<TripStudent | null>;
  createTripStudent(tripStudent: TripStudent): Promise<TripStudent>;
  updateTripStudent(id: string, updates: Partial<TripStudent>): Promise<TripStudent>;
}

export interface IStudentRepository {
  findById(id: string): Promise<Student | null>;
  findByAdmissionNumber(schoolId: string, admissionNumber: string): Promise<Student | null>;
  findByRfidCard(cardId: string): Promise<Student | null>;
  findBySchool(schoolId: string): Promise<Student[]>;
  create(student: Student): Promise<Student>;
  update(id: string, updates: Partial<Student>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;

  findAssignment(studentId: string): Promise<StudentRouteAssignment | null>;
  createAssignment(assignment: StudentRouteAssignment): Promise<StudentRouteAssignment>;
  updateAssignment(id: string, updates: Partial<StudentRouteAssignment>): Promise<StudentRouteAssignment>;

  findGuardiansByStudent(studentId: string): Promise<Guardian[]>;
  findStudentsByGuardianUser(userId: string): Promise<Student[]>;
  linkGuardian(guardian: Guardian): Promise<Guardian>;
  unlinkGuardian(guardianId: string): Promise<void>;
  createParentInvitationCode(input: {
    code: string;
    studentId: string;
    schoolId: string;
    admissionNumber: string;
  }): Promise<void>;
  claimParentInvitationCode(
    code: string,
    admissionNumber: string,
    userId: string,
    schoolId?: string
  ): Promise<{ studentId: string; schoolId: string } | null>;
}

export interface IJourneyRepository {
  createEvent(event: JourneyEvent): Promise<JourneyEvent>;
  findEventByIdempotencyKey(key: string): Promise<JourneyEvent | null>;
  findEventsByTrip(tripId: string): Promise<JourneyEvent[]>;
  findEventsByStudent(studentId: string): Promise<JourneyEvent[]>;

  getStudentJourneyState(studentId: string, tripId: string): Promise<StudentJourneyState | null>;
  upsertStudentJourneyState(state: StudentJourneyState): Promise<StudentJourneyState>;
}

export interface IGpsRepository {
  createLocation(location: GPSLocation): Promise<GPSLocation>;
  getLatestLocationByBus(busId: string): Promise<GPSLocation | null>;
  getLocationsByBus(busId: string, limit?: number): Promise<GPSLocation[]>;
}

export interface IExceptionRepository {
  create(exception: JourneyException): Promise<JourneyException>;
  findById(id: string): Promise<JourneyException | null>;
  findByTrip(tripId: string): Promise<JourneyException[]>;
  findBySchool(schoolId: string, status?: string): Promise<JourneyException[]>;
  update(id: string, updates: Partial<JourneyException>): Promise<JourneyException>;
}

export interface INotificationRepository {
  create(notification: Notification): Promise<Notification>;
  findByUser(userId: string): Promise<Notification[]>;
  findBySchool(schoolId: string): Promise<Notification[]>;
  update(id: string, updates: Partial<Notification>): Promise<Notification>;
}

export interface IAuditRepository {
  create(log: AuditLog): Promise<AuditLog>;
  findBySchool(schoolId: string, limit?: number): Promise<AuditLog[]>;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByPhoneOrEmail(identifier: string): Promise<User | null>;
  resolveAuthContext(userId: string): Promise<AuthContext | null>;
  createUser(user: User): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  listUsersBySchool(schoolId: string): Promise<User[]>;
}

export interface ISettingsRepository {
  getSettings(schoolId: string): Promise<PlatformSettings>;
  updateSettings(schoolId: string, updates: Partial<PlatformSettings>): Promise<PlatformSettings>;
}

export interface IMaintenanceRepository {
  findByBus(busId: string): Promise<BusMaintenanceRecord[]>;
  findBySchool(schoolId: string): Promise<BusMaintenanceRecord[]>;
  create(record: BusMaintenanceRecord): Promise<BusMaintenanceRecord>;
}

export interface IStaffRepository {
  findBySchool(schoolId: string): Promise<StaffProfile[]>;
  findById(id: string): Promise<StaffProfile | null>;
  create(staff: StaffProfile): Promise<StaffProfile>;
  update(id: string, updates: Partial<StaffProfile>): Promise<StaffProfile>;
  deleteStaff(id: string): Promise<void>;
}

export interface INotificationOutboxRepository {
  queueNotification(item: NotificationOutboxItem): Promise<NotificationOutboxItem>;
  getPending(limit?: number): Promise<NotificationOutboxItem[]>;
  update(id: string, updates: Partial<NotificationOutboxItem>): Promise<NotificationOutboxItem>;
  listBySchool(schoolId: string): Promise<NotificationOutboxItem[]>;
}

export interface IRepositoryContainer {
  schoolRepo: ISchoolRepository;
  busRepo: IBusRepository;
  deviceRepo: IDeviceRepository;
  routeRepo: IRouteRepository;
  tripRepo: ITripRepository;
  studentRepo: IStudentRepository;
  journeyRepo: IJourneyRepository;
  gpsRepo: IGpsRepository;
  exceptionRepo: IExceptionRepository;
  notificationRepo: INotificationRepository;
  auditRepo: IAuditRepository;
  userRepo: IUserRepository;
  settingsRepo: ISettingsRepository;
  maintenanceRepo: IMaintenanceRepository;
  staffRepo: IStaffRepository;
  outboxRepo: INotificationOutboxRepository;
}
