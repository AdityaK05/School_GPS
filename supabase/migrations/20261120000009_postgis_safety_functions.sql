-- Authoritative PostGIS geofence checks for journey safety decisions.

CREATE OR REPLACE FUNCTION public.is_point_within_stop_geofence(
  p_stop_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM stops s
    WHERE s.id = p_stop_id
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::extensions.geography,
        s.location,
        s.geofence_radius_meters
      )
  );
$$;

COMMENT ON FUNCTION public.is_point_within_stop_geofence IS
'Returns whether a GPS/RFID point is inside the authoritative PostGIS stop geofence.';

-- UUID v7 idempotency format validation.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_journey_events_idempotency_uuid_v7'
  ) THEN
    ALTER TABLE journey_events
      ADD CONSTRAINT chk_journey_events_idempotency_uuid_v7
      CHECK (
        idempotency_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      );
  END IF;
END $$;

-- GPS locations are append-only and immutable operational telemetry.
CREATE OR REPLACE FUNCTION public.prevent_gps_location_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'gps_locations records are append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_gps_locations_immutable ON gps_locations;
CREATE TRIGGER trg_gps_locations_immutable
  BEFORE UPDATE OR DELETE ON gps_locations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_gps_location_mutation();

-- Tenant RLS on configurable platform tables.
ALTER TABLE parent_invitation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_invitation_codes_school_staff"
  ON parent_invitation_codes
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR school_id = get_auth_school_id()
  )
  WITH CHECK (
    is_super_admin()
    OR school_id = get_auth_school_id()
  );
