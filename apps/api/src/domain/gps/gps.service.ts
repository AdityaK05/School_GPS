import {
  GPSLocation,
  JourneyEvent,
} from '@school-transport-platform/shared-types';
import { THRESHOLDS } from '@school-transport-platform/constants';
import { generateUuidV7 } from '@school-transport-platform/utils';
import {
  IGpsRepository,
  IDeviceRepository,
  IBusRepository,
  ITripRepository,
  IRouteRepository,
  IExceptionRepository,
} from '../../repositories/interfaces';
import { JourneyService } from '../journey/journey.service';
import { ExceptionEngine } from '../exceptions/exception.engine';
import { NormalizedGPSLocation } from './gps.adapter';
import crypto from 'crypto';

export class GPSService {
  constructor(
    private gpsRepo: IGpsRepository,
    private deviceRepo: IDeviceRepository,
    private busRepo: IBusRepository,
    private tripRepo: ITripRepository,
    private routeRepo: IRouteRepository,
    private exceptionRepo: IExceptionRepository,
    private journeyService: JourneyService
  ) {}

  public async ingestLocation(normalized: NormalizedGPSLocation): Promise<{
    locationId: string;
    busId: string;
    stale: boolean;
    stopReached?: string;
  }> {
    // 1. Resolve GPS Device & Associated Bus
    const gpsDevice = await this.deviceRepo.findGpsByExternalId(normalized.deviceId);
    if (!gpsDevice) {
      throw new Error(`Unregistered GPS device IMEI/ID: ${normalized.deviceId}`);
    }

    const bus = await this.busRepo.findById(gpsDevice.busId);
    if (!bus) {
      throw new Error(`Bus ${gpsDevice.busId} associated with GPS device not found`);
    }

    const previousLocation = await this.gpsRepo.getLatestLocationByBus(bus.id);
    const serverReceivedAt = new Date().toISOString();
    const recordedAtMs = new Date(normalized.recordedAt).getTime();
    const receivedAtMs = new Date(serverReceivedAt).getTime();
    if (!Number.isFinite(recordedAtMs) || recordedAtMs > receivedAtMs + THRESHOLDS.GPS_FRESHNESS_SECONDS * 1000) {
      throw new Error('GPS timestamp is invalid or too far in the future');
    }
    const isOutOfOrder =
      previousLocation !== null &&
      recordedAtMs <= new Date(previousLocation.recordedAt).getTime();

    // Persist telemetry as history, but never let a delayed packet roll operational state backward.
    const locationRecord: GPSLocation = {
      id: crypto.randomUUID(),
      busId: bus.id,
      schoolId: bus.schoolId,
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      location: {
        type: 'Point',
        coordinates: [normalized.longitude, normalized.latitude],
      },
      speed: normalized.speed,
      heading: normalized.heading,
      accuracy: normalized.accuracy,
      recordedAt: normalized.recordedAt, // Hardware GPS fix timestamp
      receivedAt: serverReceivedAt,      // Server ingestion timestamp
    };
    await this.gpsRepo.createLocation(locationRecord);

    // 3. Evaluate GPS Freshness (60s threshold - ADR-8)
    const staleSeconds = (new Date(serverReceivedAt).getTime() - new Date(normalized.recordedAt).getTime()) / 1000;
    const isStale = staleSeconds > THRESHOLDS.GPS_FRESHNESS_SECONDS;

    if (isOutOfOrder) {
      return {
        locationId: locationRecord.id,
        busId: bus.id,
        stale: true,
      };
    }

    if (isStale) {
      const gpsException = ExceptionEngine.evaluateGpsFreshness(
        locationRecord,
        Date.now(),
        bus.schoolId,
        bus.id
      );
      if (gpsException) {
        await this.exceptionRepo.create(gpsException);
      }
    } else {
      // Telemetry is fresh. Check if device was previously OFFLINE to trigger recovery
      if (gpsDevice.status === 'OFFLINE') {
        const openExceptions = await this.exceptionRepo.findBySchool(bus.schoolId, 'OPEN');
        const staleGpsExceptions = openExceptions.filter(
          (e) => e.busId === bus.id && e.type === 'GPS_UNAVAILABLE'
        );
        for (const ex of staleGpsExceptions) {
          await this.exceptionRepo.update(ex.id, {
            status: 'RESOLVED',
            resolvedAt: serverReceivedAt,
            resolutionReason: 'GPS telemetry recovered with fresh fix',
          });
        }

        const activeTrip = await this.tripRepo.findActiveTripByBus(bus.id);
        if (activeTrip && !isStale) {
          await this.journeyService.processEvent({
            id: crypto.randomUUID(),
            idempotencyKey: generateUuidV7(),
            schoolId: bus.schoolId,
            tripId: activeTrip.id,
            busId: bus.id,
            eventType: 'GPS_RECOVERED',
            eventTimestamp: normalized.recordedAt,
            latitude: normalized.latitude,
            longitude: normalized.longitude,
            source: 'GPS',
            deviceId: gpsDevice.id,
            syncStatus: 'SYNCED',
            createdAt: serverReceivedAt,
          });
        }
      }
    }

    // 4. Update Device Last Seen Timestamp
    await this.deviceRepo.updateGps(gpsDevice.id, {
      status: isStale ? 'OFFLINE' : 'ONLINE',
      lastSeenAt: normalized.recordedAt,
    });

    // 5. Check Active Trip and Stop Geofences
    let stopReachedId: string | undefined;
    const activeTrip = await this.tripRepo.findActiveTripByBus(bus.id);
    if (activeTrip) {
      // Progress boarded students to ONBOARD when bus moves
      if (normalized.speed && normalized.speed > 0) {
        const tripStudents = await this.tripRepo.findTripStudents(activeTrip.id);
        for (const ts of tripStudents) {
          const currentSnap = await this.journeyService['journeyRepo'].getStudentJourneyState(ts.studentId, activeTrip.id);
          if (currentSnap && currentSnap.state === 'BOARDED') {
            await this.journeyService.processEvent({
              id: crypto.randomUUID(),
              idempotencyKey: generateUuidV7(),
              schoolId: bus.schoolId,
              tripId: activeTrip.id,
              studentId: ts.studentId,
              busId: bus.id,
              eventType: 'BUS_LOCATION_UPDATE',
              eventTimestamp: normalized.recordedAt,
              latitude: normalized.latitude,
              longitude: normalized.longitude,
              source: 'GPS',
              deviceId: gpsDevice.id,
              syncStatus: 'SYNCED',
              createdAt: serverReceivedAt,
            });
          }
        }
      }

      // Evaluate stops along the route
      const stops = await this.routeRepo.findStopsByRoute(activeTrip.routeId);
      for (const stop of stops) {
        const inside = await this.routeRepo.isPointWithinStopGeofence(
          stop.id,
          normalized.latitude,
          normalized.longitude
        );
        if (inside) {
          stopReachedId = stop.id;
          const wasInside = previousLocation
            ? await this.routeRepo.isPointWithinStopGeofence(
                stop.id,
                previousLocation.latitude,
                previousLocation.longitude
              )
            : false;
          if (wasInside) continue;
          // Emit BUS_REACHED_STOP event
          const stopEvent: JourneyEvent = {
            id: crypto.randomUUID(),
            idempotencyKey: generateUuidV7(),
            schoolId: bus.schoolId,
            tripId: activeTrip.id,
            busId: bus.id,
            stopId: stop.id,
            eventType: 'BUS_REACHED_STOP',
            eventTimestamp: normalized.recordedAt,
            latitude: normalized.latitude,
            longitude: normalized.longitude,
            source: 'GPS',
            deviceId: gpsDevice.id,
            syncStatus: 'SYNCED',
            createdAt: serverReceivedAt,
          };
          await this.journeyService.processEvent(stopEvent);
          break; // Avoid double triggering
        }
      }
    }

    return {
      locationId: locationRecord.id,
      busId: bus.id,
      stale: isStale,
      stopReached: stopReachedId,
    };
  }
}
