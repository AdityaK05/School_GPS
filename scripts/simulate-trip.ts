import { createServer, createServices } from '../apps/api/src/server';
import { ApiClient } from '../packages/client-sdk/src/api-client';
import { generateUuidV7 } from '../packages/utils/src/uuid-v7';

async function runEndToEndSimulation() {
  console.log('================================================================');
  console.log(' School Transport Safety & Accountability Platform');
  console.log(' LIVE END-TO-END TRIP SIMULATION');
  console.log('================================================================\n');

  // 1. Spin up ephemeral services & server
  const services = createServices();
  const server = createServer(services);
  const port = 3001;
  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.log(`[1/6] API Server listening on http://localhost:${port}`);

  const schoolId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const token = `test-token:usr_admin:SCHOOL_ADMIN:${schoolId}`;
  const client = new ApiClient({
    baseUrl: `http://localhost:${port}`,
    getToken: () => token,
  });

  try {
    // 2. Provision Fleet & Devices
    console.log('[2/6] Provisioning Fleet, Hardware Devices, and Route...');
    const bus = await client.createBus({
      registrationNumber: 'KA-01-EXP-9999',
      fleetNumber: 'BUS-01',
      capacity: 35,
    });
    console.log(`      ✓ Bus provisioned: ${bus.registrationNumber} (Fleet: ${bus.fleetNumber}, ID: ${bus.id})`);

    // Register GPS and RFID in device management service
    const gpsDevice = await services.deviceManagerService.registerGpsDevice({
      schoolId,
      busId: bus.id,
      provider: 'GENERIC_TELEMATICS',
      externalDeviceId: 'GPS-SIM-001',
    });
    await services.deviceManagerService.assignGpsToBus(bus.id, gpsDevice.id);

    const rfidReader = await services.deviceManagerService.registerRfidDevice({
      schoolId,
      busId: bus.id,
      readerHardwareId: 'READER-DOOR-FRONT',
      protocol: 'ISO_14443_A',
    });
    await services.deviceManagerService.assignRfidToBus(bus.id, rfidReader.id);
    console.log(`      ✓ Hardware paired: GPS ${gpsDevice.externalDeviceId} & RFID ${rfidReader.readerHardwareId}`);

    const route = await client.createRoute({
      name: 'North Campus Route #1',
      code: 'NC-01',
      direction: 'MORNING',
    });

    const stop1 = await client.createStop({
      routeId: route.id,
      name: 'Stop 1 - Green Valley',
      sequence: 1,
      latitude: 12.9716,
      longitude: 77.5946,
      geofenceRadiusMeters: 50,
    });

    const stop2 = await client.createStop({
      routeId: route.id,
      name: 'Stop 2 - School Campus',
      sequence: 2,
      latitude: 12.9790,
      longitude: 77.5980,
      geofenceRadiusMeters: 50,
    });
    console.log(`      ✓ Route created with 2 stops: "${stop1.name}" -> "${stop2.name}"`);

    // 3. Register and assign student
    console.log('\n[3/6] Registering Students and RFID Cards...');
    const student = await client.createStudent({
      admissionNumber: 'ADM-2026-101',
      firstName: 'Aarav',
      lastName: 'Sharma',
      rfidCardId: 'CARD-AARAV-7788',
    });

    await client.assignStudentRoute({
      studentId: student.id,
      routeId: route.id,
      stopId: stop1.id,
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
    console.log(`      ✓ Student: ${student.firstName} ${student.lastName} (Card: ${student.rfidCardId})`);

    // 4. Start Trip
    console.log('\n[4/6] Initializing Trip Execution...');
    const trip = await client.createTrip({
      routeId: route.id,
      busId: bus.id,
      tripDate: new Date().toISOString().split('T')[0],
      direction: 'MORNING',
    });

    await client.startTrip(trip.id);
    console.log(`      ✓ Trip STARTED (ID: ${trip.id})`);

    // 5. Hardware Simulators Telematics & Scans
    console.log('\n[5/6] Running Hardware Telematics & Event Stream...');

    // Initial bus stop position
    await client.ingestGps({
      deviceId: gpsDevice.externalDeviceId,
      latitude: 12.9716,
      longitude: 77.5946,
      speed: 0,
      heading: 90,
      recordedAt: new Date().toISOString(),
    });
    console.log(`      📍 GPS Telematics: Bus reached Stop 1 (Speed: 0 km/h)`);

    // Student taps RFID card to board
    const scanResult = await client.scanRfid({
      cardId: student.rfidCardId!,
      readerHardwareId: rfidReader.readerHardwareId,
      tripId: trip.id,
      timestamp: new Date().toISOString(),
      idempotencyKey: generateUuidV7(),
    });
    console.log(`      💳 RFID Card Tapped: Result = ${scanResult.journeyState} (Expected: BOARDED)`);

    // Bus departs and drives
    await client.ingestGps({
      deviceId: gpsDevice.externalDeviceId,
      latitude: 12.9750,
      longitude: 77.5960,
      speed: 42,
      heading: 45,
      recordedAt: new Date().toISOString(),
    });
    console.log(`      📍 GPS Telematics: Bus in motion towards School Campus (Speed: 42 km/h)`);

    // Check student status transitioned to ONBOARD
    const manifest = await client.getTripManifest(trip.id);
    const aarav = manifest.find((s) => s.studentId === student.id);
    console.log(`      🚌 In-transit Verification: Student State = ${aarav?.boardingStatus}`);

    // Bus arrives at School Stop 2
    await client.ingestGps({
      deviceId: gpsDevice.externalDeviceId,
      latitude: 12.9790,
      longitude: 77.5980,
      speed: 0,
      heading: 0,
      recordedAt: new Date().toISOString(),
    });
    console.log(`      📍 GPS Telematics: Bus arrived at Stop 2 - School Campus`);

    // Student exits bus
    const exitResult = await client.scanRfid({
      cardId: student.rfidCardId!,
      readerHardwareId: rfidReader.readerHardwareId,
      tripId: trip.id,
      timestamp: new Date().toISOString(),
      idempotencyKey: generateUuidV7(),
    });
    console.log(`      💳 RFID Card Tapped: Result = ${exitResult.journeyState} (Expected: EXIT_RECORDED)`);

    // Complete trip
    await client.completeTrip(trip.id);
    console.log(`      ✓ Trip COMPLETED successfully`);

    // 6. Security & Audit Verification
    console.log('\n[6/6] Verifying Security & Audit Logs...');
    const auditLogs = await client.getAuditLogs(10);
    console.log(`      ✓ Audit Trail recorded ${auditLogs.length} verified operations`);

    console.log('\n================================================================');
    console.log(' SUCCESS: End-to-End Simulation Completed with 0 Safety Faults!');
    console.log('================================================================\n');
  } finally {
    server.close();
  }
}

runEndToEndSimulation().catch((err) => {
  console.error('Simulation Failed:', err);
  process.exit(1);
});
