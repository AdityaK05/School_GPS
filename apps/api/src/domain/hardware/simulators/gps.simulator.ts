import { NormalizedGPSEvent } from '../gps/gps-adapter';

export type GpsSimulationMode = 'NORMAL' | 'STALE' | 'RECOVERY' | 'MALFORMED' | 'OUT_OF_BOUNDS';

export interface GpsSimulationOptions {
  deviceId: string;
  busId?: string;
  schoolId?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  mode?: GpsSimulationMode;
  staleAgeSeconds?: number;
}

/**
 * Deterministic GPS Hardware Simulator for Development & Testing.
 * Isolated from production runtime path.
 */
export class GPSSimulator {
  private lastLat: number;
  private lastLon: number;

  constructor(
    private defaultDeviceId: string,
    initialLat = 12.9698,
    initialLon = 77.7499
  ) {
    this.lastLat = initialLat;
    this.lastLon = initialLon;
  }

  public generatePoint(options: Partial<GpsSimulationOptions> = {}): Record<string, unknown> | NormalizedGPSEvent {
    const mode = options.mode || 'NORMAL';
    const deviceId = options.deviceId || this.defaultDeviceId;

    // Small coordinate drift for normal simulation
    this.lastLat += 0.0005;
    this.lastLon += 0.0005;

    const lat = options.latitude !== undefined ? options.latitude : this.lastLat;
    const lon = options.longitude !== undefined ? options.longitude : this.lastLon;

    switch (mode) {
      case 'MALFORMED':
        return {
          deviceId,
          lat: 'NOT_A_NUMBER',
          lon: undefined,
          timestamp: 'invalid-date',
        };

      case 'OUT_OF_BOUNDS':
        return {
          deviceId,
          latitude: 120.5, // > 90 invalid!
          longitude: lon,
          recordedAt: new Date().toISOString(),
        };

      case 'STALE': {
        const staleSec = options.staleAgeSeconds || 120; // 120s ago (> 60s)
        const recordedAt = new Date(Date.now() - staleSec * 1000).toISOString();
        return {
          deviceId,
          busId: options.busId,
          schoolId: options.schoolId,
          latitude: lat,
          longitude: lon,
          speed: options.speed ?? 30,
          heading: options.heading ?? 90,
          accuracy: 5.0,
          recordedAt,
          receivedAt: new Date().toISOString(),
        };
      }

      case 'RECOVERY':
      case 'NORMAL':
      default: {
        const recordedAt = new Date().toISOString();
        return {
          deviceId,
          busId: options.busId,
          schoolId: options.schoolId,
          latitude: lat,
          longitude: lon,
          speed: options.speed ?? 35,
          heading: options.heading ?? 90,
          accuracy: 3.5,
          recordedAt,
          receivedAt: recordedAt,
        };
      }
    }
  }
}
