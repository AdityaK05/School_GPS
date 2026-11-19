import { NormalizedGPSLocation } from './gps.adapter';
import { IngestGpsLocationSchema, TraccarForwardSchema } from '@school-transport-platform/validation';

export interface TraccarNormalizationResult {
  normalized: NormalizedGPSLocation;
  imei: string;
  rawEvent?: string;
}

export class TraccarAdapter {
  /**
   * Normalizes incoming Traccar HTTP Forward payloads (either URL-encoded query/body or JSON)
   * Traccar format typically includes:
   * - uniqueId or deviceId (IMEI)
   * - latitude, longitude
   * - speed (in knots, 1 knot = 1.852 km/h)
   * - course (heading degrees 0-360)
   * - deviceTime / fixTime
   * - attributes (e.g. ignition, battery, totalDistance)
   */
  public static normalizeForward(payload: any): NormalizedGPSLocation {
    const parsed = TraccarForwardSchema.parse(payload);

    // Resolve identifier (uniqueId is the tracker's IMEI)
    const deviceId = String(parsed.uniqueId || parsed.deviceId || '');
    if (!deviceId) {
      throw new Error('Traccar telemetry missing device uniqueId or deviceId');
    }

    // Convert speed from Knots to km/h if from Traccar standard protocol
    let speedKmh: number | undefined = undefined;
    if (parsed.speed !== undefined && parsed.speed !== null) {
      // In Traccar positions table, speed is stored in knots
      // If speed > 0, we can convert knots to km/h: 1 knot ≈ 1.852 km/h
      // However if attributes.speed_unit is kmh or value is already provided:
      speedKmh = Math.round(Number(parsed.speed) * 1.852 * 10) / 10;
    }

    const recordedAt = parsed.fixTime || parsed.deviceTime;

    return IngestGpsLocationSchema.parse({
      deviceId,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      speed: speedKmh,
      heading: parsed.course !== undefined ? parsed.course : undefined,
      recordedAt: recordedAt || new Date().toISOString(),
    });
  }

  /**
   * Normalizes standard Traccar Webhook events:
   * {
   *   "event": { "type": "deviceMoving" | "geofenceEnter" | ... },
   *   "device": { "id": 1, "uniqueId": "860123456789012", "name": "Bus 12 Tracker" },
   *   "position": { "latitude": 28.632, "longitude": 77.368, "speed": 20.5, "course": 84, "fixTime": "..." }
   * }
   */
  public static normalizeWebhook(payload: any): NormalizedGPSLocation {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Invalid Traccar webhook payload');
    }

    const body = payload as Record<string, any>;
    const device = body.device || {};
    const position = body.position || {};

    const deviceId = String(device.uniqueId || device.id || position.deviceId || '');
    if (!deviceId) {
      throw new Error('Traccar webhook missing device uniqueId/IMEI');
    }

    if (position.latitude === undefined || position.longitude === undefined) {
      throw new Error('Traccar webhook position missing coordinates');
    }

    let speedKmh: number | undefined = undefined;
    if (position.speed !== undefined && position.speed !== null) {
      speedKmh = Math.round(Number(position.speed) * 1.852 * 10) / 10;
    }

    const recordedAt = position.fixTime || position.deviceTime || position.serverTime;

    return IngestGpsLocationSchema.parse({
      deviceId,
      latitude: position.latitude,
      longitude: position.longitude,
      speed: speedKmh,
      heading: position.course !== undefined ? Number(position.course) : undefined,
      accuracy: position.accuracy !== undefined ? Number(position.accuracy) : undefined,
      recordedAt: recordedAt || new Date().toISOString(),
    });
  }
}
