import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { createServer, createServices, AppServices } from '../apps/api/src/server';
import { ApiClient, ApiClientError } from '../packages/client-sdk/src/api-client';
import { RealtimeClient } from '../packages/client-sdk/src/realtime';
import { OfflineSyncEngine, MemoryQueueStorage } from '../packages/client-sdk/src/offline-queue';
import { AttendantService } from '../apps/mobile/src/services/attendant.service';
import { ParentService } from '../apps/mobile/src/services/parent.service';
import { CANONICAL_EXCEPTION_TYPES, THRESHOLDS } from '../packages/constants/src/index';
import { JourneyState } from '../packages/shared-types/src/index';

describe('Frontend Surfaces & Client SDK Verification (Prompt 2)', () => {
  let server: http.Server;
  let baseUrl: string;
  let services: AppServices;

  const schoolId = '22222222-2222-2222-2222-222222222222';
  const otherSchoolId = '99999999-9999-9999-9999-999999999999';
  const adminToken = `test-token:admin_01:SCHOOL_ADMIN:${schoolId}`;
  const attendantToken = `test-token:attendant_01:ATTENDANT:${schoolId}`;
  const parentUserId = 'parent_user_01';

  // Seeded IDs
  let busId: string;
  let routeId: string;
  let stopId: string;
  let tripId: string;
  let student1Id: string;
  let student2Id: string;
  const cardToken1 = 'CARD_TOK_AAAA_1111';
  const cardToken2 = 'CARD_TOK_BBBB_2222';
  const readerHardwareId = 'RFID_READER_BUS_42';

  beforeAll(async () => {
    services = createServices();

    // 1. Setup School
    await services.container.schoolRepo.create({
      id: schoolId,
      name: 'Oakridge International',
      code: 'OAK01',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Setup Fleet Bus
    const bus = await services.fleetService.createBus({
      schoolId,
      registrationNumber: 'KA-01-EQ-9999',
      fleetNumber: 'BUS-42',
      capacity: 35,
    });
    busId = bus.id;

    // 3. Assign RFID Hardware Reader
    await services.container.deviceRepo.createRfid({
      id: 'dev_rfid_01',
      schoolId,
      busId,
      readerHardwareId,
      protocol: 'ISO_14443_A',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    // 4. Setup Route & Stop
    const route = await services.routeService.createRoute({
      schoolId,
      name: 'Whitefield Morning Route',
      code: 'R-WF-01',
      direction: 'MORNING',
    });
    routeId = route.id;

    const stop = await services.routeService.createStop({
      routeId,
      name: 'Prestige Ozone Stop',
      latitude: 12.9698,
      longitude: 77.7499,
      sequence: 1,
      geofenceRadiusMeters: 50,
    });
    stopId = stop.id;

    // 5. Setup Students
    const s1 = await services.studentService.createStudent({
      schoolId,
      admissionNumber: 'ADM-2026-001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      rfidCardId: cardToken1,
    });
    student1Id = s1.id;

    const s2 = await services.studentService.createStudent({
      schoolId,
      admissionNumber: 'ADM-2026-002',
      firstName: 'Diya',
      lastName: 'Patel',
      rfidCardId: cardToken2,
    });
    student2Id = s2.id;

    // 6. Assign Student 1 to Route and Stop
    await services.studentService.assignRoute({
      studentId: student1Id,
      routeId,
      stopId,
      effectiveFrom: '2026-01-01',
    });

    // 7. Setup Trip & Manifest for Student 1
    const trip = await services.tripService.createTrip({
      schoolId,
      routeId,
      busId,
      tripDate: new Date().toISOString().split('T')[0],
      direction: 'MORNING',
    });
    tripId = trip.id;
    await services.tripService.startTrip(tripId);
    await services.container.staffRepo.create({
      id: 'staff_attendant_01',
      userId: 'attendant_01',
      schoolId,
      role: 'ATTENDANT',
      name: 'Test Attendant',
      phone: '+10000000000',
      assignedBusId: busId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    // Start HTTP Server
    server = createServer(services);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe('1. Attendant Mobile Application Workflow', () => {
    let attendantClient: ApiClient;
    let attendantStorage: MemoryQueueStorage;
    let attendantSync: OfflineSyncEngine;
    let attendantService: AttendantService;

    beforeAll(() => {
      attendantClient = new ApiClient({
        baseUrl,
        getToken: () => attendantToken,
      });
      attendantStorage = new MemoryQueueStorage();
      attendantSync = new OfflineSyncEngine(attendantStorage, attendantClient, 'mobile_attendant_device_01');
      attendantService = new AttendantService(
        attendantClient,
        attendantSync,
        'mobile_attendant_device_01',
        readerHardwareId
      );
    });

    it('loads active trip manifest and computes onboard and pending drop-off counts', async () => {
      const activeTrip = await attendantService.getActiveTrip(tripId);
      expect(activeTrip.trip.id).toBe(tripId);
      expect(activeTrip.manifest.length).toBeGreaterThanOrEqual(1);
      expect(activeTrip.onboardCount).toBe(0);
      expect(activeTrip.pendingExitsCount).toBe(0);
    });

    it('provides immediate visual feedback (SUCCESS) for assigned student RFID scan', async () => {
      const feedback = await attendantService.handleScan(cardToken1, tripId);
      expect(feedback.type).toBe('SUCCESS');
      expect(feedback.message).toBe('BOARDING RECORDED');
      expect(feedback.newState).toBe('BOARDED');
      expect(feedback.timestamp).toBeDefined();
    });

    it('provides immediate visual feedback (DUPLICATE) on subsequent scan of already boarded student', async () => {
      const feedback = await attendantService.handleScan(cardToken1, tripId);
      expect(feedback.type).toBe('DUPLICATE');
      expect(feedback.message).toContain('DUPLICATE');
    });

    it('provides immediate visual feedback (WRONG_BUS) when an unassigned student scans', async () => {
      // Student 2 is not assigned to this trip's route
      const feedback = await attendantService.handleScan(cardToken2, tripId);
      expect(feedback.type).toBe('WRONG_BUS');
      expect(feedback.message).toContain('NOT assigned to this bus');
    });

    it('buffers scan offline in local storage when server is offline and flushes upon reconnection', async () => {
      // Point client to dead port to simulate offline condition
      const offlineClient = new ApiClient({
        baseUrl: 'http://localhost:59999',
        getToken: () => attendantToken,
      });
      const offlineStorage = new MemoryQueueStorage();
      const offlineSync = new OfflineSyncEngine(offlineStorage, offlineClient, 'offline_device_99');
      const offlineAttendant = new AttendantService(
        offlineClient,
        offlineSync,
        'offline_device_99',
        readerHardwareId
      );

      // Offline scan should not throw - it falls back to local queue
      const feedback = await offlineAttendant.handleScan(cardToken1, tripId);
      expect(feedback.type).toBe('SUCCESS');
      expect(feedback.message).toContain('OFFLINE');

      // Verify item queued in local storage with PENDING status
      const queuedItems = await offlineStorage.getAll();
      expect(queuedItems.length).toBe(1);
      expect(queuedItems[0].status).toBe('PENDING');
      expect(queuedItems[0].event.tripId).toBe(tripId);

      // Attempting flush while offline transitions status to FAILED and increments retry count
      const failedFlush = await offlineSync.flush();
      expect(failedFlush.failed).toBe(1);
      expect(failedFlush.synced).toBe(0);

      const itemsAfterFailedFlush = await offlineStorage.getAll();
      expect(itemsAfterFailedFlush[0].status).toBe('FAILED');
      expect(itemsAfterFailedFlush[0].retryCount).toBe(1);
      await offlineStorage.update(itemsAfterFailedFlush[0].localId, {
        lastAttemptAt: new Date(Date.now() - 2_000).toISOString(),
      });

      // Now create an online sync engine with valid API client to simulate network recovery
      const recoveredSync = new OfflineSyncEngine(offlineStorage, attendantClient, 'offline_device_99');
      const successfulFlush = await recoveredSync.flush();
      expect(successfulFlush.synced).toBe(1);
      expect(successfulFlush.failed).toBe(0);

      const itemsAfterSync = await offlineStorage.getAll();
      expect(itemsAfterSync[0].status).toBe('SYNCED');
    });

    it('does not queue or report success for authorization failures', async () => {
      const rejectedClient = new ApiClient({ baseUrl });
      vi.spyOn(rejectedClient, 'scanRfid').mockRejectedValue(
        new ApiClientError('FORBIDDEN: Reader is not assigned', 403, 'FORBIDDEN')
      );
      const storage = new MemoryQueueStorage();
      const service = new AttendantService(
        rejectedClient,
        new OfflineSyncEngine(storage, rejectedClient, 'rejected_device'),
        'rejected_device',
        readerHardwareId
      );

      const feedback = await service.handleScan(cardToken1, tripId);
      expect(feedback.type).toBe('ERROR');
      expect(await storage.getAll()).toHaveLength(0);
    });

    it('preserves RFID identity and timestamp when transient API errors queue scans', async () => {
      const unavailableClient = new ApiClient({ baseUrl });
      vi.spyOn(unavailableClient, 'scanRfid').mockRejectedValue(
        new ApiClientError('Service unavailable', 503, 'SERVICE_UNAVAILABLE')
      );
      const storage = new MemoryQueueStorage();
      const service = new AttendantService(
        unavailableClient,
        new OfflineSyncEngine(storage, unavailableClient, 'offline_device'),
        'offline_device',
        readerHardwareId
      );

      const feedback = await service.handleScan(cardToken1, tripId);
      const [queued] = await storage.getAll();
      expect(feedback.message).toContain('OFFLINE');
      expect(queued.event.idempotencyKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(queued.event.eventTimestamp).toBe(feedback.timestamp);
      expect(queued.event.metadata).toMatchObject({
        offlineRfidScan: true,
        cardId: cardToken1,
        readerHardwareId,
      });
    });

    it('submits manual attendance override with mandatory explanation and creates audit log', async () => {
      const adminClient = new ApiClient({
        baseUrl,
        getToken: () => adminToken,
      });

      const overrideResult = await adminClient.executeManualOverride({
        studentId: student1Id,
        tripId,
        newStatus: 'EXIT_RECORDED',
        reason: 'Parent collected child in-person at school gate; verified by Principal',
      });

      expect(overrideResult.success).toBe(true);
      expect(overrideResult.newState).toBe('EXIT_RECORDED');
      expect(overrideResult.overrideEventId).toBeDefined();

      // Check audit log was created
      const logs = await adminClient.getAuditLogs();
      const overrideLog = logs.find((l) => l.action === 'MANUAL_ATTENDANCE_OVERRIDE');
      expect(overrideLog).toBeDefined();
      expect(overrideLog.reason).toContain('Parent collected child');
    });
  });

  describe('2. Admin Web Dashboard Operations', () => {
    let adminClient: ApiClient;

    beforeAll(() => {
      adminClient = new ApiClient({
        baseUrl,
        getToken: () => adminToken,
      });
    });

    it('retrieves operations dashboard overview with active metrics', async () => {
      const overview = await adminClient.getDashboardOverview();
      expect(overview.activeBuses).toBeGreaterThanOrEqual(1);
      expect(overview.totalStudents).toBeGreaterThanOrEqual(2);
      expect(overview.openExceptions).toBeGreaterThanOrEqual(0);
    });

    it('evaluates fleet GPS freshness correctly according to the 60s rule', async () => {
      const now = Date.now();
      const liveTimestamp = new Date(now - 15 * 1000).toISOString(); // 15s ago -> LIVE
      const staleTimestamp = new Date(now - 120 * 1000).toISOString(); // 120s ago -> STALE

      const evaluateStatus = (recordedAt?: string): 'LIVE' | 'STALE' | 'UNAVAILABLE' => {
        if (!recordedAt) return 'UNAVAILABLE';
        const ageSec = (Date.now() - new Date(recordedAt).getTime()) / 1000;
        return ageSec <= THRESHOLDS.GPS_FRESHNESS_SECONDS ? 'LIVE' : 'STALE';
      };

      expect(evaluateStatus(liveTimestamp)).toBe('LIVE');
      expect(evaluateStatus(staleTimestamp)).toBe('STALE');
      expect(evaluateStatus(undefined)).toBe('UNAVAILABLE');
    });

    it('manages student transport roster and assigns opaque RFID card token', async () => {
      const studentsBefore = await adminClient.getStudents();
      expect(studentsBefore.length).toBeGreaterThanOrEqual(2);

      const newCardToken = 'CARD_TOK_ASSIGNED_9999';
      const updatedStudent = await adminClient.assignStudentCard(student2Id, newCardToken);
      expect(updatedStudent.rfidCardId).toBe(newCardToken);

      // Verify audit log
      const logs = await adminClient.getAuditLogs();
      const assignLog = logs.find((l) => l.action === 'STUDENT_RFID_ASSIGNED');
      expect(assignLog).toBeDefined();
    });

    it('lists operational exceptions and resolves an exception with mandatory explanation', async () => {
      // 1. Create a synthetic exception of one of the canonical 8 types
      const ex = await services.container.exceptionRepo.create({
        id: 'ex_test_01',
        schoolId,
        tripId,
        studentId: student2Id,
        type: 'WRONG_BUS',
        severity: 'CRITICAL',
        status: 'OPEN',
        metadata: { attemptedBusId: busId },
        createdAt: new Date().toISOString(),
      });

      // 2. Query exceptions via Admin API
      const exceptions = await adminClient.getExceptions();
      const targetEx = exceptions.find((e) => e.id === ex.id);
      expect(targetEx).toBeDefined();
      expect(targetEx?.type).toBe('WRONG_BUS');

      // 3. Resolve exception
      const resolved = await adminClient.resolveException(
        ex.id,
        'Bus driver and parent notified; student guided to designated Bus 42'
      );
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolutionReason).toContain('Bus driver and parent notified');
      expect(resolved.resolvedAt).toBeDefined();
    });

    it('supports all 8 canonical exception types in domain validation', () => {
      const expectedTypes = [
        'BOARDING_MISSING',
        'WRONG_BUS',
        'WRONG_STOP_EXIT',
        'EXIT_MISSING',
        'GPS_UNAVAILABLE',
        'DUPLICATE_SCAN',
        'SYNC_FAILURE',
        'MANUAL_ATTENDANCE_OVERRIDE',
      ];
      expect(CANONICAL_EXCEPTION_TYPES).toEqual(expectedTypes);
    });

    it('enforces tenant boundary isolation between schools', async () => {
      const otherSchoolClient = new ApiClient({
        baseUrl,
        getToken: () => `test-token:admin_other:SCHOOL_ADMIN:${otherSchoolId}`,
      });

      const otherBuses = await otherSchoolClient.listBuses();
      // Other school has no buses seeded
      expect(otherBuses.length).toBe(0);
    });
  });

  describe('3. Parent Mobile Application Security & Timeline', () => {
    let parentService: ParentService;
    let unauthorizedParentService: ParentService;

    beforeAll(() => {
      const parentClient = new ApiClient({
        baseUrl,
        getToken: () => `test-token:${parentUserId}:PARENT:${schoolId}`,
      });

      // Parent is authorized for student 1 only
      parentService = new ParentService(parentClient, parentUserId, [student1Id]);
      // Another parent authorized for no students
      unauthorizedParentService = new ParentService(parentClient, 'unauthorized_parent_99', []);
    });

    it('allows access to authorized child journey timeline and evaluates GPS freshness', async () => {
      const journey = await parentService.getChildJourney(student1Id, {
        currentTripId: tripId,
        busRegistration: 'KA-01-EQ-9999',
        location: {
          latitude: 12.9698,
          longitude: 77.7499,
          speed: 24,
          recordedAt: new Date(Date.now() - 20 * 1000).toISOString(), // 20s ago (fresh)
        },
        expectedStopName: 'Prestige Ozone Stop',
        state: 'BOARDED',
      });

      expect(journey.student.id).toBe(student1Id);
      expect(journey.journeyState).toBe('BOARDED');
      expect(journey.busLocation?.isLive).toBe(true);
      expect(journey.expectedStopName).toBe('Prestige Ozone Stop');
    });

    it('flags GPS as stale when device fix exceeds 60 seconds threshold', async () => {
      const journey = await parentService.getChildJourney(student1Id, {
        currentTripId: tripId,
        location: {
          latitude: 12.9698,
          longitude: 77.7499,
          speed: 0,
          recordedAt: new Date(Date.now() - 95 * 1000).toISOString(), // 95s ago (stale)
        },
      });

      expect(journey.busLocation?.isLive).toBe(false);
    });

    it('strictly rejects access to unauthorized student with FORBIDDEN error', async () => {
      await expect(parentService.getChildJourney(student2Id)).rejects.toThrow('FORBIDDEN');
      await expect(unauthorizedParentService.getChildJourney(student1Id)).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('4. Shared Real-time Client SDK & Resilience', () => {
    it('manages subscriptions and safely dispatches events to registered handlers', () => {
      const realtime = new RealtimeClient();
      realtime.connect();

      const receivedEvents: any[] = [];
      const unsubscribe = realtime.subscribe('trip:events', (evt) => {
        receivedEvents.push(evt);
      });

      const eventPayload = { eventId: 'evt_rt_01', type: 'BOARDING', studentId: student1Id };
      const emitted = realtime.emitEvent('trip:events', eventPayload);

      expect(emitted).toBe(true);
      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].eventId).toBe('evt_rt_01');

      unsubscribe();
    });

    it('deduplicates retransmitted events to prevent duplicate processing', () => {
      const realtime = new RealtimeClient();
      const eventsProcessed: string[] = [];

      realtime.subscribe('safety:alerts', (evt: any) => {
        eventsProcessed.push(evt.id);
      });

      const alertPayload = { id: 'alert_uniq_999', type: 'WRONG_BUS' };

      const firstEmit = realtime.emitEvent('safety:alerts', alertPayload);
      const duplicateEmit = realtime.emitEvent('safety:alerts', alertPayload);

      expect(firstEmit).toBe(true);
      expect(duplicateEmit).toBe(false); // Deduplicated!
      expect(eventsProcessed.length).toBe(1);
    });

    it('supports reconnection state transitions safely', async () => {
      const realtime = new RealtimeClient();
      realtime.connect();

      let reconnected = false;
      realtime.simulateDisconnectAndReconnect(() => {
        reconnected = true;
      });

      expect(realtime.getStatus()).toBe('RECONNECTING');

      await new Promise((r) => setTimeout(r, 80));

      expect(realtime.getStatus()).toBe('CONNECTED');
      expect(reconnected).toBe(true);
    });
  });
});
