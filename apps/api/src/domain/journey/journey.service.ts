import {
  JourneyEvent,
  StudentJourneyState,
  JourneyState,
  JourneyEventResult,
  JourneyException,
} from '@school-transport-platform/shared-types';
import {
  IJourneyRepository,
  ITripRepository,
  IStudentRepository,
  IExceptionRepository,
  IRouteRepository,
} from '../../repositories/interfaces';
import { JourneyStateMachine } from './state-machine';
import { ExceptionEngine } from '../exceptions/exception.engine';
import { NotificationService } from '../notifications/notification.service';
import crypto from 'crypto';

export class JourneyService {
  constructor(
    private journeyRepo: IJourneyRepository,
    private tripRepo: ITripRepository,
    private studentRepo: IStudentRepository,
    private routeRepo: IRouteRepository,
    private exceptionRepo: IExceptionRepository,
    private notificationService: NotificationService
  ) {}

  /**
   * Primary entry point for processing any JourneyEvent.
   * Deterministic, idempotent (ADR-6), immutable.
   */
  public async processEvent(event: JourneyEvent): Promise<JourneyEventResult> {
    // 1. Check Idempotency Key (UUID v7 deduplication)
    const existingEvent = await this.journeyRepo.findEventByIdempotencyKey(event.idempotencyKey);
    if (existingEvent) {
      const existingState = event.studentId
        ? await this.journeyRepo.getStudentJourneyState(event.studentId, event.tripId)
        : null;

      return {
        success: true,
        eventId: existingEvent.id,
        journeyState: existingState ? existingState.state : ('COMPLETED' as JourneyState),
        exception: null,
      };
    }

    // 2. Validate Trip Context
    const trip = await this.tripRepo.findById(event.tripId);
    if (!trip) {
      throw new Error(`Trip ${event.tripId} not found`);
    }

    let createdException: JourneyException | null = null;
    let nextState: JourneyState = 'EXPECTED';

    // 3. Process Student Lifecycle Events
    if (event.studentId) {
      const tripStudent = await this.tripRepo.findTripStudent(event.tripId, event.studentId);
      const student = await this.studentRepo.findById(event.studentId);

      // Check WRONG_BUS
      if (!tripStudent) {
        createdException = ExceptionEngine.evaluateWrongBus(
          tripStudent,
          event.studentId,
          event.tripId,
          trip.schoolId
        );
        if (createdException) {
          await this.exceptionRepo.create(createdException);
        }
      }

      // Check WRONG_STOP_EXIT for student exit
      if (event.eventType === 'STUDENT_EXIT' && tripStudent) {
        const expectedStop = await this.routeRepo.findStopById(tripStudent.expectedExitStopId);
        const exitException = ExceptionEngine.evaluateExitLocation(
          expectedStop,
          event.latitude,
          event.longitude,
          event.studentId,
          event.tripId,
          trip.schoolId
        );
        if (exitException) {
          createdException = exitException;
          await this.exceptionRepo.create(createdException);
        }
      }

      // Retrieve Current Journey State
      const currentSnapshot = await this.journeyRepo.getStudentJourneyState(
        event.studentId,
        event.tripId
      );
      const currentState: JourneyState = currentSnapshot ? currentSnapshot.state : 'EXPECTED';

      // Deterministic State Machine Transition
      const transitionResult = JourneyStateMachine.transition(currentState, event.eventType);
      nextState = transitionResult.nextState;

      // Update State Snapshot
      const updatedSnapshot: StudentJourneyState = {
        id: currentSnapshot ? currentSnapshot.id : crypto.randomUUID(),
        studentId: event.studentId,
        tripId: event.tripId,
        schoolId: trip.schoolId,
        state: nextState,
        lastEventId: event.id,
        lastEventTimestamp: event.eventTimestamp,
        updatedAt: new Date().toISOString(),
      };
      await this.journeyRepo.upsertStudentJourneyState(updatedSnapshot);

      // Update Manifest Status
      if (tripStudent) {
        if (event.eventType === 'STUDENT_BOARDING') {
          await this.tripRepo.updateTripStudent(tripStudent.id, {
            boardingStatus: 'BOARDED',
            actualBoardingTimestamp: event.eventTimestamp,
          });
          await this.notificationService.notifyGuardians(
            event.studentId,
            trip.schoolId,
            'BOARDING',
            'Student Boarded Bus',
            `${student ? student.firstName : 'Student'} has boarded the school bus.`
          );
        } else if (event.eventType === 'STUDENT_EXIT') {
          await this.tripRepo.updateTripStudent(tripStudent.id, {
            exitStatus: 'EXITED',
            actualExitTimestamp: event.eventTimestamp,
          });
          await this.notificationService.notifyGuardians(
            event.studentId,
            trip.schoolId,
            'EXIT',
            'Student Exited Bus',
            `${student ? student.firstName : 'Student'} has safely exited the bus.`
          );
        }
      }
    }

    // If vehicle reaches stop, transition expected exit students to EXIT_PENDING (ADR-7)
    if (event.eventType === 'BUS_REACHED_STOP' && event.stopId) {
      const tripStudents = await this.tripRepo.findTripStudents(event.tripId);
      const exitStudents = tripStudents.filter(
        (s) => s.expectedExitStopId === event.stopId && s.boardingStatus === 'BOARDED' && s.exitStatus !== 'EXITED'
      );
      for (const ts of exitStudents) {
        await this.tripRepo.updateTripStudent(ts.id, {
          exitStatus: 'PENDING',
          stopReachedTimestamp: event.eventTimestamp,
        });
        const currentSnap = await this.journeyRepo.getStudentJourneyState(ts.studentId, event.tripId);
        await this.journeyRepo.upsertStudentJourneyState({
          id: currentSnap ? currentSnap.id : crypto.randomUUID(),
          studentId: ts.studentId,
          tripId: event.tripId,
          schoolId: trip.schoolId,
          state: 'EXIT_PENDING',
          lastEventId: event.id,
          lastEventTimestamp: event.eventTimestamp,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // When a trip completes, all students who have exited transition to COMPLETED
    if (event.eventType === 'TRIP_COMPLETED') {
      const tripStudents = await this.tripRepo.findTripStudents(event.tripId);
      for (const ts of tripStudents) {
        const currentSnap = await this.journeyRepo.getStudentJourneyState(ts.studentId, event.tripId);
        if (currentSnap && currentSnap.state === 'EXIT_RECORDED') {
          await this.journeyRepo.upsertStudentJourneyState({
            id: currentSnap.id,
            studentId: ts.studentId,
            tripId: event.tripId,
            schoolId: trip.schoolId,
            state: 'COMPLETED',
            lastEventId: event.id,
            lastEventTimestamp: event.eventTimestamp,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    // 4. Save Immutable Journey Event
    await this.journeyRepo.createEvent(event);

    return {
      success: true,
      eventId: event.id,
      journeyState: nextState,
      exception: createdException
        ? (createdException.type as any)
        : event.eventType === 'DUPLICATE_RFID_SCAN'
        ? 'DUPLICATE_SCAN'
        : null,
    };
  }

  /**
   * Evaluates the 5-minute grace period for students in EXIT_PENDING status (ADR-7).
   * If 5 minutes have elapsed since bus reached stop without an RFID exit scan,
   * generates a critical EXIT_MISSING exception.
   */
  public async evaluateExitMissingGracePeriod(
    tripId: string,
    currentTimeMs: number = Date.now()
  ): Promise<JourneyException[]> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) throw new Error(`Trip ${tripId} not found`);

    const tripStudents = await this.tripRepo.findTripStudents(tripId);
    const createdExceptions: JourneyException[] = [];

    for (const ts of tripStudents) {
      if (ts.exitStatus === 'PENDING' && ts.stopReachedTimestamp) {
        const exception = ExceptionEngine.evaluateMissingExit(
          ts.stopReachedTimestamp,
          true,
          currentTimeMs,
          ts.studentId,
          tripId,
          trip.schoolId,
          ts.expectedExitStopId
        );
        if (exception) {
          await this.exceptionRepo.create(exception);
          createdExceptions.push(exception);
        }
      }
    }

    return createdExceptions;
  }
}
