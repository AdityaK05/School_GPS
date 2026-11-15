export interface NormalizedGPSLocation {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  recordedAt: string;
}

export interface IGPSProviderAdapter {
  normalizeLocation(rawPayload: unknown): NormalizedGPSLocation;
}

export class StandardGPSProviderAdapter implements IGPSProviderAdapter {
  public normalizeLocation(rawPayload: unknown): NormalizedGPSLocation {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('Invalid raw GPS payload');
    }
    const data = rawPayload as Record<string, unknown>;
    return {
      deviceId: String(data.deviceId || data.device_id || data.imei),
      latitude: Number(data.latitude ?? data.lat),
      longitude: Number(data.longitude ?? data.lon ?? data.lng),
      speed: data.speed !== undefined ? Number(data.speed) : undefined,
      heading: data.heading !== undefined ? Number(data.heading) : undefined,
      accuracy: data.accuracy !== undefined ? Number(data.accuracy) : undefined,
      recordedAt: String(data.recordedAt || data.timestamp || new Date().toISOString()),
    };
  }
}
