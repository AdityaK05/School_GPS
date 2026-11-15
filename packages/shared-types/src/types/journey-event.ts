import { JourneyState } from './student-journey-state';

export interface JourneyEvent {
  id: string;

  schoolId: string;

  tripId: string;
  studentId?: string;
  busId?: string;
  stopId?: string;

  eventType: JourneyEventType;

  eventTimestamp: string;
  serverReceivedAt?: string;
  createdAt?: string;

  latitude?: number;
  longitude?: number;

  source:
    | "RFID"
    | "GPS"
    | "ATTENDANT"
    | "ADMIN"
    | "SYSTEM";

  deviceId?: string;

  idempotencyKey: string;

  syncStatus?: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

  metadata?: Record<string, unknown>;
}

export type JourneyEventType =
  | "TRIP_STARTED"
  | "TRIP_COMPLETED"
  | "STUDENT_BOARDING"
  | "STUDENT_EXIT"
  | "BUS_LOCATION_UPDATE"
  | "BUS_REACHED_STOP"
  | "GPS_OFFLINE"
  | "GPS_RECOVERED"
  | "DUPLICATE_RFID_SCAN"
  | "MANUAL_ATTENDANCE_OVERRIDE";

export interface JourneyEventResult {
  success: boolean;
  eventId: string;
  journeyState: JourneyState;
  exception: string | null;
}
