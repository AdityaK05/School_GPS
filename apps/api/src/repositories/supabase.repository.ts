import { SupabaseClient } from '@supabase/supabase-js';
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
  UserRole,
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
} from './interfaces.js';

export class SupabaseSchoolRepository implements ISchoolRepository {
  constructor(private client: SupabaseClient) {}

  async findById(id: string): Promise<School | null> {
    const { data, error } = await this.client
      .from('schools')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Supabase error findSchoolById: ${error.message}`);
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      timezone: data.timezone,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async create(school: School): Promise<School> {
    const row = {
      id: school.id,
      name: school.name,
      code: school.code,
      timezone: school.timezone,
      status: school.status,
      created_at: school.createdAt,
      updated_at: school.updatedAt,
    };
    const { data, error } = await this.client.from('schools').insert(row).select().single();
    if (error) throw new Error(`Supabase error createSchool: ${error.message}`);
    return {
      id: data.id,
      name: data.name,
      code: data.code,
      timezone: data.timezone,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async update(id: string, updates: Partial<School>): Promise<School> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.code !== undefined) payload.code = updates.code;
    if (updates.timezone !== undefined) payload.timezone = updates.timezone;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await this.client
      .from('schools')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Supabase error updateSchool: ${error.message}`);
    return {
      id: data.id,
      name: data.name,
      code: data.code,
      timezone: data.timezone,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export class SupabaseBusRepository implements IBusRepository {
  constructor(private client: SupabaseClient) {}

  async findById(id: string): Promise<Bus | null> {
    const { data, error } = await this.client.from('buses').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error findBusById: ${error.message}`);
    if (!data) return null;
    return this.mapBusRow(data);
  }

  async findBySchool(schoolId: string): Promise<Bus[]> {
    const { data, error } = await this.client.from('buses').select('*').eq('school_id', schoolId);
    if (error) throw new Error(`Supabase error findBusesBySchool: ${error.message}`);
    return (data || []).map(this.mapBusRow);
  }

  async create(bus: Bus): Promise<Bus> {
    const row = {
      id: bus.id,
      school_id: bus.schoolId,
      registration_number: bus.registrationNumber,
      fleet_number: bus.fleetNumber,
      capacity: bus.capacity,
      status: bus.status,
      active_gps_device_id: bus.activeGpsDeviceId,
      active_rfid_device_id: bus.activeRfidDeviceId,
      created_at: bus.createdAt,
      updated_at: bus.updatedAt,
    };
    const { data, error } = await this.client.from('buses').insert(row).select().single();
    if (error) throw new Error(`Supabase error createBus: ${error.message}`);
    return this.mapBusRow(data);
  }

  async update(id: string, updates: Partial<Bus>): Promise<Bus> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.registrationNumber !== undefined) payload.registration_number = updates.registrationNumber;
    if (updates.fleetNumber !== undefined) payload.fleet_number = updates.fleetNumber;
    if (updates.capacity !== undefined) payload.capacity = updates.capacity;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.activeGpsDeviceId !== undefined) payload.active_gps_device_id = updates.activeGpsDeviceId;
    if (updates.activeRfidDeviceId !== undefined) payload.active_rfid_device_id = updates.activeRfidDeviceId;

    const { data, error } = await this.client.from('buses').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Supabase error updateBus: ${error.message}`);
    return this.mapBusRow(data);
  }

  private mapBusRow(row: any): Bus {
    return {
      id: row.id,
      schoolId: row.school_id,
      registrationNumber: row.registration_number,
      fleetNumber: row.fleet_number,
      capacity: row.capacity,
      status: row.status,
      activeGpsDeviceId: row.active_gps_device_id,
      activeRfidDeviceId: row.active_rfid_device_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export class SupabaseDeviceRepository implements IDeviceRepository {
  constructor(private client: SupabaseClient) {}

  async findGpsById(id: string): Promise<GPSDevice | null> {
    const { data, error } = await this.client.from('gps_devices').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error findGpsById: ${error.message}`);
    if (!data) return null;
    return this.mapGpsRow(data);
  }

  async findGpsByBus(busId: string): Promise<GPSDevice | null> {
    const { data, error } = await this.client
      .from('gps_devices')
      .select('*')
      .eq('bus_id', busId)
      .eq('status', 'ONLINE')
      .maybeSingle();
    if (error) throw new Error(`Supabase error findGpsByBus: ${error.message}`);
    if (!data) return null;
    return this.mapGpsRow(data);
  }

  async findGpsByExternalId(externalDeviceId: string): Promise<GPSDevice | null> {
    const { data, error } = await this.client
      .from('gps_devices')
      .select('*')
      .eq('external_device_id', externalDeviceId)
      .maybeSingle();
    if (error) throw new Error(`Supabase error findGpsByExternalId: ${error.message}`);
    if (!data) return null;
    return this.mapGpsRow(data);
  }

  async createGps(device: GPSDevice): Promise<GPSDevice> {
    const row = {
      id: device.id,
      bus_id: device.busId,
      school_id: device.schoolId,
      provider: device.provider,
      external_device_id: device.externalDeviceId,
      status: device.status,
      last_seen_at: device.lastSeenAt,
      created_at: device.createdAt,
    };
    const { data, error } = await this.client.from('gps_devices').insert(row).select().single();
    if (error) throw new Error(`Supabase error createGps: ${error.message}`);
    return this.mapGpsRow(data);
  }

  async updateGps(id: string, updates: Partial<GPSDevice>): Promise<GPSDevice> {
    const payload: Record<string, unknown> = {};
    if (updates.busId !== undefined) payload.bus_id = updates.busId;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.lastSeenAt !== undefined) payload.last_seen_at = updates.lastSeenAt;

    const { data, error } = await this.client.from('gps_devices').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Supabase error updateGps: ${error.message}`);
    return this.mapGpsRow(data);
  }

  async findRfidById(id: string): Promise<RFIDDevice | null> {
    const { data, error } = await this.client.from('rfid_devices').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error findRfidById: ${error.message}`);
    if (!data) return null;
    return this.mapRfidRow(data);
  }

  async findRfidByBus(busId: string): Promise<RFIDDevice | null> {
    const { data, error } = await this.client
      .from('rfid_devices')
      .select('*')
      .eq('bus_id', busId)
      .eq('status', 'ACTIVE')
      .maybeSingle();
    if (error) throw new Error(`Supabase error findRfidByBus: ${error.message}`);
    if (!data) return null;
    return this.mapRfidRow(data);
  }

  async findRfidByReaderId(readerHardwareId: string): Promise<RFIDDevice | null> {
    const { data, error } = await this.client
      .from('rfid_devices')
      .select('*')
      .eq('serial_number', readerHardwareId)
      .maybeSingle();
    if (error) throw new Error(`Supabase error findRfidByReaderId: ${error.message}`);
    if (!data) return null;
    return this.mapRfidRow(data);
  }

  async createRfid(device: RFIDDevice): Promise<RFIDDevice> {
    const row = {
      id: device.id,
      bus_id: device.busId,
      school_id: device.schoolId,
      hardware_model: device.hardwareModel,
      protocol: device.protocol,
      status: device.status,
      serial_number: device.readerHardwareId || device.serialNumber,
      activated_at: device.activatedAt,
      decommissioned_at: device.decommissionedAt,
      created_at: device.createdAt,
    };
    const { data, error } = await this.client.from('rfid_devices').insert(row).select().single();
    if (error) throw new Error(`Supabase error createRfid: ${error.message}`);
    return this.mapRfidRow(data);
  }

  async updateRfid(id: string, updates: Partial<RFIDDevice>): Promise<RFIDDevice> {
    const payload: Record<string, unknown> = {};
    if (updates.busId !== undefined) payload.bus_id = updates.busId;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.activatedAt !== undefined) payload.activated_at = updates.activatedAt;
    if (updates.decommissionedAt !== undefined) payload.decommissioned_at = updates.decommissionedAt;

    const { data, error } = await this.client.from('rfid_devices').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Supabase error updateRfid: ${error.message}`);
    return this.mapRfidRow(data);
  }

  private mapGpsRow(row: any): GPSDevice {
    return {
      id: row.id,
      busId: row.bus_id,
      schoolId: row.school_id,
      provider: row.provider,
      externalDeviceId: row.external_device_id,
      status: row.status,
      lastSeenAt: row.last_seen_at,
      createdAt: row.created_at,
    };
  }

  private mapRfidRow(row: any): RFIDDevice {
    return {
      id: row.id,
      busId: row.bus_id,
      schoolId: row.school_id,
      hardwareModel: row.hardware_model,
      readerHardwareId: row.serial_number,
      protocol: row.protocol,
      status: row.status,
      serialNumber: row.serial_number,
      activatedAt: row.activated_at,
      decommissionedAt: row.decommissioned_at,
      createdAt: row.created_at,
    };
  }
}

export class SupabaseRouteRepository implements IRouteRepository {
  constructor(private client: SupabaseClient) {}

  async findRouteById(id: string): Promise<Route | null> {
    const { data, error } = await this.client.from('routes').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error findRouteById: ${error.message}`);
    if (!data) return null;
    return this.mapRouteRow(data);
  }

  async findRoutesBySchool(schoolId: string): Promise<Route[]> {
    const { data, error } = await this.client.from('routes').select('*').eq('school_id', schoolId);
    if (error) throw new Error(`Supabase error findRoutesBySchool: ${error.message}`);
    return (data || []).map(this.mapRouteRow);
  }

  async createRoute(route: Route): Promise<Route> {
    const row = {
      id: route.id,
      school_id: route.schoolId,
      name: route.name,
      code: route.code,
      direction: route.direction,
      status: route.status,
    };
    const { data, error } = await this.client.from('routes').insert(row).select().single();
    if (error) throw new Error(`Supabase error createRoute: ${error.message}`);
    return this.mapRouteRow(data);
  }

  async findStopsByRoute(routeId: string): Promise<Stop[]> {
    const { data, error } = await this.client
      .from('stops')
      .select('*')
      .eq('route_id', routeId)
      .order('sequence', { ascending: true });
    if (error) throw new Error(`Supabase error findStopsByRoute: ${error.message}`);
    return (data || []).map(this.mapStopRow);
  }

  async findStopById(id: string): Promise<Stop | null> {
    const { data, error } = await this.client.from('stops').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error findStopById: ${error.message}`);
    if (!data) return null;
    return this.mapStopRow(data);
  }

  async createStop(stop: Stop): Promise<Stop> {
    const row = {
      id: stop.id,
      route_id: stop.routeId,
      name: stop.name,
      sequence: stop.sequence,
      latitude: stop.latitude,
      longitude: stop.longitude,
      geofence_radius_meters: stop.geofenceRadiusMeters,
      expected_arrival_time: stop.expectedArrivalTime,
    };
    const { data, error } = await this.client.from('stops').insert(row).select().single();
    if (error) throw new Error(`Supabase error createStop: ${error.message}`);
    return this.mapStopRow(data);
  }

  private mapRouteRow(row: any): Route {
    return {
      id: row.id,
      schoolId: row.school_id,
      name: row.name,
      code: row.code,
      direction: row.direction,
      status: row.status,
    };
  }

  private mapStopRow(row: any): Stop {
    return {
      id: row.id,
      routeId: row.route_id,
      name: row.name,
      sequence: row.sequence,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      geofenceRadiusMeters: Number(row.geofence_radius_meters),
      expectedArrivalTime: row.expected_arrival_time,
    };
  }
}

export class SupabaseTripRepository implements ITripRepository {
  constructor(private client: SupabaseClient) {}

  async findById(id: string): Promise<Trip | null> {
    const { data, error } = await this.client.from('trips').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error findTripById: ${error.message}`);
    if (!data) return null;
    return this.mapTripRow(data);
  }

  async findBySchoolAndDate(schoolId: string, date: string): Promise<Trip[]> {
    const { data, error } = await this.client
      .from('trips')
      .select('*')
      .eq('school_id', schoolId)
      .eq('trip_date', date);
    if (error) throw new Error(`Supabase error findTripsBySchoolAndDate: ${error.message}`);
    return (data || []).map(this.mapTripRow);
  }

  async findActiveTripByBus(busId: string): Promise<Trip | null> {
    const { data, error } = await this.client
      .from('trips')
      .select('*')
      .eq('bus_id', busId)
      .in('status', ['STARTED', 'IN_PROGRESS'])
      .maybeSingle();
    if (error) throw new Error(`Supabase error findActiveTripByBus: ${error.message}`);
    if (!data) return null;
    return this.mapTripRow(data);
  }

  async create(trip: Trip): Promise<Trip> {
    const row = {
      id: trip.id,
      school_id: trip.schoolId,
      route_id: trip.routeId,
      bus_id: trip.busId,
      trip_date: trip.tripDate,
      direction: trip.direction,
      status: trip.status,
      started_at: trip.startedAt,
      completed_at: trip.completedAt,
    };
    const { data, error } = await this.client.from('trips').insert(row).select().single();
    if (error) throw new Error(`Supabase error createTrip: ${error.message}`);
    return this.mapTripRow(data);
  }

  async update(id: string, updates: Partial<Trip>): Promise<Trip> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.startedAt !== undefined) payload.started_at = updates.startedAt;
    if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;

    const { data, error } = await this.client.from('trips').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Supabase error updateTrip: ${error.message}`);
    return this.mapTripRow(data);
  }

  async findTripStudents(tripId: string): Promise<TripStudent[]> {
    const { data, error } = await this.client.from('trip_students').select('*').eq('trip_id', tripId);
    if (error) throw new Error(`Supabase error findTripStudents: ${error.message}`);
    return (data || []).map(this.mapTripStudentRow);
  }

  async findTripStudent(tripId: string, studentId: string): Promise<TripStudent | null> {
    const { data, error } = await this.client
      .from('trip_students')
      .select('*')
      .eq('trip_id', tripId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (error) throw new Error(`Supabase error findTripStudent: ${error.message}`);
    if (!data) return null;
    return this.mapTripStudentRow(data);
  }

  async createTripStudent(tripStudent: TripStudent): Promise<TripStudent> {
    const row = {
      id: tripStudent.id,
      trip_id: tripStudent.tripId,
      student_id: tripStudent.studentId,
      expected_boarding_stop_id: tripStudent.expectedBoardingStopId,
      expected_exit_stop_id: tripStudent.expectedExitStopId,
      boarding_status: tripStudent.boardingStatus,
      exit_status: tripStudent.exitStatus,
      actual_boarding_timestamp: tripStudent.actualBoardingTimestamp,
      actual_exit_timestamp: tripStudent.actualExitTimestamp,
      stop_reached_timestamp: tripStudent.stopReachedTimestamp,
    };
    const { data, error } = await this.client.from('trip_students').insert(row).select().single();
    if (error) throw new Error(`Supabase error createTripStudent: ${error.message}`);
    return this.mapTripStudentRow(data);
  }

  async updateTripStudent(id: string, updates: Partial<TripStudent>): Promise<TripStudent> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.boardingStatus !== undefined) payload.boarding_status = updates.boardingStatus;
    if (updates.exitStatus !== undefined) payload.exit_status = updates.exitStatus;
    if (updates.actualBoardingTimestamp !== undefined) payload.actual_boarding_timestamp = updates.actualBoardingTimestamp;
    if (updates.actualExitTimestamp !== undefined) payload.actual_exit_timestamp = updates.actualExitTimestamp;
    if (updates.stopReachedTimestamp !== undefined) payload.stop_reached_timestamp = updates.stopReachedTimestamp;
    if (updates.expectedExitStopId !== undefined) payload.expected_exit_stop_id = updates.expectedExitStopId;

    const { data, error } = await this.client.from('trip_students').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Supabase error updateTripStudent: ${error.message}`);
    return this.mapTripStudentRow(data);
  }

  private mapTripRow(row: any): Trip {
    return {
      id: row.id,
      schoolId: row.school_id,
      routeId: row.route_id,
      busId: row.bus_id,
      driverId: row.driver_id,
      attendantId: row.attendant_id,
      tripDate: row.trip_date,
      direction: row.direction,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    };
  }

  private mapTripStudentRow(row: any): TripStudent {
    return {
      id: row.id,
      tripId: row.trip_id,
      studentId: row.student_id,
      expectedBoardingStopId: row.expected_boarding_stop_id,
      expectedExitStopId: row.expected_exit_stop_id,
      boardingStatus: row.boarding_status,
      exitStatus: row.exit_status,
      actualBoardingTimestamp: row.actual_boarding_timestamp,
      actualExitTimestamp: row.actual_exit_timestamp,
      stopReachedTimestamp: row.stop_reached_timestamp,
    };
  }
}

export class SupabaseStudentRepository implements IStudentRepository {
  constructor(private client: SupabaseClient) {}

  async findById(id: string): Promise<Student | null> {
    const { data, error } = await this.client.from('students').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error findStudentById: ${error.message}`);
    if (!data) return null;
    return this.mapStudentRow(data);
  }

  async findByRfidCard(cardId: string): Promise<Student | null> {
    const { data, error } = await this.client.from('students').select('*').eq('rfid_card_id', cardId).maybeSingle();
    if (error) throw new Error(`Supabase error findStudentByRfidCard: ${error.message}`);
    if (!data) return null;
    return this.mapStudentRow(data);
  }

  async findBySchool(schoolId: string): Promise<Student[]> {
    const { data, error } = await this.client.from('students').select('*').eq('school_id', schoolId);
    if (error) throw new Error(`Supabase error findStudentsBySchool: ${error.message}`);
    return (data || []).map(this.mapStudentRow);
  }

  async create(student: Student): Promise<Student> {
    const row = {
      id: student.id,
      school_id: student.schoolId,
      admission_number: student.admissionNumber,
      first_name: student.firstName,
      last_name: student.lastName,
      class_name: student.className,
      section: student.section,
      rfid_card_id: student.rfidCardId,
      status: student.status,
      created_at: student.createdAt,
      updated_at: student.updatedAt,
    };
    const { data, error } = await this.client.from('students').insert(row).select().single();
    if (error) throw new Error(`Supabase error createStudent: ${error.message}`);
    return this.mapStudentRow(data);
  }

  async update(id: string, updates: Partial<Student>): Promise<Student> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.rfidCardId !== undefined) payload.rfid_card_id = updates.rfidCardId;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await this.client.from('students').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Supabase error updateStudent: ${error.message}`);
    return this.mapStudentRow(data);
  }

  async findAssignment(studentId: string): Promise<StudentRouteAssignment | null> {
    const { data, error } = await this.client
      .from('student_route_assignments')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'ACTIVE')
      .maybeSingle();
    if (error) throw new Error(`Supabase error findAssignment: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id,
      studentId: data.student_id,
      routeId: data.route_id,
      stopId: data.stop_id,
      effectiveFrom: data.effective_from,
      effectiveUntil: data.effective_until,
      status: data.status,
    };
  }

  async createAssignment(assignment: StudentRouteAssignment): Promise<StudentRouteAssignment> {
    const row = {
      id: assignment.id,
      student_id: assignment.studentId,
      route_id: assignment.routeId,
      stop_id: assignment.stopId,
      effective_from: assignment.effectiveFrom,
      status: assignment.status,
    };
    const { data, error } = await this.client.from('student_route_assignments').insert(row).select().single();
    if (error) throw new Error(`Supabase error createAssignment: ${error.message}`);
    return {
      id: data.id,
      studentId: data.student_id,
      routeId: data.route_id,
      stopId: data.stop_id,
      effectiveFrom: data.effective_from,
      effectiveUntil: data.effective_until,
      status: data.status,
    };
  }

  async updateAssignment(id: string, updates: Partial<StudentRouteAssignment>): Promise<StudentRouteAssignment> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await this.client.from('student_route_assignments').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Supabase error updateAssignment: ${error.message}`);
    return {
      id: data.id,
      studentId: data.student_id,
      routeId: data.route_id,
      stopId: data.stop_id,
      effectiveFrom: data.effective_from,
      effectiveUntil: data.effective_until,
      status: data.status,
    };
  }

  async findGuardiansByStudent(studentId: string): Promise<Guardian[]> {
    const { data, error } = await this.client
      .from('student_guardians')
      .select('*')
      .eq('student_id', studentId);
    if (error) throw new Error(`Supabase error findGuardiansByStudent: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      studentId: row.student_id,
      relationship: row.relationship || row.relation || 'GUARDIAN',
      notificationEnabled: row.notification_enabled ?? true,
    }));
  }

  async findStudentsByGuardianUser(userId: string): Promise<Student[]> {
    const { data: bindings, error } = await this.client
      .from('student_guardians')
      .select('student_id')
      .eq('user_id', userId);
    if (error) throw new Error(`Supabase error findStudentsByGuardianUser: ${error.message}`);
    if (!bindings || bindings.length === 0) return [];

    const studentIds = bindings.map((b: any) => b.student_id);
    const { data: students, error: studentErr } = await this.client
      .from('students')
      .select('*')
      .in('id', studentIds);
    if (studentErr) throw new Error(`Supabase error fetching students by guardian: ${studentErr.message}`);
    return (students || []).map(this.mapStudentRow);
  }

  private mapStudentRow(row: any): Student {
    return {
      id: row.id,
      schoolId: row.school_id,
      admissionNumber: row.admission_number,
      firstName: row.first_name,
      lastName: row.last_name,
      className: row.class_name,
      section: row.section,
      rfidCardId: row.rfid_card_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export class SupabaseJourneyRepository implements IJourneyRepository {
  constructor(private client: SupabaseClient) {}

  async createEvent(event: JourneyEvent): Promise<JourneyEvent> {
    const row = {
      id: event.id,
      school_id: event.schoolId,
      trip_id: event.tripId,
      student_id: event.studentId,
      bus_id: event.busId,
      event_type: event.eventType,
      event_timestamp: event.eventTimestamp,
      latitude: event.latitude,
      longitude: event.longitude,
      source: event.source,
      device_id: event.deviceId,
      idempotency_key: event.idempotencyKey,
      sync_status: event.syncStatus,
      metadata: event.metadata,
      created_at: event.createdAt,
    };
    const { data, error } = await this.client.from('journey_events').insert(row).select().single();
    if (error) throw new Error(`Supabase error createJourneyEvent: ${error.message}`);
    return this.mapEventRow(data);
  }

  async findEventByIdempotencyKey(key: string): Promise<JourneyEvent | null> {
    const { data, error } = await this.client
      .from('journey_events')
      .select('*')
      .eq('idempotency_key', key)
      .maybeSingle();
    if (error) throw new Error(`Supabase error findEventByIdempotencyKey: ${error.message}`);
    if (!data) return null;
    return this.mapEventRow(data);
  }

  async findEventsByTrip(tripId: string): Promise<JourneyEvent[]> {
    const { data, error } = await this.client.from('journey_events').select('*').eq('trip_id', tripId);
    if (error) throw new Error(`Supabase error findEventsByTrip: ${error.message}`);
    return (data || []).map(this.mapEventRow);
  }

  async findEventsByStudent(studentId: string): Promise<JourneyEvent[]> {
    const { data, error } = await this.client.from('journey_events').select('*').eq('student_id', studentId);
    if (error) throw new Error(`Supabase error findEventsByStudent: ${error.message}`);
    return (data || []).map(this.mapEventRow);
  }

  async getStudentJourneyState(studentId: string, tripId: string): Promise<StudentJourneyState | null> {
    const { data, error } = await this.client
      .from('student_journey_states')
      .select('*')
      .eq('student_id', studentId)
      .eq('trip_id', tripId)
      .maybeSingle();
    if (error) throw new Error(`Supabase error getStudentJourneyState: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id,
      studentId: data.student_id,
      tripId: data.trip_id,
      schoolId: data.school_id,
      state: data.state,
      lastEventId: data.last_event_id,
      lastEventTimestamp: data.last_event_timestamp,
      updatedAt: data.updated_at,
    };
  }

  async upsertStudentJourneyState(state: StudentJourneyState): Promise<StudentJourneyState> {
    const row = {
      id: state.id,
      school_id: state.schoolId,
      trip_id: state.tripId,
      student_id: state.studentId,
      state: state.state,
      last_event_id: state.lastEventId,
      last_event_timestamp: state.lastEventTimestamp,
      updated_at: state.updatedAt,
    };
    const { data, error } = await this.client
      .from('student_journey_states')
      .upsert(row, { onConflict: 'trip_id,student_id' })
      .select()
      .single();
    if (error) throw new Error(`Supabase error upsertStudentJourneyState: ${error.message}`);
    return {
      id: data.id,
      studentId: data.student_id,
      tripId: data.trip_id,
      schoolId: data.school_id,
      state: data.state,
      lastEventId: data.last_event_id,
      lastEventTimestamp: data.last_event_timestamp,
      updatedAt: data.updated_at,
    };
  }

  private mapEventRow(row: any): JourneyEvent {
    return {
      id: row.id,
      schoolId: row.school_id,
      tripId: row.trip_id,
      studentId: row.student_id,
      busId: row.bus_id,
      eventType: row.event_type,
      eventTimestamp: row.event_timestamp,
      latitude: row.latitude,
      longitude: row.longitude,
      source: row.source,
      deviceId: row.device_id,
      idempotencyKey: row.idempotency_key,
      syncStatus: row.sync_status,
      metadata: row.metadata,
      createdAt: row.created_at,
    };
  }
}

export class SupabaseGpsRepository implements IGpsRepository {
  constructor(private client: SupabaseClient) {}

  async createLocation(location: GPSLocation): Promise<GPSLocation> {
    const row = {
      id: location.id,
      school_id: location.schoolId,
      bus_id: location.busId,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed,
      heading: location.heading,
      accuracy: location.accuracy,
      recorded_at: location.recordedAt,
      received_at: location.receivedAt,
    };
    const { data, error } = await this.client.from('gps_locations').insert(row).select().single();
    if (error) throw new Error(`Supabase error createLocation: ${error.message}`);
    return this.mapGpsLocationRow(data);
  }

  async getLatestLocationByBus(busId: string): Promise<GPSLocation | null> {
    const { data, error } = await this.client
      .from('gps_locations')
      .select('*')
      .eq('bus_id', busId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Supabase error getLatestLocationByBus: ${error.message}`);
    if (!data) return null;
    return this.mapGpsLocationRow(data);
  }

  async getLocationsByBus(busId: string, limit = 50): Promise<GPSLocation[]> {
    const { data, error } = await this.client
      .from('gps_locations')
      .select('*')
      .eq('bus_id', busId)
      .order('recorded_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase error getLocationsByBus: ${error.message}`);
    return (data || []).map(this.mapGpsLocationRow);
  }

  private mapGpsLocationRow(row: any): GPSLocation {
    return {
      id: row.id,
      busId: row.bus_id,
      schoolId: row.school_id,
      latitude: row.latitude,
      longitude: row.longitude,
      location: {
        type: 'Point',
        coordinates: [row.longitude, row.latitude],
      },
      speed: row.speed,
      heading: row.heading,
      accuracy: row.accuracy,
      recordedAt: row.recorded_at,
      receivedAt: row.received_at,
    };
  }
}

export class SupabaseExceptionRepository implements IExceptionRepository {
  constructor(private client: SupabaseClient) {}

  async create(exception: JourneyException): Promise<JourneyException> {
    const row = {
      id: exception.id,
      school_id: exception.schoolId,
      trip_id: exception.tripId,
      student_id: exception.studentId,
      bus_id: exception.busId,
      type: exception.type,
      severity: exception.severity,
      status: exception.status,
      description: exception.description || `${exception.type} exception`,
      metadata: exception.metadata,
      resolved_at: exception.resolvedAt,
      resolved_by: exception.resolvedBy,
      resolution_reason: exception.resolutionReason,
      created_at: exception.createdAt,
    };
    const { data, error } = await this.client.from('exceptions').insert(row).select().single();
    if (error) throw new Error(`Supabase error createException: ${error.message}`);
    return this.mapExceptionRow(data);
  }

  async findById(id: string): Promise<JourneyException | null> {
    const { data, error } = await this.client.from('exceptions').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error findExceptionById: ${error.message}`);
    if (!data) return null;
    return this.mapExceptionRow(data);
  }

  async findByTrip(tripId: string): Promise<JourneyException[]> {
    const { data, error } = await this.client.from('exceptions').select('*').eq('trip_id', tripId);
    if (error) throw new Error(`Supabase error findExceptionsByTrip: ${error.message}`);
    return (data || []).map(this.mapExceptionRow);
  }

  async findBySchool(schoolId: string, status?: string): Promise<JourneyException[]> {
    let query = this.client.from('exceptions').select('*').eq('school_id', schoolId);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error findExceptionsBySchool: ${error.message}`);
    return (data || []).map(this.mapExceptionRow);
  }

  async update(id: string, updates: Partial<JourneyException>): Promise<JourneyException> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.resolvedAt !== undefined) payload.resolved_at = updates.resolvedAt;
    if (updates.resolvedBy !== undefined) payload.resolved_by = updates.resolvedBy;
    if (updates.resolutionReason !== undefined) payload.resolution_reason = updates.resolutionReason;

    const { data, error } = await this.client.from('exceptions').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Supabase error updateException: ${error.message}`);
    return this.mapExceptionRow(data);
  }

  private mapExceptionRow(row: any): JourneyException {
    return {
      id: row.id,
      schoolId: row.school_id,
      tripId: row.trip_id,
      studentId: row.student_id,
      busId: row.bus_id,
      type: row.type,
      severity: row.severity,
      status: row.status,
      description: row.description,
      metadata: row.metadata,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      resolvedBy: row.resolved_by,
      resolutionReason: row.resolution_reason,
    };
  }
}

export class SupabaseNotificationRepository implements INotificationRepository {
  constructor(private client: SupabaseClient) {}

  async create(notification: Notification): Promise<Notification> {
    const row = {
      id: notification.id,
      user_id: notification.userId,
      school_id: notification.schoolId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      read_at: notification.readAt,
      created_at: notification.createdAt,
    };
    const { data, error } = await this.client.from('notifications').insert(row).select().single();
    if (error) throw new Error(`Supabase error createNotification: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      schoolId: data.school_id,
      type: data.type,
      title: data.title,
      body: data.body,
      readAt: data.read_at,
      createdAt: data.created_at,
    };
  }

  async findByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await this.client.from('notifications').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error findNotificationsByUser: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      schoolId: row.school_id,
      type: row.type,
      title: row.title,
      body: row.body,
      readAt: row.read_at,
      createdAt: row.created_at,
    }));
  }

  async update(id: string, updates: Partial<Notification>): Promise<Notification> {
    const payload: Record<string, unknown> = {};
    if (updates.readAt !== undefined) payload.read_at = updates.readAt;

    const { data, error } = await this.client.from('notifications').update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Supabase error updateNotification: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      schoolId: data.school_id,
      type: data.type,
      title: data.title,
      body: data.body,
      readAt: data.read_at,
      createdAt: data.created_at,
    };
  }
}

export class SupabaseAuditRepository implements IAuditRepository {
  constructor(private client: SupabaseClient) {}

  async create(log: AuditLog): Promise<AuditLog> {
    const row = {
      id: log.id,
      school_id: log.schoolId,
      actor_user_id: log.actorUserId,
      action: log.action,
      entity_type: log.entityType,
      entity_id: log.entityId,
      before: log.before,
      after: log.after,
      reason: log.reason,
      created_at: log.createdAt,
    };
    const { data, error } = await this.client.from('audit_logs').insert(row).select().single();
    if (error) throw new Error(`Supabase error createAuditLog: ${error.message}`);
    return {
      id: data.id,
      schoolId: data.school_id,
      actorUserId: data.actor_user_id,
      action: data.action,
      entityType: data.entity_type,
      entityId: data.entity_id,
      before: data.before,
      after: data.after,
      reason: data.reason,
      createdAt: data.created_at,
    };
  }

  async findBySchool(schoolId: string, limit = 100): Promise<AuditLog[]> {
    const { data, error } = await this.client
      .from('audit_logs')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase error findAuditLogsBySchool: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      schoolId: row.school_id,
      actorUserId: row.actor_user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      before: row.before,
      after: row.after,
      reason: row.reason,
      createdAt: row.created_at,
    }));
  }
}

export class SupabaseUserRepository implements IUserRepository {
  constructor(private client: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error findUserById: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id,
      schoolId: data.school_id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async resolveAuthContext(userId: string): Promise<AuthContext | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const { data: binding } = await this.client
      .from('user_schools')
      .select('school_id, role')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    const schoolId = binding ? binding.school_id : undefined;
    const role: UserRole = binding ? (binding.role as UserRole) : 'PARENT';

    return {
      userId: user.id,
      email: user.email,
      role,
      schoolId,
      isSuperAdmin: role === 'SUPER_ADMIN',
    };
  }
}

export class SupabaseContainer implements IRepositoryContainer {
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

  constructor(client: SupabaseClient) {
    this.schoolRepo = new SupabaseSchoolRepository(client);
    this.busRepo = new SupabaseBusRepository(client);
    this.deviceRepo = new SupabaseDeviceRepository(client);
    this.routeRepo = new SupabaseRouteRepository(client);
    this.tripRepo = new SupabaseTripRepository(client);
    this.studentRepo = new SupabaseStudentRepository(client);
    this.journeyRepo = new SupabaseJourneyRepository(client);
    this.gpsRepo = new SupabaseGpsRepository(client);
    this.exceptionRepo = new SupabaseExceptionRepository(client);
    this.notificationRepo = new SupabaseNotificationRepository(client);
    this.auditRepo = new SupabaseAuditRepository(client);
    this.userRepo = new SupabaseUserRepository(client);
  }
}
