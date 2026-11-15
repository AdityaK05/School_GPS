import {
  ExceptionType,
  TripStudent,
  Stop,
  GPSLocation,
  JourneyException,
} from '@school-transport-platform/shared-types';
import { THRESHOLDS } from '@school-transport-platform/constants';
import { calculateHaversineDistanceMeters } from '@school-transport-platform/utils';
import crypto from 'crypto';

export class ExceptionEngine {
  /**
   * Checks if an RFID scan attempted boarding on a bus/trip not assigned to this student.
   */
  public static evaluateWrongBus(
    tripStudent: TripStudent | null,
    studentId: string,
    tripId: string,
    schoolId: string
  ): JourneyException | null {
    if (!tripStudent) {
      return {
        id: crypto.randomUUID(),
        schoolId,
        tripId,
        studentId,
        type: 'WRONG_BUS',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: `Student ${studentId} scanned on unassigned trip ${tripId}`,
        metadata: { message: `Student ${studentId} scanned on unassigned trip ${tripId}` },
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }

  /**
   * Evaluates student exit location against assigned exit stop.
   * If actual drop-off location exceeds tolerance (150m), triggers WRONG_STOP_EXIT.
   */
  public static evaluateExitLocation(
    expectedStop: Stop | null,
    actualLat: number | undefined,
    actualLon: number | undefined,
    studentId: string,
    tripId: string,
    schoolId: string
  ): JourneyException | null {
    if (!expectedStop || actualLat === undefined || actualLon === undefined) {
      return null;
    }

    const distance = calculateHaversineDistanceMeters(
      actualLat,
      actualLon,
      expectedStop.latitude,
      expectedStop.longitude
    );

    if (distance > THRESHOLDS.MAX_STOP_EXIT_TOLERANCE_METERS) {
      return {
        id: crypto.randomUUID(),
        schoolId,
        tripId,
        studentId,
        type: 'WRONG_STOP_EXIT',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: `Student exited ${Math.round(distance)}m away from assigned stop ${expectedStop.name}`,
        metadata: {
          expectedStopId: expectedStop.id,
          expectedStopName: expectedStop.name,
          distanceMeters: Math.round(distance),
          toleranceMeters: THRESHOLDS.MAX_STOP_EXIT_TOLERANCE_METERS,
        },
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Evaluates whether an exit is missing after the 5-minute grace period has expired (ADR-7).
   */
  public static evaluateMissingExit(
    stopReachedAt: string,
    studentStillOnboard: boolean,
    currentTimeMs: number = Date.now(),
    studentId: string,
    tripId: string,
    schoolId: string,
    stopId: string
  ): JourneyException | null {
    if (!studentStillOnboard) return null;

    const stopReachedTime = new Date(stopReachedAt).getTime();
    const elapsedMinutes = (currentTimeMs - stopReachedTime) / (1000 * 60);

    if (elapsedMinutes >= THRESHOLDS.EXIT_MISSING_GRACE_PERIOD_MINUTES) {
      return {
        id: crypto.randomUUID(),
        schoolId,
        tripId,
        studentId,
        type: 'EXIT_MISSING',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: `Student did not exit after ${Math.round(elapsedMinutes)} minutes at stop ${stopId}`,
        metadata: {
          stopId,
          gracePeriodMinutes: THRESHOLDS.EXIT_MISSING_GRACE_PERIOD_MINUTES,
          elapsedMinutes: Math.round(elapsedMinutes),
        },
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Evaluates GPS telemetry freshness (ADR-8). Stale if receivedAt - recordedAt > 60 seconds.
   */
  public static evaluateGpsFreshness(
    latestLocation: GPSLocation | null,
    currentTimeMs: number = Date.now(),
    schoolId: string,
    busId: string,
    tripId?: string
  ): JourneyException | null {
    if (!latestLocation) {
      return {
        id: crypto.randomUUID(),
        schoolId,
        tripId: tripId || '',
        busId,
        type: 'GPS_UNAVAILABLE',
        severity: 'WARNING',
        status: 'OPEN',
        description: 'No GPS telemetry received for bus',
        metadata: { reason: 'No GPS telemetry received for bus' },
        createdAt: new Date().toISOString(),
      };
    }

    const recordedTime = new Date(latestLocation.recordedAt).getTime();
    const staleSeconds = (currentTimeMs - recordedTime) / 1000;

    if (staleSeconds > THRESHOLDS.GPS_FRESHNESS_SECONDS) {
      return {
        id: crypto.randomUUID(),
        schoolId,
        tripId: tripId || '',
        busId,
        type: 'GPS_UNAVAILABLE',
        severity: 'WARNING',
        status: 'OPEN',
        description: `GPS telemetry is stale by ${Math.round(staleSeconds)} seconds (threshold: ${THRESHOLDS.GPS_FRESHNESS_SECONDS}s)`,
        metadata: {
          staleSeconds: Math.round(staleSeconds),
          thresholdSeconds: THRESHOLDS.GPS_FRESHNESS_SECONDS,
          lastSeenAt: latestLocation.recordedAt,
        },
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  }
}
