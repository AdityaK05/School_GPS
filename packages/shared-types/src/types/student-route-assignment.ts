export interface StudentRouteAssignment {
  id: string;

  studentId: string;
  routeId: string;
  stopId: string;

  effectiveFrom: string;
  effectiveUntil?: string;

  status: "ACTIVE" | "INACTIVE";
}