import {
  JourneyEvent,
  JourneyState,
  StudentJourneyState,
} from '@school-transport-platform/shared-types';
import { generateUuidV7 } from '@school-transport-platform/utils';
import {
  IJourneyRepository,
  ITripRepository,
  IStudentRepository,
} from '../../repositories/interfaces';
import { AuditService } from '../audit/audit.service';
import crypto from 'crypto';

export interface ManualOverrideParams {
  studentId: string;
  tripId: string;
  newStatus: 'BOARDED' | 'EXIT_RECORDED' | 'COMPLETED';
  reason: string;
  actorUserId: string;
  stopId?: string;
}

export class ManualAttendanceOverrideService {
  constructor(
    private journeyRepo: IJourneyRepository,
    private tripRepo: ITripRepository,
    private studentRepo: IStudentRepository,
    private auditService: AuditService
  ) {}

  public async executeOverride(params: ManualOverrideParams): Promise<{
    success: boolean;
    overrideEventId: string;
    previousState: JourneyState;
    newState: JourneyState;
  }> {
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error('Audit compliance requires an explicit override reason of at least 5 characters');
    }

    const trip = await this.tripRepo.findById(params.tripId);
    if (!trip) {
      throw new Error(`Trip ${params.tripId} not found`);
    }

    const student = await this.studentRepo.findById(params.studentId);
    if (!student) {
      throw new Error(`Student ${params.studentId} not found`);
    }

    // 1. Capture Previous State (Never modified or erased)
    const existingSnapshot = await this.journeyRepo.getStudentJourneyState(
      params.studentId,
      params.tripId
    );
    const previousState: JourneyState = existingSnapshot ? existingSnapshot.state : 'EXPECTED';
    const newState: JourneyState = params.newStatus as JourneyState;

    const timestamp = new Date().toISOString();

    // 2. Emit Distinct MANUAL_ATTENDANCE_OVERRIDE Event
    const overrideEvent: JourneyEvent = {
      id: crypto.randomUUID(),
      idempotencyKey: generateUuidV7(),
      schoolId: trip.schoolId,
      tripId: params.tripId,
      studentId: params.studentId,
      busId: trip.busId,
      stopId: params.stopId,
      eventType: 'MANUAL_ATTENDANCE_OVERRIDE',
      eventTimestamp: timestamp,
      source: 'ADMIN',
      deviceId: params.actorUserId,
      metadata: {
        reason: params.reason,
        actorUserId: params.actorUserId,
        previousState,
        newState,
      },
      syncStatus: 'SYNCED',
      createdAt: timestamp,
    };
    await this.journeyRepo.createEvent(overrideEvent);

    // 3. Update Materialized Journey State Snapshot
    const updatedSnapshot: StudentJourneyState = {
      id: existingSnapshot ? existingSnapshot.id : crypto.randomUUID(),
      studentId: params.studentId,
      tripId: params.tripId,
      schoolId: trip.schoolId,
      state: newState,
      lastEventId: overrideEvent.id,
      lastEventTimestamp: timestamp,
      updatedAt: timestamp,
    };
    await this.journeyRepo.upsertStudentJourneyState(updatedSnapshot);

    // 4. Update Trip Manifest
    const tripStudent = await this.tripRepo.findTripStudent(params.tripId, params.studentId);
    if (tripStudent) {
      if (params.newStatus === 'BOARDED') {
        await this.tripRepo.updateTripStudent(tripStudent.id, {
          boardingStatus: 'BOARDED',
          actualBoardingTimestamp: timestamp,
        });
      } else if (params.newStatus === 'EXIT_RECORDED' || params.newStatus === 'COMPLETED') {
        await this.tripRepo.updateTripStudent(tripStudent.id, {
          exitStatus: 'EXITED',
          actualExitTimestamp: timestamp,
        });
      }
    }

    // 5. Append Mandatory Immutable Audit Record
    await this.auditService.log(
      trip.schoolId,
      params.actorUserId,
      'MANUAL_ATTENDANCE_OVERRIDE',
      'student_journey_states',
      updatedSnapshot.id,
      { previousState },
      { newState, overrideEventId: overrideEvent.id },
      params.reason
    );

    return {
      success: true,
      overrideEventId: overrideEvent.id,
      previousState,
      newState,
    };
  }
}
