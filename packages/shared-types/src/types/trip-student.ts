export interface TripStudent {
  id: string;

  tripId: string;
  studentId: string;

  expectedBoardingStopId: string;
  expectedExitStopId: string;

  boardingStatus:
    | "PENDING"
    | "BOARDED"
    | "MISSED";

  exitStatus:
    | "PENDING"
    | "EXITED"
    | "MISSING";

  actualBoardingTimestamp?: string;
  actualExitTimestamp?: string;
  stopReachedTimestamp?: string;
}
