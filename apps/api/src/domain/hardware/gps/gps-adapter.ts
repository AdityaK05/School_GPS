export interface NormalizedGPSEvent {
  deviceId: string;
  busId?: string;
  schoolId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  recordedAt: string; // Original hardware GPS fix timestamp
  receivedAt: string; // Server ingestion timestamp
  providerMetadata?: Record<string, unknown>;
}

export interface IGPSAdapter {
  readonly vendorName: string;
  normalize(rawPayload: unknown): NormalizedGPSEvent;
}

/**
 * Standard / Generic JSON GPS Telemetry Adapter.
 * Parses REST / Webhook payloads from standard telematics gateways.
 */
export class GenericJsonGpsAdapter implements IGPSAdapter {
  readonly vendorName = 'GENERIC_JSON';

  public normalize(rawPayload: unknown): NormalizedGPSEvent {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('MALFORMED_GPS_PAYLOAD: Raw GPS payload must be an object');
    }

    const data = rawPayload as Record<string, unknown>;
    const deviceId = String(data.deviceId || data.device_id || data.imei || '').trim();
    if (!deviceId) {
      throw new Error('MALFORMED_GPS_PAYLOAD: Missing device identifier (deviceId/imei)');
    }

    const latRaw = data.latitude ?? data.lat;
    const lonRaw = data.longitude ?? data.lon ?? data.lng;

    if (latRaw === undefined || latRaw === null || lonRaw === undefined || lonRaw === null) {
      throw new Error('MALFORMED_GPS_PAYLOAD: Missing geographic coordinates (latitude/longitude)');
    }

    const latitude = Number(latRaw);
    const longitude = Number(lonRaw);

    if (Number.isNaN(latitude) || latitude < -90.0 || latitude > 90.0) {
      throw new Error(`INVALID_COORDINATES: Latitude ${latitude} out of bounds [-90, 90]`);
    }

    if (Number.isNaN(longitude) || longitude < -180.0 || longitude > 180.0) {
      throw new Error(`INVALID_COORDINATES: Longitude ${longitude} out of bounds [-180, 180]`);
    }

    const rawTimestamp = data.recordedAt || data.timestamp || data.fix_time;
    let recordedAt: string;
    if (rawTimestamp) {
      const parsedDate = new Date(String(rawTimestamp));
      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error(`MALFORMED_GPS_PAYLOAD: Invalid recordedAt timestamp: ${rawTimestamp}`);
      }
      recordedAt = parsedDate.toISOString();
    } else {
      recordedAt = new Date().toISOString();
    }

    const receivedAt = new Date().toISOString();

    let speed: number | undefined;
    if (data.speed !== undefined && data.speed !== null) {
      const spd = Number(data.speed);
      if (!Number.isNaN(spd) && spd >= 0) speed = spd;
    }

    let heading: number | undefined;
    if (data.heading !== undefined && data.heading !== null) {
      const hdg = Number(data.heading);
      if (!Number.isNaN(hdg) && hdg >= 0 && hdg <= 360) heading = hdg;
    }

    let accuracy: number | undefined;
    if (data.accuracy !== undefined && data.accuracy !== null) {
      const acc = Number(data.accuracy);
      if (!Number.isNaN(acc) && acc >= 0) accuracy = acc;
    }

    return {
      deviceId,
      busId: data.busId ? String(data.busId) : undefined,
      schoolId: data.schoolId ? String(data.schoolId) : undefined,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
      recordedAt,
      receivedAt,
      providerMetadata: {
        vendor: this.vendorName,
        rawAltitude: data.altitude,
        satellites: data.satellites,
      },
    };
  }
}

/**
 * Enterprise Teltonika Telematics Protocol Adapter.
 * Handles standard Teltonika AVL JSON/UDP bridge telemetry format.
 */
export class TeltonikaGpsAdapter implements IGPSAdapter {
  readonly vendorName = 'TELTONIKA_AVL';

  public normalize(rawPayload: unknown): NormalizedGPSEvent {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('MALFORMED_GPS_PAYLOAD: Teltonika payload must be an object');
    }

    const data = rawPayload as Record<string, unknown>;
    const imei = String(data.imei || data.device_imei || '').trim();
    if (!imei) {
      throw new Error('MALFORMED_GPS_PAYLOAD: Missing Teltonika IMEI');
    }

    // Teltonika AVL coords may be integer microdegrees (e.g. 129698000) or floats
    let lat = Number(data.latitude ?? data.lat);
    let lon = Number(data.longitude ?? data.lon);

    if (Math.abs(lat) > 90 && Math.abs(lat) <= 900000000) {
      lat = lat / 10000000;
    }
    if (Math.abs(lon) > 180 && Math.abs(lon) <= 1800000000) {
      lon = lon / 10000000;
    }

    if (Number.isNaN(lat) || lat < -90.0 || lat > 90.0) {
      throw new Error(`INVALID_COORDINATES: Teltonika latitude ${lat} out of bounds`);
    }
    if (Number.isNaN(lon) || lon < -180.0 || lon > 180.0) {
      throw new Error(`INVALID_COORDINATES: Teltonika longitude ${lon} out of bounds`);
    }

    const recordedAt = data.timestamp ? new Date(String(data.timestamp)).toISOString() : new Date().toISOString();
    const receivedAt = new Date().toISOString();

    return {
      deviceId: imei,
      latitude: lat,
      longitude: lon,
      speed: data.speed !== undefined ? Number(data.speed) : undefined,
      heading: data.angle !== undefined ? Number(data.angle) : undefined,
      accuracy: data.accuracy !== undefined ? Number(data.accuracy) : undefined,
      recordedAt,
      receivedAt,
      providerMetadata: {
        vendor: this.vendorName,
        ignition: data.ignition,
        batteryVoltage: data.battery_voltage,
        satellites: data.satellites,
      },
    };
  }
}
