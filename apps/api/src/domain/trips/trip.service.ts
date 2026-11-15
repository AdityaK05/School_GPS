import {
  Trip,
  TripStudent,
} from '@school-transport-platform/shared-types';
import {
  ITripRepository,
  IStudentRepository,
  IRouteRepository,
} from '../../repositories/interfaces';
import { JourneyService } from '../journey/journey.service';
import { generateUuidV7 } from '@school-transport-platform/utils';
import crypto from 'crypto';

export class TripService {
  constructor(
    private tripRepo: ITripRepository,
    private studentRepo: IStudentRepository,
    private routeRepo: IRouteRepository,
    private journeyService: JourneyService
  ) {}

  public async createTrip(params: {
    schoolId: string;
    routeId: string;
    busId: string;
    driverId?: string;
    attendantId?: string;
    tripDate: string;
    direction: 'MORNING' | 'EVENING';
  }): Promise<Trip> {
    const trip: Trip = {
      id: crypto.randomUUID(),
      schoolId: params.schoolId,
      routeId: params.routeId,
      busId: params.busId,
      driverId: params.driverId,
      attendantId: params.attendantId,
      tripDate: params.tripDate,
      direction: params.direction,
      status: 'SCHEDULED',
    };

    const createdTrip = await this.tripRepo.create(trip);

    // Populate Trip Student Manifest from active student route assignments
    const allStudents = await this.studentRepo.findBySchool(params.schoolId);
    for (const student of allStudents) {
      const assignment = await this.studentRepo.findAssignment(student.id);
      if (assignment && assignment.routeId === params.routeId && assignment.status === 'ACTIVE') {
        const manifestEntry: TripStudent = {
          id: crypto.randomUUID(),
          tripId: createdTrip.id,
          studentId: student.id,
          expectedBoardingStopId: assignment.stopId,
          expectedExitStopId: assignment.stopId,
          boardingStatus: 'PENDING',
          exitStatus: 'PENDING',
        };
        await this.tripRepo.createTripStudent(manifestEntry);
      }
    }

    return createdTrip;
  }

  public async startTrip(tripId: string): Promise<Trip> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) throw new Error(`Trip ${tripId} not found`);

    const startedAt = new Date().toISOString();
    const updated = await this.tripRepo.update(tripId, {
      status: 'IN_PROGRESS',
      startedAt,
    });

    // Emit TRIP_STARTED event
    await this.journeyService.processEvent({
      id: crypto.randomUUID(),
      idempotencyKey: generateUuidV7(),
      schoolId: trip.schoolId,
      tripId: trip.id,
      busId: trip.busId,
      eventType: 'TRIP_STARTED',
      eventTimestamp: startedAt,
      source: 'SYSTEM',
      deviceId: 'BACKEND_CORE',
      syncStatus: 'SYNCED',
      createdAt: startedAt,
    });

    return updated;
  }

  public async completeTrip(tripId: string): Promise<Trip> {
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) throw new Error(`Trip ${tripId} not found`);

    const completedAt = new Date().toISOString();
    const updated = await this.tripRepo.update(tripId, {
      status: 'COMPLETED',
      completedAt,
    });

    // Emit TRIP_COMPLETED event
    await this.journeyService.processEvent({
      id: crypto.randomUUID(),
      idempotencyKey: generateUuidV7(),
      schoolId: trip.schoolId,
      tripId: trip.id,
      busId: trip.busId,
      eventType: 'TRIP_COMPLETED',
      eventTimestamp: completedAt,
      source: 'SYSTEM',
      deviceId: 'BACKEND_CORE',
      syncStatus: 'SYNCED',
      createdAt: completedAt,
    });

    return updated;
  }
}
