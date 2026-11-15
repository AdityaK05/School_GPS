export interface Stop {
  id: string;

  routeId: string;

  name: string;

  latitude: number;
  longitude: number;

  geofenceRadiusMeters: number;

  sequence: number;

  expectedArrivalTime?: string;
}