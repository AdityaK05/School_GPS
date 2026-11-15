import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServices, createServer } from '../apps/api/src/server';
import { MemoryContainer } from '../apps/api/src/repositories/memory.repository';
import { ApiClient } from '../packages/client-sdk/src/api-client';
import http from 'http';

describe('Parent / Guardian Experience & Scoped Safety API', () => {
  let server: http.Server;
  let baseUrl: string;
  let container: MemoryContainer;

  const schoolA = 'sch_parent_test_001';
  const schoolB = 'sch_parent_test_002';

  const guardianUserA = 'usr_guardian_a';
  const guardianUserB = 'usr_guardian_b';

  const studentA1 = 'std_child_a1';
  const studentA2 = 'std_child_a2';
  const studentB1 = 'std_child_b1';

  beforeEach(async () => {
    container = new MemoryContainer();
    const services = createServices({ container });
    server = createServer(services);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    // Seed School A & Students
    await container.schoolRepo.create({
      id: schoolA,
      name: 'St. Mary High',
      code: 'SMH-01',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await container.schoolRepo.create({
      id: schoolB,
      name: 'Oakridge School',
      code: 'ORS-02',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Students for Guardian A in School A
    await container.studentRepo.create({
      id: studentA1,
      schoolId: schoolA,
      admissionNumber: 'ADM-A1',
      firstName: 'Aarav',
      lastName: 'Sharma',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await container.studentRepo.create({
      id: studentA2,
      schoolId: schoolA,
      admissionNumber: 'ADM-A2',
      firstName: 'Diya',
      lastName: 'Sharma',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Student in School B for Guardian B
    await container.studentRepo.create({
      id: studentB1,
      schoolId: schoolB,
      admissionNumber: 'ADM-B1',
      firstName: 'Rohan',
      lastName: 'Verma',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Bind Guardians
    const db = (container.studentRepo as any).db;
    db.guardians.set('g_1', {
      id: 'g_1',
      userId: guardianUserA,
      studentId: studentA1,
      relationship: 'FATHER',
      notificationEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    db.guardians.set('g_2', {
      id: 'g_2',
      userId: guardianUserA,
      studentId: studentA2,
      relationship: 'FATHER',
      notificationEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    db.guardians.set('g_3', {
      id: 'g_3',
      userId: guardianUserB,
      studentId: studentB1,
      relationship: 'MOTHER',
      notificationEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed Route & Bus for studentA1
    const busA = await container.busRepo.create({
      id: 'bus_a',
      schoolId: schoolA,
      registrationNumber: 'KA-01-EXP-1212',
      fleetNumber: 'BUS-12',
      capacity: 40,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const routeA = await container.routeRepo.createRoute({
      id: 'route_a',
      schoolId: schoolA,
      name: 'Sector 62 Express',
      code: 'R-62',
      direction: 'MORNING',
      status: 'ACTIVE',
    });

    const stopA = await container.routeRepo.createStop({
      id: 'stop_a',
      routeId: routeA.id,
      name: 'Sector 62 Metro Gate #2',
      latitude: 12.9716,
      longitude: 77.5946,
      sequence: 1,
      geofenceRadiusMeters: 100,
    });

    await container.studentRepo.createAssignment({
      id: 'asg_1',
      studentId: studentA1,
      routeId: routeA.id,
      stopId: stopA.id,
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
    });

    // Seed Active Trip
    const trip = await container.tripRepo.create({
      id: 'trip_a',
      schoolId: schoolA,
      routeId: routeA.id,
      busId: busA.id,
      tripDate: new Date().toISOString().split('T')[0],
      direction: 'MORNING',
      status: 'IN_PROGRESS',
    });

    // Seed Fresh GPS Location
    await container.gpsRepo.createLocation({
      id: 'loc_fresh',
      schoolId: schoolA,
      busId: busA.id,
      latitude: 12.972,
      longitude: 77.595,
      location: { type: 'Point', coordinates: [77.595, 12.972] },
      speed: 35,
      recordedAt: new Date().toISOString(), // fresh <= 60s
      receivedAt: new Date().toISOString(),
    });

    // Seed Notifications for Guardian A
    await container.notificationRepo.create({
      id: 'notif_1',
      userId: guardianUserA,
      schoolId: schoolA,
      type: 'BOARDING',
      title: 'Aarav has boarded Bus 12',
      body: 'Verified via RFID scan at Sector 62 Metro Gate #2.',
      createdAt: new Date().toISOString(),
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('allows authenticated parent to query and switch between their multiple children', async () => {
    const client = new ApiClient({
      baseUrl,
      getToken: () => `test-token:${guardianUserA}:PARENT:${schoolA}`,
    });

    const children = await client.getParentChildren();
    expect(children).toBeDefined();
    expect(children.length).toBe(2);

    const names = children.map((c) => c.student.firstName);
    expect(names).toContain('Aarav');
    expect(names).toContain('Diya');

    // Aarav has an active route, bus and fresh GPS location
    const aarav = children.find((c) => c.student.firstName === 'Aarav')!;
    expect(aarav.bus).toBeDefined();
    expect(aarav.bus.registrationNumber).toBe('KA-01-EXP-1212');
    expect(aarav.busLocation).toBeDefined();
    expect(aarav.busLocation.isLive).toBe(true);
    expect(aarav.safetyStatus).toBe('VERIFIED');
  });

  it('evaluates stale GPS as WARNING when telemetry lags past 60 seconds', async () => {
    // Replace locations with stale location (>60s old)
    (container as any).db.gpsLocations = [
      {
        id: 'loc_stale',
        schoolId: schoolA,
        busId: 'bus_a',
        latitude: 12.972,
        longitude: 77.595,
        location: { type: 'Point', coordinates: [77.595, 12.972] },
        speed: 0,
        recordedAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
        receivedAt: new Date().toISOString(),
      },
    ];

    const client = new ApiClient({
      baseUrl,
      getToken: () => `test-token:${guardianUserA}:PARENT:${schoolA}`,
    });

    const journey = await client.getChildJourneyDetails(studentA1);
    expect(journey.busLocation).toBeDefined();
    expect(journey.busLocation.isLive).toBe(false);
    expect(journey.safetyStatus).toBe('WARNING');
  });

  it('escalates to EXCEPTION status when an active safety exception is open for the child', async () => {
    await container.exceptionRepo.create({
      id: 'exc_wrong_bus_1',
      schoolId: schoolA,
      tripId: 'trip_a',
      studentId: studentA1,
      type: 'WRONG_BUS',
      severity: 'CRITICAL',
      status: 'OPEN',
      description: 'Student attempted to board Bus 08 instead of assigned Bus 12.',
      createdAt: new Date().toISOString(),
    });

    const client = new ApiClient({
      baseUrl,
      getToken: () => `test-token:${guardianUserA}:PARENT:${schoolA}`,
    });

    const journey = await client.getChildJourneyDetails(studentA1);
    expect(journey.safetyStatus).toBe('EXCEPTION');
    expect(journey.activeExceptions.length).toBe(1);
    expect(journey.activeExceptions[0].type).toBe('WRONG_BUS');
  });

  it('strictly denies Parent A from accessing Child B belonging to School B (cross-tenant isolation)', async () => {
    const client = new ApiClient({
      baseUrl,
      getToken: () => `test-token:${guardianUserA}:PARENT:${schoolA}`,
    });

    await expect(client.getChildJourneyDetails(studentB1)).rejects.toThrow(/FORBIDDEN/);
  });

  it('allows parent to retrieve notifications and mark them as read', async () => {
    const client = new ApiClient({
      baseUrl,
      getToken: () => `test-token:${guardianUserA}:PARENT:${schoolA}`,
    });

    const notifs = await client.getParentNotifications();
    expect(notifs.length).toBe(1);
    expect(notifs[0].title).toBe('Aarav has boarded Bus 12');
    expect(notifs[0].readAt).toBeUndefined();

    const read = await client.markNotificationRead(notifs[0].id);
    expect(read.readAt).toBeDefined();
  });
});
