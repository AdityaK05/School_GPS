import { Route, Stop } from '@school-transport-platform/shared-types';
import { IRouteRepository } from '../../repositories/interfaces';
import crypto from 'crypto';

export class RouteService {
  constructor(private routeRepo: IRouteRepository) {}

  public async createRoute(params: {
    schoolId: string;
    name: string;
    code: string;
    direction: 'MORNING' | 'EVENING';
  }): Promise<Route> {
    const route: Route = {
      id: crypto.randomUUID(),
      schoolId: params.schoolId,
      name: params.name,
      code: params.code,
      direction: params.direction,
      status: 'ACTIVE',
    };
    return await this.routeRepo.createRoute(route);
  }

  public async createStop(params: {
    routeId: string;
    name: string;
    latitude: number;
    longitude: number;
    sequence: number;
    geofenceRadiusMeters?: number;
    expectedArrivalTime?: string;
  }): Promise<Stop> {
    const stop: Stop = {
      id: crypto.randomUUID(),
      routeId: params.routeId,
      name: params.name,
      latitude: params.latitude,
      longitude: params.longitude,
      sequence: params.sequence,
      geofenceRadiusMeters: params.geofenceRadiusMeters || 75,
      expectedArrivalTime: params.expectedArrivalTime,
    };
    return await this.routeRepo.createStop(stop);
  }
}
