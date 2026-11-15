export interface GPSLocation {
  id: string;

  busId: string;

  /**
   * Intentionally denormalized from buses.school_id.
   * Required for direct RLS enforcement on gps_locations without join-based lookups.
   * See ADR-11.
   */
  schoolId: string;

  latitude: number;
  longitude: number;

  location: GeoJSONPoint;

  speed?: number;
  heading?: number;
  accuracy?: number;

  /**
   * Timestamp from the GPS device itself.
   * Preserved throughout ingestion. Never overwritten.
   */
  recordedAt: string;

  /**
   * Timestamp when the server received/ingested this location.
   * Used to calculate GPS freshness (ADR-8): stale if receivedAt - recordedAt > threshold.
   */
  receivedAt: string;
}

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

