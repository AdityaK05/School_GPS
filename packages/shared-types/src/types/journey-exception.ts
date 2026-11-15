export type ExceptionType =
  | "BOARDING_MISSING"
  | "WRONG_BUS"
  | "WRONG_STOP_EXIT"
  | "EXIT_MISSING"
  | "GPS_UNAVAILABLE"
  | "DUPLICATE_SCAN"
  | "SYNC_FAILURE"
  | "MANUAL_ATTENDANCE_OVERRIDE";

export interface JourneyException {
  id: string;

  schoolId: string;
  tripId?: string;

  studentId?: string;
  busId?: string;

  type: ExceptionType;

  severity:
    | "INFO"
    | "WARNING"
    | "CRITICAL";

  status:
    | "OPEN"
    | "ACKNOWLEDGED"
    | "RESOLVED"
    | "DISMISSED";

  description?: string;
  metadata?: Record<string, unknown>;

  createdAt: string;
  resolvedAt?: string;

  resolvedBy?: string;
  resolutionReason?: string;
}
