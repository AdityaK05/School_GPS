import {
  Student,
  JourneyState,
  GPSLocation,
  Notification,
} from '@school-transport-platform/shared-types';
import { THRESHOLDS } from '@school-transport-platform/constants';
import { ApiClient } from '@school-transport-platform/client-sdk';

export interface ChildJourneyOverview {
  student: Student;
  currentTripId?: string;
  busRegistration?: string;
  journeyState: JourneyState;
  busLocation?: {
    latitude: number;
    longitude: number;
    speed?: number;
    recordedAt: string;
    isLive: boolean; // true if freshness <= 60s
  };
  expectedStopName?: string;
}

export class ParentService {
  constructor(
    private apiClient: ApiClient,
    private parentUserId: string,
    private authorizedStudentIds: string[]
  ) {}

  public isAuthorizedForStudent(studentId: string): boolean {
    return this.authorizedStudentIds.includes(studentId);
  }

  public async getChildren(): Promise<Student[]> {
    // In production, queries backend endpoint filtering by parentUserId
    const children: Student[] = [];
    return children;
  }

  public async getChildJourney(
    studentId: string,
    liveContext?: {
      student?: Student;
      currentTripId?: string;
      busRegistration?: string;
      location?: { latitude: number; longitude: number; speed?: number; recordedAt: string };
      expectedStopName?: string;
      state?: JourneyState;
    }
  ): Promise<ChildJourneyOverview> {
    if (!this.isAuthorizedForStudent(studentId)) {
      throw new Error(`FORBIDDEN: Parent ${this.parentUserId} is not authorized to access student ${studentId}`);
    }

    const student = liveContext?.student || {
      id: studentId,
      schoolId: '',
      admissionNumber: '',
      firstName: 'Child',
      lastName: '',
      status: 'ACTIVE' as const,
      createdAt: '',
      updatedAt: '',
    };

    const location = liveContext?.location;
    const busLocation = location
      ? {
          ...location,
          isLive: this.evaluateGpsFreshness(location.recordedAt),
        }
      : undefined;

    return {
      student,
      currentTripId: liveContext?.currentTripId,
      busRegistration: liveContext?.busRegistration,
      journeyState: liveContext?.state || 'EXPECTED',
      busLocation,
      expectedStopName: liveContext?.expectedStopName,
    };
  }

  public evaluateGpsFreshness(recordedAt: string, currentTimeMs: number = Date.now()): boolean {
    const elapsedSeconds = (currentTimeMs - new Date(recordedAt).getTime()) / 1000;
    return elapsedSeconds <= THRESHOLDS.GPS_FRESHNESS_SECONDS;
  }
}
