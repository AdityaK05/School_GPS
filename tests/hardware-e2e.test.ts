import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { createServer, createServices, AppServices } from '../apps/api/src/server';
import { ApiClient } from '../packages/client-sdk/src/api-client';
import { OfflineSyncEngine, MemoryQueueStorage } from '../packages/client-sdk/src/offline-queue';
import { ParentService } from '../apps/mobile/src/services/parent.service';
import { GenericJsonGpsAdapter, TeltonikaGpsAdapter } from '../apps/api/src/domain/hardware/gps/gps-adapter';
import { Iso14443RfidAdapter } from '../apps/api/src/domain/hardware/rfid/rfid-adapter';
import { GPSSimulator } from '../apps/api/src/domain/hardware/simulators/gps.simulator';
import { RFIDSimulator } from '../apps/api/src/domain/hardware/simulators/rfid.simulator';
import { THRESHOLDS } from '../packages/constants/src/index';

describe('Hardware / Device Integration & End-to-End Validation (Prompt 3)', () => {
  let server: http.Server;
  let baseUrl: string;
  let services: AppServices;

  const schoolAId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const schoolBId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const adminAToken = `test-token:admin_a:SCHOOL_ADMIN:${schoolAId}`;
  const adminBToken = `test-token:admin_b:SCHOOL_ADMIN:${schoolBId}`;
  const parentToken = `test-token:parent_aarav:PARENT:${schoolAId}`;

  // Hardware IDs
  let bus1Id: string;
  let bus2Id: string;
  let route1Id: string;
  let boardingStopId: string;
  let exitStopId: string;
  let trip1Id: string;
  let student1Id: string;
  let student2Id: string;

  const rfidReaderBus1 = 'READER_HW_BUS_101';
  const rfidReaderBus2 = 'READER_HW_BUS_102';
  const gpsDeviceBus1 = 'GPS_HW_BUS_101';
  const gpsDeviceBus2 = 'GPS_HW_BUS_102';

  const cardToken1 = 'CARD_TOK_STUDENT_01';
  const cardToken2 = 'CARD_TOK_STUDENT_02';

  // Stop coordinates
  const boardingStopLat = 12.9352;
  const boardingStopLon = 77.6245;
  const exitStopLat = 12.9716;
  const exitStopLon = 77.5946;

  beforeAll(async () => {
    services = createServices();

    // 1. Setup School A & School B
    await services.container.schoolRepo.create({
      id: schoolAId,
      name: 'Delhi Public School Bangalore East',
      code: 'DPS01',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await services.container.schoolRepo.create({
      id: schoolBId,
      name: 'National Public School Indiranagar',
      code: 'NPS02',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Setup Fleet on School A
    const bus1 = await services.fleetService.createBus({
      schoolId: schoolAId,
      registrationNumber: 'KA-01-AB-1001',
      fleetNumber: 'BUS-101',
      capacity: 40,
    });
    bus1Id = bus1.id;

    const bus2 = await services.fleetService.createBus({
      schoolId: schoolAId,
      registrationNumber: 'KA-01-AB-1002',
      fleetNumber: 'BUS-102',
      capacity: 40,
    });
    bus2Id = bus2.id;

    // 3. Register & Assign Initial GPS and RFID Hardware
    const gps1 = await services.deviceManagerService.registerGpsDevice({
      schoolId: schoolAId,
      busId: bus1Id,
      provider: 'GENERIC_TELEMATICS',
      externalDeviceId: gpsDeviceBus1,
    });
    await services.deviceManagerService.assignGpsToBus(bus1Id, gps1.id);

    const rfid1 = await services.deviceManagerService.registerRfidDevice({
      schoolId: schoolAId,
      busId: bus1Id,
      readerHardwareId: rfidReaderBus1,
      protocol: 'ISO_14443_A',
    });
    await services.deviceManagerService.assignRfidToBus(bus1Id, rfid1.id);

    const gps2 = await services.deviceManagerService.registerGpsDevice({
      schoolId: schoolAId,
      busId: bus2Id,
      provider: 'GENERIC_TELEMATICS',
      externalDeviceId: gpsDeviceBus2,
    });
    await services.deviceManagerService.assignGpsToBus(bus2Id, gps2.id);

    const rfid2 = await services.deviceManagerService.registerRfidDevice({
      schoolId: schoolAId,
      busId: bus2Id,
      readerHardwareId: rfidReaderBus2,
      protocol: 'ISO_14443_A',
    });
    await services.deviceManagerService.assignRfidToBus(bus2Id, rfid2.id);

    // 4. Setup Route & Stops for Bus 1
    const route = await services.routeService.createRoute({
      schoolId: schoolAId,
      name: 'Koramangala to School Morning',
      code: 'R-KM-01',
      direction: 'MORNING',
    });
    route1Id = route.id;

    const bStop = await services.routeService.createStop({
      routeId: route1Id,
      name: 'Koramangala 4th Block Stop',
      latitude: boardingStopLat,
      longitude: boardingStopLon,
      sequence: 1,
      geofenceRadiusMeters: 75,
    });
    boardingStopId = bStop.id;

    const eStop = await services.routeService.createStop({
      routeId: route1Id,
      name: 'DPS School Main Gate',
      latitude: exitStopLat,
      longitude: exitStopLon,
      sequence: 2,
      geofenceRadiusMeters: 75,
    });
    exitStopId = eStop.id;

    // 5. Setup Students
    const s1 = await services.studentService.createStudent({
      schoolId: schoolAId,
      admissionNumber: 'DPS-2026-001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      rfidCardId: cardToken1,
    });
    student1Id = s1.id;

    const s2 = await services.studentService.createStudent({
      schoolId: schoolAId,
      admissionNumber: 'DPS-2026-002',
      firstName: 'Rohan',
      lastName: 'Verma',
      rfidCardId: cardToken2,
    });
    student2Id = s2.id;

    // Assign Student 1 to Route 1 and Stops
    await services.studentService.assignRoute({
      studentId: student1Id,
      routeId: route1Id,
      stopId: boardingStopId,
      effectiveFrom: '2026-01-01',
    });

    // 6. Create & Start Morning Trip on Bus 1
    const trip = await services.tripService.createTrip({
      schoolId: schoolAId,
      routeId: route1Id,
      busId: bus1Id,
      tripDate: new Date().toISOString().split('T')[0],
      direction: 'MORNING',
    });
    trip1Id = trip.id;
    await services.tripService.startTrip(trip1Id);

    // Update Student 1 expected exit stop in manifest to DPS Main Gate
    const manifest = await services.container.tripRepo.findTripStudents(trip1Id);
    const ts1 = manifest.find((m) => m.studentId === student1Id);
    if (ts1) {
      await services.container.tripRepo.updateTripStudent(ts1.id, {
        expectedExitStopId: exitStopId,
      });
    }

    // Start API Server
    server = createServer(services);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // ==========================================
  // SECTION 1: HARDWARE ADAPTERS & SIMULATORS
  // ==========================================
  describe('Device Adapters & Parsing Robustness', () => {
    it('GenericJsonGpsAdapter normalizes valid payload and enforces coordinate boundaries', () => {
      const adapter = new GenericJsonGpsAdapter();
      const normalized = adapter.normalize({
        imei: '868123456789012',
        lat: 12.9352,
        lon: 77.6245,
        speed: 42,
        heading: 180,
        timestamp: '2026-11-15T08:00:00.000Z',
      });

      expect(normalized.deviceId).toBe('868123456789012');
      expect(normalized.latitude).toBe(12.9352);
      expect(normalized.longitude).toBe(77.6245);
      expect(normalized.speed).toBe(42);
      expect(normalized.recordedAt).toBe('2026-11-15T08:00:00.000Z');
      expect(normalized.receivedAt).toBeDefined();

      // Negative validation: out-of-bounds latitude
      expect(() => adapter.normalize({ imei: '123', lat: 95.0, lon: 77.0 })).toThrow('INVALID_COORDINATES');
      // Negative validation: out-of-bounds longitude
      expect(() => adapter.normalize({ imei: '123', lat: 12.0, lon: 195.0 })).toThrow('INVALID_COORDINATES');
      // Negative validation: missing deviceId
      expect(() => adapter.normalize({ lat: 12.0, lon: 77.0 })).toThrow('MALFORMED_GPS_PAYLOAD');
    });

    it('TeltonikaGpsAdapter converts AVL integer microdegrees into standard decimal degrees', () => {
      const adapter = new TeltonikaGpsAdapter();
      const normalized = adapter.normalize({
        imei: '358123456789012',
        lat: 129352000, // microdegrees
        lon: 776245000, // microdegrees
        speed: 25,
        angle: 90,
      });

      expect(normalized.deviceId).toBe('358123456789012');
      expect(normalized.latitude).toBeCloseTo(12.9352, 4);
      expect(normalized.longitude).toBeCloseTo(77.6245, 4);
      expect(normalized.heading).toBe(90);
    });

    it('Iso14443RfidAdapter enforces 13.56MHz contactless standards and rejects biometric data', () => {
      const adapter = new Iso14443RfidAdapter();
      const normalized = adapter.normalize({
        readerHardwareId: 'ACR122U_001',
        cardId: '04A1B2C3D4',
        timestamp: '2026-11-15T08:05:00.000Z',
      });

      expect(normalized.readerHardwareId).toBe('ACR122U_001');
      expect(normalized.cardToken).toBe('04A1B2C3D4');
      expect(normalized.protocol).toBe('ISO_14443_A');

      // Negative validation: reject biometric payload
      expect(() =>
        adapter.normalize({
          readerHardwareId: 'ACR122U_001',
          cardId: '04A1B2C3D4',
          fingerprint: 'base64_encoded_minutiae',
        })
      ).toThrow('SECURITY_VIOLATION');
    });
  });

  // ==========================================
  // SECTION 2: END-TO-END SCENARIOS 1 THROUGH 15
  // ==========================================

  describe('Scenario 1 — Normal Complete Journey Lifecycle', () => {
    it('executes EXPECTED -> BOARDED -> ONBOARD -> EXIT_PENDING -> EXIT_RECORDED -> COMPLETED without exceptions', async () => {
      const client = new ApiClient({ baseUrl, getToken: () => adminAToken });

      // Step 1: Initial State is EXPECTED / BOARDING_PENDING (since trip is IN_PROGRESS)
      const manifestBefore = await client.getTripManifest(trip1Id);
      const student1Entry = manifestBefore.find((s) => s.studentId === student1Id);
      expect(student1Entry?.boardingStatus).toBe('PENDING');

      // Step 2: Valid Boarding Scan at Boarding Stop
      const boardResult = await client.scanRfid({
        cardId: cardToken1,
        readerHardwareId: rfidReaderBus1,
        tripId: trip1Id,
        latitude: boardingStopLat,
        longitude: boardingStopLon,
      });
      expect(boardResult.success).toBe(true);
      expect(boardResult.journeyState).toBe('BOARDED');
      expect(boardResult.exception).toBeNull();

      // Step 3: Bus moves -> GPS location update transitions student to ONBOARD
      await client.ingestGps({
        deviceId: gpsDeviceBus1,
        latitude: 12.9500,
        longitude: 77.6100,
        speed: 35,
        recordedAt: new Date().toISOString(),
      });
      const currentJourney = await services.container.journeyRepo.getStudentJourneyState(student1Id, trip1Id);
      expect(currentJourney?.state).toBe('ONBOARD');

      // Step 4: Bus reaches assigned exit stop -> transitions student to EXIT_PENDING
      await client.ingestGps({
        deviceId: gpsDeviceBus1,
        latitude: exitStopLat,
        longitude: exitStopLon, // inside stop geofence
        speed: 0,
        recordedAt: new Date().toISOString(),
      });
      const exitPendingState = await services.container.journeyRepo.getStudentJourneyState(student1Id, trip1Id);
      expect(exitPendingState?.state).toBe('EXIT_PENDING');

      // Step 5: RFID Exit Scan at assigned stop (>30s after boarding to avoid duplicate detection)
      const exitResult = await client.scanRfid({
        cardId: cardToken1,
        readerHardwareId: rfidReaderBus1,
        tripId: trip1Id,
        latitude: exitStopLat,
        longitude: exitStopLon,
        timestamp: new Date(Date.now() + 60 * 1000).toISOString(),
      });
      expect(exitResult.success).toBe(true);
      expect(exitResult.journeyState).toBe('EXIT_RECORDED');
      expect(exitResult.exception).toBeNull();

      // Step 6: Trip Completes
      const completedTrip = await client.completeTrip(trip1Id);
      expect(completedTrip.status).toBe('COMPLETED');

      // Final student state is COMPLETED
      const finalJourney = await services.container.journeyRepo.getStudentJourneyState(student1Id, trip1Id);
      expect(finalJourney?.state).toBe('COMPLETED');
    });
  });

  describe('Scenario 2 — Wrong Bus Detection', () => {
    it('raises WRONG_BUS critical exception when student taps on an unassigned bus', async () => {
      const client = new ApiClient({ baseUrl, getToken: () => adminAToken });

      // Student 2 is NOT assigned to Bus 1's trip
      const wrongBusResult = await client.scanRfid({
        cardId: cardToken2,
        readerHardwareId: rfidReaderBus1,
        tripId: trip1Id,
      });

      expect(wrongBusResult.exception).toBe('WRONG_BUS');

      // Verify WRONG_BUS exception recorded in exception repository
      const exceptions = await client.getExceptions();
      const wrongBusEx = exceptions.find((e) => e.studentId === student2Id && e.type === 'WRONG_BUS');
      expect(wrongBusEx).toBeDefined();
      expect(wrongBusEx?.severity).toBe('CRITICAL');
    });
  });

  describe('Scenario 3 — Duplicate RFID Scan Ingestion', () => {
    it('identifies scan within 30-second window as duplicate without secondary state mutation', async () => {
      const client = new ApiClient({ baseUrl, getToken: () => adminAToken });

      // First scan
      const firstScan = await client.scanRfid({
        cardId: cardToken1,
        readerHardwareId: rfidReaderBus1,
        tripId: trip1Id,
      });

      // Immediate second scan (< 30s)
      const secondScan = await client.scanRfid({
        cardId: cardToken1,
        readerHardwareId: rfidReaderBus1,
        tripId: trip1Id,
      });

      expect(secondScan.exception).toBe('DUPLICATE_SCAN');
      expect(secondScan.journeyState).toBe(firstScan.journeyState);
    });
  });

  describe('Scenario 4 & 5 — Offline Boarding & Idempotent Retry', () => {
    it('queues offline event, transitions PENDING -> SYNCED, and retransmission is idempotent', async () => {
      const client = new ApiClient({ baseUrl, getToken: () => adminAToken });
      const storage = new MemoryQueueStorage();
      const syncEngine = new OfflineSyncEngine(storage, client, 'device_offline_validator');

      // 1. Enqueue offline event
      const idempotencyKey = '11111111-2222-3333-4444-555555555555';
      const queued = await syncEngine.enqueue({
        idempotencyKey,
        eventType: 'STUDENT_BOARDING',
        tripId: trip1Id,
        studentId: student1Id,
        busId: bus1Id,
        eventTimestamp: new Date().toISOString(),
        source: 'RFID',
        deviceId: 'device_offline_validator',
      });

      expect(queued.status).toBe('PENDING');

      // 2. Flush queue to backend
      const flushResult = await syncEngine.flush();
      expect(flushResult.synced).toBe(1);
      expect(flushResult.failed).toBe(0);

      // Verify storage status is SYNCED
      const items = await storage.getAll();
      expect(items[0].status).toBe('SYNCED');

      // 3. Scenario 5: Retry sending the same event with same idempotency key (simulating network replay)
      const replayResponse = await client.ingestJourneyEvent({
        idempotencyKey,
        eventType: 'STUDENT_BOARDING',
        tripId: trip1Id,
        studentId: student1Id,
        busId: bus1Id,
        eventTimestamp: queued.event.eventTimestamp!,
        source: 'RFID',
        deviceId: 'device_offline_validator',
      });

      // Must be accepted deterministically without duplicating notifications or state corruption
      expect(replayResponse.success).toBe(true);
      expect(replayResponse.eventId).toBeDefined();
    });
  });

  describe('Scenario 6 & 7 — GPS Stale (>60s) & Telemetry Recovery', () => {
    it('detects GPS_UNAVAILABLE when telemetry fix > 60s, and emits GPS_RECOVERED when fresh fix arrives', async () => {
      const client = new ApiClient({ baseUrl, getToken: () => adminAToken });
      (services.container as any).db.gpsLocations = (services.container as any).db.gpsLocations.filter(
        (location: { busId: string }) => location.busId !== bus1Id
      );

      // Scenario 6: Ingest stale GPS location (120s old)
      const staleTimestamp = new Date(Date.now() - 120 * 1000).toISOString();
      const staleIngest = await client.ingestGps({
        deviceId: gpsDeviceBus1,
        latitude: 12.9550,
        longitude: 77.6150,
        recordedAt: staleTimestamp,
      });

      expect(staleIngest.stale).toBe(true);

      // Verify GPS_UNAVAILABLE exception is open
      const exceptions = await client.getExceptions();
      const staleEx = exceptions.find((e) => e.busId === bus1Id && e.type === 'GPS_UNAVAILABLE' && e.status === 'OPEN');
      expect(staleEx).toBeDefined();

      // Verify GPS device status in health check is STALE
      const gpsDev = await services.container.deviceRepo.findGpsByExternalId(gpsDeviceBus1);
      const devHealth = await client.getGpsHealth(gpsDev!.id);
      expect(devHealth.isStale).toBe(true);
      expect(devHealth.status).toBe('STALE');

      // Scenario 7: Ingest fresh GPS location (now) to trigger recovery
      const freshTimestamp = new Date().toISOString();
      const freshIngest = await client.ingestGps({
        deviceId: gpsDeviceBus1,
        latitude: 12.9560,
        longitude: 77.6160,
        recordedAt: freshTimestamp,
      });

      expect(freshIngest.stale).toBe(false);

      // Verify open GPS_UNAVAILABLE exception is now RESOLVED
      const exceptionsAfter = await client.getExceptions();
      const resolvedEx = exceptionsAfter.find((e) => e.id === staleEx!.id);
      expect(resolvedEx?.status).toBe('RESOLVED');
      expect(resolvedEx?.resolutionReason).toContain('recovered');
    });
  });

  describe('Scenario 8 & 9 — Stop Arrival & 5-Minute Grace Period Expiry (EXIT_MISSING)', () => {
    it('marks expected exit student as EXIT_PENDING on stop arrival, and raises EXIT_MISSING after 5 minutes', async () => {
      const client = new ApiClient({ baseUrl, getToken: () => adminAToken });

      // Setup a dedicated trip to validate grace period
      const testTrip = await services.tripService.createTrip({
        schoolId: schoolAId,
        routeId: route1Id,
        busId: bus2Id,
        tripDate: new Date().toISOString().split('T')[0],
        direction: 'MORNING',
      });
      await services.tripService.startTrip(testTrip.id);

      // Assign Student 2 to this test trip with expected exit at exitStopId
      await services.container.tripRepo.createTripStudent({
        id: 'ts_test_grace_01',
        tripId: testTrip.id,
        studentId: student2Id,
        expectedBoardingStopId: boardingStopId,
        expectedExitStopId: exitStopId,
        boardingStatus: 'BOARDED', // already onboard
        exitStatus: 'PENDING',
      });

      // Scenario 8: Bus reaches stop -> BUS_REACHED_STOP emitted
      const stopArrivalTime = new Date(Date.now() - 6 * 60 * 1000).toISOString(); // 6 minutes ago
      await services.journeyService.processEvent({
        id: 'evt_bus_stop_reach',
        idempotencyKey: '00000000-0000-0000-0000-000000000001',
        schoolId: schoolAId,
        tripId: testTrip.id,
        busId: bus2Id,
        stopId: exitStopId,
        eventType: 'BUS_REACHED_STOP',
        eventTimestamp: stopArrivalTime,
        source: 'GPS',
        deviceId: gpsDeviceBus2,
        syncStatus: 'SYNCED',
        createdAt: stopArrivalTime,
      });

      // Verify student is EXIT_PENDING, NOT automatically exited
      const studentState = await services.container.journeyRepo.getStudentJourneyState(student2Id, testTrip.id);
      expect(studentState?.state).toBe('EXIT_PENDING');

      // Scenario 9: Evaluate grace period with current time (6 mins after stop reached > 5 min threshold)
      const missingExceptions = await client.checkTripGracePeriod(testTrip.id, Date.now());
      expect(missingExceptions.length).toBeGreaterThanOrEqual(1);

      const exitMissingEx = missingExceptions.find((e) => e.studentId === student2Id && e.type === 'EXIT_MISSING');
      expect(exitMissingEx).toBeDefined();
      expect(exitMissingEx?.severity).toBe('CRITICAL');
      expect(exitMissingEx?.status).toBe('OPEN');
    });
  });

  describe('Scenario 10 — Wrong Stop Exit Detection', () => {
    it('records exit and raises WRONG_STOP_EXIT exception when drop-off occurs >150m from stop', async () => {
      const client = new ApiClient({ baseUrl, getToken: () => adminAToken });

      // Create a dedicated student and trip for isolated wrong stop exit validation
      const cardWrongStop = 'CARD_TOK_WRONG_STOP_99';
      const sWrongExit = await services.studentService.createStudent({
        schoolId: schoolAId,
        admissionNumber: 'DPS-2026-999',
        firstName: 'Ananya',
        lastName: 'Rao',
        rfidCardId: cardWrongStop,
      });

      const wrongExitTrip = await services.tripService.createTrip({
        schoolId: schoolAId,
        routeId: route1Id,
        busId: bus1Id,
        tripDate: new Date().toISOString().split('T')[0],
        direction: 'MORNING',
      });
      await services.tripService.startTrip(wrongExitTrip.id);

      await services.container.tripRepo.createTripStudent({
        id: 'ts_wrong_exit_01',
        tripId: wrongExitTrip.id,
        studentId: sWrongExit.id,
        expectedBoardingStopId: boardingStopId,
        expectedExitStopId: exitStopId, // DPS School Main Gate
        boardingStatus: 'PENDING',
        exitStatus: 'PENDING',
      });

      // 1. Board student first
      await client.scanRfid({
        cardId: cardWrongStop,
        readerHardwareId: rfidReaderBus1,
        tripId: wrongExitTrip.id,
        timestamp: '2026-11-15T08:00:00.000Z',
      });

      // 2. Perform exit scan at wrong location (2.5 km away from assigned DPS school gate)
      const wrongExitLat = 12.9100;
      const wrongExitLon = 77.5800;

      const exitResult = await client.scanRfid({
        cardId: cardWrongStop,
        readerHardwareId: rfidReaderBus1,
        tripId: wrongExitTrip.id,
        latitude: wrongExitLat,
        longitude: wrongExitLon,
        timestamp: '2026-11-15T08:25:00.000Z', // 25 mins later
      });

      expect(exitResult.exception).toBe('WRONG_STOP_EXIT');

      const exceptions = await client.getExceptions();
      const wrongStopEx = exceptions.find((e) => e.studentId === sWrongExit.id && e.type === 'WRONG_STOP_EXIT');
      expect(wrongStopEx).toBeDefined();
      expect(wrongStopEx?.severity).toBe('CRITICAL');
    });
  });

  describe('Scenario 11 — Manual Attendance Override & Audit Trail', () => {
    it('executes manual attendance override with mandatory justification and creates audit entry', async () => {
      const client = new ApiClient({ baseUrl, getToken: () => adminAToken });

      const override = await client.executeManualOverride({
        studentId: student2Id,
        tripId: trip1Id,
        newStatus: 'BOARDED',
        reason: 'Student left RFID card at home; identified visually by Class Teacher',
      });

      expect(override.success).toBe(true);
      expect(override.newState).toBe('BOARDED');

      // Check audit log
      const logs = await client.getAuditLogs();
      const overrideLog = logs.find((l) => l.action === 'MANUAL_ATTENDANCE_OVERRIDE');
      expect(overrideLog).toBeDefined();
      expect(overrideLog.reason).toContain('Class Teacher');
    });
  });

  describe('Scenario 12 — Cross-Tenant Boundary Isolation', () => {
    it('strictly denies School B administrator from accessing School A fleet and trips', async () => {
      const clientA = new ApiClient({ baseUrl, getToken: () => adminAToken });
      const clientB = new ApiClient({ baseUrl, getToken: () => adminBToken });

      // School A has buses
      const busesA = await clientA.listBuses();
      expect(busesA.length).toBeGreaterThanOrEqual(2);

      // School B has no buses assigned
      const busesB = await clientB.listBuses();
      expect(busesB.length).toBe(0);

      // School B admin attempting to query School A route directly
      await expect(
        clientB.request(`/api/v1/schools/${schoolAId}`)
      ).rejects.toThrow('TENANT_ACCESS_DENIED');
    });
  });

  describe('Scenario 13 — Parent Isolation', () => {
    it('strictly denies parent access to non-authorized student journey data', async () => {
      const parentClient = new ApiClient({ baseUrl, getToken: () => parentToken });

      // Parent is authorized for Student 1 only
      const parentService = new ParentService(parentClient, 'parent_aarav_uid', [student1Id]);

      // Allowed for Student 1
      const student1Journey = await parentService.getChildJourney(student1Id);
      expect(student1Journey.student.id).toBe(student1Id);

      // Rejected for Student 2
      await expect(parentService.getChildJourney(student2Id)).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('Scenario 14 & 15 — Device Lifecycle & Replacement', () => {
    it('enforces exactly 1 active RFID per bus and decommissions old device while retaining history', async () => {
      const client = new ApiClient({ baseUrl, getToken: () => adminAToken });

      // 1. Register a replacement RFID device
      const newRfid = await services.deviceManagerService.registerRfidDevice({
        schoolId: schoolAId,
        busId: bus1Id,
        readerHardwareId: 'READER_HW_BUS_101_V2',
        protocol: 'ISO_14443_A',
      });

      // Find current active RFID device on bus 1
      const oldRfid = await services.container.deviceRepo.findRfidByReaderId(rfidReaderBus1);
      expect(oldRfid?.status).toBe('ACTIVE');

      // 2. Scenario 14: Replace RFID device
      await client.replaceRfid({
        busId: bus1Id,
        oldDeviceId: oldRfid!.id,
        newDeviceId: newRfid.id,
        reason: 'Scheduled hardware refresh to NFC-X2 reader',
      });

      // Verify old device is DECOMMISSIONED (NOT deleted)
      const oldAfter = await services.container.deviceRepo.findRfidById(oldRfid!.id);
      expect(oldAfter?.status).toBe('DECOMMISSIONED');
      expect(oldAfter?.decommissionedAt).toBeDefined();

      // Verify new device is ACTIVE
      const newAfter = await services.container.deviceRepo.findRfidById(newRfid.id);
      expect(newAfter?.status).toBe('ACTIVE');

      // Verify bus active_rfid_device_id points to new device
      const bus1After = await services.container.busRepo.findById(bus1Id);
      expect(bus1After?.activeRfidDeviceId).toBe(newRfid.id);

      // 3. Scenario 15: Replace GPS device, retaining historical telemetry
      const newGps = await services.deviceManagerService.registerGpsDevice({
        schoolId: schoolAId,
        busId: bus1Id,
        provider: 'TELTONIKA_AVL',
        externalDeviceId: 'GPS_HW_BUS_101_V2',
      });

      const oldGps = await services.container.deviceRepo.findGpsByExternalId(gpsDeviceBus1);

      await client.replaceGps({
        busId: bus1Id,
        oldDeviceId: oldGps!.id,
        newDeviceId: newGps.id,
        reason: 'Upgraded to 4G LTE telematics module',
      });

      const bus1WithNewGps = await services.container.busRepo.findById(bus1Id);
      expect(bus1WithNewGps?.activeGpsDeviceId).toBe(newGps.id);

      // Historical locations from old GPS are retained in database
      const historicalLocations = await services.container.gpsRepo.getLocationsByBus(bus1Id);
      expect(historicalLocations.length).toBeGreaterThanOrEqual(1);
    });
  });
});
