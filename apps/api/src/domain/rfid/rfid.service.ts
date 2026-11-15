import {
  JourneyEvent,
  JourneyEventResult,
  JourneyEventType,
  JourneyException,
} from '@school-transport-platform/shared-types';
import { THRESHOLDS } from '@school-transport-platform/constants';
import { generateUuidV7 } from '@school-transport-platform/utils';
import {
  IStudentRepository,
  IDeviceRepository,
  ITripRepository,
  IExceptionRepository,
  IBusRepository,
} from '../../repositories/interfaces';
import { JourneyService } from '../journey/journey.service';
import crypto from 'crypto';

export class RFIDService {
  // Recent scan cache for duplicate detection: cardId:busId -> timestampMs
  private recentScans = new Map<string, number>();

  constructor(
    private studentRepo: IStudentRepository,
    private deviceRepo: IDeviceRepository,
    private tripRepo: ITripRepository,
    private busRepo: IBusRepository,
    private exceptionRepo: IExceptionRepository,
    private journeyService: JourneyService
  ) {}

  public async processScan(params: {
    cardId: string;
    readerHardwareId: string;
    tripId?: string;
    timestamp?: string;
    idempotencyKey?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<JourneyEventResult> {
    const scanTimestamp = params.timestamp || new Date().toISOString();
    const scanTimeMs = new Date(scanTimestamp).getTime();

    // 1. Identify RFID Reader & Associated Bus
    const rfidDevice = await this.deviceRepo.findRfidByReaderId(params.readerHardwareId);
    if (!rfidDevice) {
      throw new Error(`Unregistered RFID device hardware ID: ${params.readerHardwareId}`);
    }

    const busId = rfidDevice.busId;
    const bus = await this.busRepo.findById(busId);
    if (!bus) {
      throw new Error(`Bus ${busId} associated with RFID reader not found`);
    }

    // 2. Identify Student via Card ID (Opaque Token - ADR-9)
    const student = await this.studentRepo.findByRfidCard(params.cardId);
    if (!student) {
      // Record exception for unassigned card tap
      const exception: JourneyException = {
        id: crypto.randomUUID(),
        schoolId: bus.schoolId,
        busId,
        type: 'WRONG_BUS',
        severity: 'WARNING',
        status: 'OPEN',
        description: `Card ${params.cardId} not assigned to any student`,
        metadata: { message: `Card ${params.cardId} not assigned to any student` },
        createdAt: new Date().toISOString(),
      };
      await this.exceptionRepo.create(exception);
      throw new Error(`Card ${params.cardId} is not registered to any student`);
    }

    // 3. Duplicate Scan Detection (30-second window)
    const scanCacheKey = `${params.cardId}:${busId}`;
    const lastScanMs = this.recentScans.get(scanCacheKey);
    if (
      lastScanMs &&
      scanTimeMs >= lastScanMs &&
      scanTimeMs - lastScanMs < THRESHOLDS.DUPLICATE_SCAN_WINDOW_SECONDS * 1000
    ) {
      // Log DUPLICATE_RFID_SCAN event
      const dupEvent: JourneyEvent = {
        id: crypto.randomUUID(),
        idempotencyKey: params.idempotencyKey || generateUuidV7(),
        schoolId: bus.schoolId,
        tripId: params.tripId || '00000000-0000-0000-0000-000000000000',
        studentId: student.id,
        busId,
        eventType: 'DUPLICATE_RFID_SCAN',
        eventTimestamp: scanTimestamp,
        latitude: params.latitude,
        longitude: params.longitude,
        source: 'RFID',
        deviceId: rfidDevice.id,
        syncStatus: 'SYNCED',
        createdAt: new Date().toISOString(),
      };
      return await this.journeyService.processEvent(dupEvent);
    }
    this.recentScans.set(scanCacheKey, scanTimeMs);

    // 4. Resolve Active Trip
    let targetTripId = params.tripId;
    if (!targetTripId) {
      const activeTrip = await this.tripRepo.findActiveTripByBus(busId);
      if (!activeTrip) {
        throw new Error(`No active trip running on bus ${busId} for RFID scan`);
      }
      targetTripId = activeTrip.id;
    }

    // 5. Determine whether this scan is BOARDING or EXIT
    const currentJourneyState = await this.journeyService['journeyRepo'].getStudentJourneyState(
      student.id,
      targetTripId
    );

    let eventType: JourneyEventType = 'STUDENT_BOARDING';
    if (
      currentJourneyState &&
      (currentJourneyState.state === 'BOARDED' ||
        currentJourneyState.state === 'ONBOARD' ||
        currentJourneyState.state === 'EXIT_PENDING')
    ) {
      eventType = 'STUDENT_EXIT';
    }

    // 6. Construct JourneyEvent with UUID v7 Idempotency Key (ADR-6)
    const journeyEvent: JourneyEvent = {
      id: crypto.randomUUID(),
      idempotencyKey: params.idempotencyKey || generateUuidV7(scanTimeMs),
      schoolId: bus.schoolId,
      tripId: targetTripId,
      studentId: student.id,
      busId,
      eventType,
      eventTimestamp: scanTimestamp,
      latitude: params.latitude,
      longitude: params.longitude,
      source: 'RFID',
      deviceId: rfidDevice.id,
      syncStatus: 'SYNCED',
      createdAt: new Date().toISOString(),
    };

    return await this.journeyService.processEvent(journeyEvent);
  }
}
