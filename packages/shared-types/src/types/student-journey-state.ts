export type JourneyState =
  | "EXPECTED"
  | "BOARDING_PENDING"
  | "BOARDED"
  | "ONBOARD"
  | "EXIT_PENDING"
  | "EXIT_RECORDED"
  | "COMPLETED";

export interface StudentJourneyState {
  id: string;

  tripId: string;
  studentId: string;
  schoolId?: string;

  state: JourneyState;

  lastEventId?: string;
  lastEventTimestamp?: string;

  boardingAt?: string;
  exitAt?: string;

  updatedAt: string;
}
