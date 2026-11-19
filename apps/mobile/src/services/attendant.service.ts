import {
  Trip,
  TripStudent,
  JourneyEventResult,
  JourneyState,
} from '@school-transport-platform/shared-types';
import { ApiClient } from '@school-transport-platform/client-sdk';
import { OfflineSyncEngine } from '@school-transport-platform/client-sdk';
import { generateUuidV7 } from '@school-transport-platform/utils';

export type ScanVisualFeedback = 'SUCCESS' | 'DUPLICATE' | 'WRONG_BUS' | 'ERROR';

export interface ScanFeedback {
  type: ScanVisualFeedback;
  studentName?: string;
  message: string;
  newState?: JourneyState;
  timestamp: string;
}

export class AttendantService {
  constructor(
    private apiClient: ApiClient,
    private syncEngine: OfflineSyncEngine,
    private deviceId: string,
    private hardwareReaderId: string
  ) {}

  public async getActiveTrip(tripId: string): Promise<{
    trip: Trip;
    manifest: TripStudent[];
    onboardCount: number;
    pendingExitsCount: number;
  }> {
    const manifest = await this.apiClient.getTripManifest(tripId);
    const onboardCount = manifest.filter((s) => s.boardingStatus === 'BOARDED' && s.exitStatus !== 'EXITED').length;
    const pendingExitsCount = manifest.filter((s) => s.boardingStatus === 'BOARDED' && s.exitStatus === 'PENDING').length;

    return {
      trip: {
        id: tripId,
        schoolId: '',
        routeId: '',
        busId: '',
        tripDate: new Date().toISOString().split('T')[0],
        direction: 'MORNING',
        status: 'IN_PROGRESS',
      },
      manifest,
      onboardCount,
      pendingExitsCount,
    };
  }

  /**
   * Processes an RFID scan inside a moving school bus with immediate UI feedback.
   */
  public async handleScan(
    cardId: string,
    tripId: string,
    offlineEventType: 'STUDENT_BOARDING' | 'STUDENT_EXIT' = 'STUDENT_BOARDING'
  ): Promise<ScanFeedback> {
    const timestamp = new Date().toISOString();
    const idempotencyKey = generateUuidV7();

    try {
      // 1. Attempt online processing through backend
      const result: JourneyEventResult = await this.apiClient.scanRfid({
        cardId,
        readerHardwareId: this.hardwareReaderId,
        tripId,
        timestamp,
        idempotencyKey,
      });

      if (result.exception === 'WRONG_BUS') {
        return {
          type: 'WRONG_BUS',
          message: 'ALERT: Student is NOT assigned to this bus or trip!',
          timestamp,
        };
      }

      if (result.exception === 'DUPLICATE_SCAN') {
        return {
          type: 'DUPLICATE',
          message: 'CARD ALREADY SCANNED (DUPLICATE)',
          newState: result.journeyState,
          timestamp,
        };
      }

      if (result.journeyState === 'BOARDED') {
        return {
          type: 'SUCCESS',
          message: 'BOARDING RECORDED',
          newState: 'BOARDED',
          timestamp,
        };
      }

      if (result.journeyState === 'EXIT_RECORDED') {
        return {
          type: 'SUCCESS',
          message: 'EXIT SAFELY RECORDED',
          newState: 'EXIT_RECORDED',
          timestamp,
        };
      }

      return {
        type: 'DUPLICATE',
        message: 'CARD ALREADY SCANNED (DUPLICATE)',
        newState: result.journeyState,
        timestamp,
      };
    } catch (err: any) {
      // 2. Offline fallback: buffer event locally in SQLite/SyncEngine
      await this.syncEngine.enqueue({
        idempotencyKey,
        eventType: offlineEventType,
        tripId,
        eventTimestamp: timestamp,
        source: 'RFID',
        deviceId: this.deviceId,
      });

      return {
        type: 'SUCCESS',
        message: 'SCAN QUEUED OFFLINE (WILL SYNC WHEN CONNECTED)',
        timestamp,
      };
    }
  }

  /**
   * Manual Attendance Action with mandatory reason.
   */
  public async manualOverride(params: {
    studentId: string;
    tripId: string;
    newStatus: 'BOARDED' | 'EXIT_RECORDED' | 'COMPLETED';
    reason: string;
    stopId?: string;
  }): Promise<{ success: boolean; newState: string }> {
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error('Mandatory reason required (minimum 5 characters)');
    }
    const result = await this.apiClient.executeManualOverride(params);
    return { success: result.success, newState: result.newState };
  }

  /**
   * Trigger emergency action (LLD emergency workflow).
   */
  public async triggerEmergency(tripId: string, reason: string): Promise<void> {
    await this.apiClient.ingestJourneyEvent({
      idempotencyKey: generateUuidV7(),
      tripId,
      eventType: 'MANUAL_ATTENDANCE_OVERRIDE',
      eventTimestamp: new Date().toISOString(),
      source: 'ATTENDANT',
      deviceId: this.deviceId,
      metadata: { emergency: true, reason },
    });
  }
}
