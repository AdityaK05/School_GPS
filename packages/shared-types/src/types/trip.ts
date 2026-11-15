export interface Trip {
  id: string;

  schoolId: string;

  routeId: string;
  busId: string;

  driverId?: string;
  attendantId?: string;

  tripDate: string;

  direction: "MORNING" | "EVENING";

  status:
    | "SCHEDULED"
    | "STARTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

  startedAt?: string;
  completedAt?: string;
}