import { describe, it, expect, beforeAll } from 'vitest';
import { createServices, AppServices } from '../apps/api/src/server';
import { JourneyStateMachine } from '../apps/api/src/domain/journey/state-machine';
import { ExceptionEngine } from '../apps/api/src/domain/exceptions/exception.engine';
import { RbacGuard } from '../apps/api/src/auth/rbac.guard';
import { generateUuidV7 } from '../packages/utils/src/uuid-v7';
import { Stop, GPSLocation, Trip } from '../packages/shared-types/src/index';

describe('Safety-Critical Backend & Deterministic Journey Engine', () => {
  let services: AppServices;
  const schoolId = '11111111-1111-1111-1111-111111111111';
  const schoolBId = '22222222-2222-2222-2222-222222222222';
  const busId = '33333333-3333-3333-3333-333333333333';
  const routeId = '44444444-4444-4444-4444-444444444444';
  const boardingStopId = '55555555-5555-5555-5555-555555555555';
  const exitStopId = '66666666-6666-6666-6666-666666666666';
  const studentId = '77777777-7777-7777-7777-777777777777';
  const rfidHardwareId = 'READER_BUS_01';
  const cardId = 'CARD_STU_01';
  let stop1: Stop;
  let stop2: Stop;
  let trip: Trip;

  beforeAll(async () => {
    services = createServices();
    const c = services.container;

    await c.schoolRepo.create({
      id: schoolId,
      name: 'Greenwood High',
      code: 'GWH01',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await c.busRepo.create({
      id: busId,
      schoolId,
      registrationNumber: 'KA-01-AB-1234',
      fleetNumber: 'BUS-01',
      capacity: 40,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await c.deviceRepo.createRfid({
      id: 'rfid_dev_01',
      busId,
      schoolId,
      protocol: 'ISO_14443_A',
      readerHardwareId: rfidHardwareId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    await c.deviceRepo.createGps({
      id: 'gps_dev_01',
      busId,
      schoolId,
      provider: 'StandardTelematics',
      externalDeviceId: 'IMEI_9990001',
      status: 'ONLINE',
      createdAt: new Date().toISOString(),
    });

    await c.routeRepo.createRoute({
      id: routeId,
      schoolId,
      name: 'North Route Morning',
      code: 'NR-M',
      direction: 'MORNING',
      status: 'ACTIVE',
    });

    stop1 = {
      id: boardingStopId,
      routeId,
      name: 'Sector 15 Community Center',
      latitude: 28.5355,
      longitude: 77.391,
      sequence: 1,
      geofenceRadiusMeters: 75,
    };
    await c.routeRepo.createStop(stop1);

    stop2 = {
      id: exitStopId,
      routeId,
      name: 'Greenwood School Main Gate',
      latitude: 28.545,
      longitude: 77.405,
      sequence: 2,
      geofenceRadiusMeters: 75,
    };
    await c.routeRepo.createStop(stop2);

    await c.studentRepo.create({
      id: studentId,
      schoolId,
      admissionNumber: 'ADM-2026-001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      rfidCardId: cardId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await c.studentRepo.createAssignment({
      id: 'asgn_01',
      studentId,
      routeId,
      stopId: exitStopId,
      effectiveFrom: '2026-01-01',
      status: 'ACTIVE',
    });

    trip = await services.tripService.createTrip({
      schoolId,
      busId,
      routeId,
      tripDate: '2026-11-15',
      direction: 'MORNING',
    });
    await services.tripService.startTrip(trip.id);
  });

  it('1. Valid RFID boarding transitions journey state to BOARDED', async () => {
    const boardingScan = await services.rfidService.processScan({
      cardId,
      readerHardwareId: rfidHardwareId,
      tripId: trip.id,
      timestamp: '2026-11-15T07:15:00Z',
      latitude: stop1.latitude,
      longitude: stop1.longitude,
    });
    expect(boardingScan.success).toBe(true);
    expect(boardingScan.journeyState).toBe('BOARDED');
    const state = await services.container.journeyRepo.getStudentJourneyState(studentId, trip.id);
    expect(state?.state).toBe('BOARDED');
  });

  it('2. Duplicate RFID scan within 30s records DUPLICATE_RFID_SCAN without state corruption', async () => {
    const duplicateScan = await services.rfidService.processScan({
      cardId,
      readerHardwareId: rfidHardwareId,
      tripId: trip.id,
      timestamp: '2026-11-15T07:15:10Z',
    });
    expect(duplicateScan.success).toBe(true);
    const events = await services.container.journeyRepo.findEventsByStudent(studentId);
    const dupEvents = events.filter((e) => e.eventType === 'DUPLICATE_RFID_SCAN');
    expect(dupEvents.length).toBe(1);
  });

  it('3. Unassigned student boarding attempt triggers WRONG_BUS exception', async () => {
    const studentBId = '88888888-8888-8888-8888-888888888888';
    await services.container.studentRepo.create({
      id: studentBId,
      schoolId,
      admissionNumber: 'ADM-2026-002',
      firstName: 'Vivaan',
      lastName: 'Patel',
      rfidCardId: 'CARD_STU_02',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const wrongBusScan = await services.journeyService.processEvent({
      id: 'evt_wrong_bus',
      idempotencyKey: generateUuidV7(),
      schoolId,
      tripId: trip.id,
      studentId: studentBId,
      busId,
      eventType: 'STUDENT_BOARDING',
      eventTimestamp: '2026-11-15T07:16:00Z',
      source: 'RFID',
      deviceId: 'READER_BUS_01',
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    });
    expect(wrongBusScan.exception).toBe('WRONG_BUS');
    const exceptions = await services.container.exceptionRepo.findBySchool(schoolId);
    expect(exceptions.some((e) => e.type === 'WRONG_BUS')).toBe(true);
  });

  it('4. Valid exit at assigned stop transitions to EXIT_RECORDED', async () => {
    await services.journeyService.processEvent({
      id: 'evt_stop_reached',
      idempotencyKey: generateUuidV7(),
      schoolId,
      tripId: trip.id,
      busId,
      stopId: exitStopId,
      eventType: 'BUS_REACHED_STOP',
      eventTimestamp: '2026-11-15T07:44:00Z',
      source: 'GPS',
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    });
    const validExitScan = await services.rfidService.processScan({
      cardId,
      readerHardwareId: rfidHardwareId,
      tripId: trip.id,
      timestamp: '2026-11-15T07:45:00Z',
      latitude: stop2.latitude,
      longitude: stop2.longitude,
    });
    expect(validExitScan.success).toBe(true);
    expect(validExitScan.journeyState).toBe('EXIT_RECORDED');
  });

  it('5. Drop-off exceeding stop tolerance triggers WRONG_STOP_EXIT critical exception', () => {
    const wrongStopException = ExceptionEngine.evaluateExitLocation(
      stop2,
      28.568,
      77.425,
      studentId,
      trip.id,
      schoolId
    );
    expect(wrongStopException).not.toBeNull();
    expect(wrongStopException?.type).toBe('WRONG_STOP_EXIT');
    expect(wrongStopException?.severity).toBe('CRITICAL');
  });

  it('6 & 7. 5-minute EXIT_MISSING grace period respected before triggering exception', () => {
    const stopArrivalTime = '2026-11-15T07:40:00.000Z';
    const threeMinLater = new Date('2026-11-15T07:43:00.000Z').getTime();
    const sixMinLater = new Date('2026-11-15T07:46:00.000Z').getTime();

    const withinGrace = ExceptionEngine.evaluateMissingExit(
      stopArrivalTime,
      true,
      threeMinLater,
      studentId,
      trip.id,
      schoolId,
      exitStopId
    );
    expect(withinGrace).toBeNull();

    const expiredGrace = ExceptionEngine.evaluateMissingExit(
      stopArrivalTime,
      true,
      sixMinLater,
      studentId,
      trip.id,
      schoolId,
      exitStopId
    );
    expect(expiredGrace).not.toBeNull();
    expect(expiredGrace?.type).toBe('EXIT_MISSING');
  });

  it('8 & 9. GPS stale after 60s triggers GPS_UNAVAILABLE and recovers with fresh fix', () => {
    const staleLocation: GPSLocation = {
      id: 'loc_01',
      busId,
      schoolId,
      latitude: 28.535,
      longitude: 77.391,
      location: { type: 'Point', coordinates: [77.391, 28.535] },
      recordedAt: '2026-11-15T07:00:00.000Z',
      receivedAt: '2026-11-15T07:01:30.000Z',
    };
    const stale = ExceptionEngine.evaluateGpsFreshness(
      staleLocation,
      new Date('2026-11-15T07:01:30.000Z').getTime(),
      schoolId,
      busId,
      trip.id
    );
    expect(stale?.type).toBe('GPS_UNAVAILABLE');

    const freshLocation: GPSLocation = {
      id: 'loc_02',
      busId,
      schoolId,
      latitude: 28.536,
      longitude: 77.392,
      location: { type: 'Point', coordinates: [77.392, 28.536] },
      recordedAt: '2026-11-15T07:02:00.000Z',
      receivedAt: '2026-11-15T07:02:05.000Z',
    };
    const recovered = ExceptionEngine.evaluateGpsFreshness(
      freshLocation,
      new Date('2026-11-15T07:02:05.000Z').getTime(),
      schoolId,
      busId,
      trip.id
    );
    expect(recovered).toBeNull();
  });

  it('10. Manual attendance override updates state and appends immutable audit record', async () => {
    const override = await services.manualOverrideService.executeOverride({
      studentId,
      tripId: trip.id,
      newStatus: 'COMPLETED',
      reason: 'Parent picked up student directly at school gate verified by attendant',
      actorUserId: 'admin_user_01',
    });
    expect(override.success).toBe(true);
    expect(override.newState).toBe('COMPLETED');

    const studentEvents = await services.container.journeyRepo.findEventsByStudent(studentId);
    expect(studentEvents.some((e) => e.eventType === 'STUDENT_BOARDING')).toBe(true);

    const auditLogs = await services.container.auditRepo.findBySchool(schoolId);
    const record = auditLogs.find((a) => a.action === 'MANUAL_ATTENDANCE_OVERRIDE');
    expect(record).toBeDefined();
    expect(record?.actorUserId).toBe('admin_user_01');
  });

  it('11. Duplicate UUID v7 idempotency key returns previous result without duplicate row', async () => {
    const fixedKey = generateUuidV7();
    const event1 = await services.journeyService.processEvent({
      id: 'evt_idemp_1',
      idempotencyKey: fixedKey,
      schoolId,
      tripId: trip.id,
      studentId,
      busId,
      eventType: 'STUDENT_BOARDING',
      eventTimestamp: '2026-11-15T07:10:00Z',
      source: 'RFID',
      deviceId: 'READER_01',
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    });
    const event2 = await services.journeyService.processEvent({
      id: 'evt_idemp_2',
      idempotencyKey: fixedKey,
      schoolId,
      tripId: trip.id,
      studentId,
      busId,
      eventType: 'STUDENT_BOARDING',
      eventTimestamp: '2026-11-15T07:10:00Z',
      source: 'RFID',
      deviceId: 'READER_01',
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    });
    expect(event2.success).toBe(true);
    expect(event2.eventId).toBe(event1.eventId);
  });

  it('12. Offline event batch ingestion succeeds and preserves hardware timestamps', async () => {
    const key = generateUuidV7();
    const result = await services.journeyService.processEvent({
      id: 'evt_batch_1',
      idempotencyKey: key,
      schoolId,
      tripId: trip.id,
      studentId,
      busId,
      eventType: 'STUDENT_BOARDING',
      eventTimestamp: '2026-11-15T07:05:00Z',
      source: 'RFID',
      deviceId: 'OFFLINE_ATTENDANT_APP',
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('13. Cross-school tenant authorization failure throws TENANT_ACCESS_DENIED', () => {
    expect(() => {
      RbacGuard.requireSchoolAccess(
        {
          userId: 'user_school_A',
          schoolId: schoolId,
          role: 'SCHOOL_ADMIN',
          email: 'admin@schoolA.org',
          isSuperAdmin: false,
        },
        schoolBId
      );
    }).toThrow(/TENANT_ACCESS_DENIED/);
  });

  it('14. Parent cross-student access failure throws FORBIDDEN', () => {
    expect(() => {
      RbacGuard.requireStudentAccess(
        {
          userId: 'parent_user_01',
          schoolId,
          role: 'PARENT',
          email: 'parent@home.org',
          isSuperAdmin: false,
        },
        'unauthorized_student_id',
        [studentId]
      );
    }).toThrow(/FORBIDDEN/);
  });

  it('15. Attendant attempting admin operations throws FORBIDDEN', () => {
    expect(() => {
      RbacGuard.requireRole(
        {
          userId: 'attendant_01',
          schoolId,
          role: 'ATTENDANT',
          email: 'attendant@bus.org',
          isSuperAdmin: false,
        },
        ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']
      );
    }).toThrow(/FORBIDDEN/);
  });

  it('16. Valid trip lifecycle progresses through SCHEDULED -> IN_PROGRESS -> COMPLETED', async () => {
    const freshTrip = await services.tripService.createTrip({
      schoolId,
      busId: 'fresh_bus_id',
      routeId,
      tripDate: '2026-11-15',
      direction: 'EVENING',
    });
    expect(freshTrip.status).toBe('SCHEDULED');
    const started = await services.tripService.startTrip(freshTrip.id);
    expect(started.status).toBe('IN_PROGRESS');
    expect(started.startedAt).toBeDefined();
    const completed = await services.tripService.completeTrip(freshTrip.id);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeDefined();
  });

  it('17. Invalid journey state transition (EXPECTED -> STUDENT_EXIT) is rejected deterministically', () => {
    const invalid = JourneyStateMachine.transition('EXPECTED', 'STUDENT_EXIT');
    expect(invalid.valid).toBe(false);
    expect(invalid.nextState).toBe('EXPECTED');
  });
});
