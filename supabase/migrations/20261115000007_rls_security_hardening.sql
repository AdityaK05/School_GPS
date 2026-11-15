-- ==============================================================================
-- Migration: 20261115000007_rls_security_hardening.sql
-- Description: Multi-Tenant Row Level Security (RLS) & Security Hardening
-- Phase: 2 - Database Migration Design (Stage 7)
-- Dependencies: 
--   20261115000001_extensions_and_enums.sql
--   20261115000002_identity_and_tenants.sql
--   20261115000003_fleet_gps_rfid.sql
--   20261115000004_routes_stops_trips.sql
--   20261115000005_students_assignments_journey_events.sql
--   20261115000006_exceptions_notifications_audit.sql
-- Note: Greenfield preparation only. Do NOT execute supabase db push.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. GUARDIANS & STUDENT-GUARDIAN JUNCTION
-- LLD §16, §17 and packages/shared-types/src/types/guardian.ts
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(20) NOT NULL DEFAULT 'GUARDIAN' CHECK (relationship IN ('FATHER', 'MOTHER', 'GUARDIAN')),
    notification_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_guardians_user_student UNIQUE (user_id, student_id)
);

COMMENT ON TABLE guardians IS 'Links parent/guardian user accounts to their authorized students with notification preferences.';

CREATE INDEX IF NOT EXISTS idx_guardians_user_id ON guardians(user_id);
CREATE INDEX IF NOT EXISTS idx_guardians_student_id ON guardians(student_id);

CREATE OR REPLACE VIEW student_guardians AS 
SELECT id, user_id, student_id, relationship, notification_enabled, created_at, updated_at
FROM guardians;

COMMENT ON VIEW student_guardians IS 'Compatibility view for student-guardian relationship references defined in LLD §16/§17.';

CREATE TRIGGER trg_guardians_updated_at
    BEFORE UPDATE ON guardians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 2. SECURITY DEFINER RLS HELPER FUNCTIONS
-- Optimized, cached (STABLE), and search_path-hardened functions to prevent
-- recursion, privilege escalation, and cross-tenant leakage.
-- ------------------------------------------------------------------------------

-- 2.1 Check if the current authenticated user has global SUPER_ADMIN role
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'SUPER_ADMIN'
  );
$$;

COMMENT ON FUNCTION is_super_admin() IS 'Returns true if authenticated user holds active SUPER_ADMIN role.';

-- 2.2 Get primary school_id of current authenticated user from users profile
CREATE OR REPLACE FUNCTION get_auth_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT school_id FROM users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_auth_school_id() IS 'Resolves tenant school_id for the calling authenticated user.';

-- 2.3 Check if user possesses one of the required roles in the given school
CREATE OR REPLACE FUNCTION has_role_in_school(target_school_id UUID, required_roles user_role_type[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT is_super_admin() OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN users u ON u.id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND (ur.school_id = target_school_id OR u.school_id = target_school_id)
      AND ur.role = ANY(required_roles)
  );
$$;

COMMENT ON FUNCTION has_role_in_school(UUID, user_role_type[]) IS 'Validates school-scoped role membership or global SUPER_ADMIN.';

-- 2.4 Check if user is School Administrator or Transport Manager
CREATE OR REPLACE FUNCTION is_school_admin_or_manager(target_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT is_super_admin() OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN users u ON u.id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND (ur.school_id = target_school_id OR u.school_id = target_school_id)
      AND ur.role IN ('SCHOOL_ADMIN', 'TRANSPORT_MANAGER')
  );
$$;

COMMENT ON FUNCTION is_school_admin_or_manager(UUID) IS 'Validates administrative permissions for a school tenant.';

-- 2.5 Check if user is registered parent/guardian of the given student
CREATE OR REPLACE FUNCTION is_parent_of_student(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM guardians
    WHERE user_id = auth.uid()
      AND student_id = target_student_id
  );
$$;

COMMENT ON FUNCTION is_parent_of_student(UUID) IS 'Validates whether current authenticated user is a verified guardian of the student.';

-- 2.6 Check if user is the assigned driver or attendant on the trip
CREATE OR REPLACE FUNCTION is_assigned_staff_on_trip(target_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips
    WHERE id = target_trip_id
      AND (driver_id = auth.uid() OR attendant_id = auth.uid())
  );
$$;

COMMENT ON FUNCTION is_assigned_staff_on_trip(UUID) IS 'Validates driver or attendant operational assignment on a trip.';

-- 2.7 Check if user is parent of any student manifested on the trip
CREATE OR REPLACE FUNCTION is_parent_of_trip_student(target_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_students ts
    JOIN guardians g ON g.student_id = ts.student_id
    WHERE ts.trip_id = target_trip_id
      AND g.user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION is_parent_of_trip_student(UUID) IS 'Validates parent authorization to view a trip carrying their child.';

-- ------------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY ACROSS ALL DOMAIN TABLES
-- ------------------------------------------------------------------------------

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_journey_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4. RLS POLICIES PER TABLE
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- 4.1 SCHOOLS
-- ==============================================================================
CREATE POLICY "schools_select_tenant_or_admin" ON schools
    FOR SELECT TO authenticated
    USING (is_super_admin() OR id = get_auth_school_id());

CREATE POLICY "schools_insert_super_admin" ON schools
    FOR INSERT TO authenticated
    WITH CHECK (is_super_admin());

CREATE POLICY "schools_update_admin" ON schools
    FOR UPDATE TO authenticated
    USING (is_super_admin() OR (id = get_auth_school_id() AND is_school_admin_or_manager(id)))
    WITH CHECK (is_super_admin() OR (id = get_auth_school_id() AND is_school_admin_or_manager(id)));

CREATE POLICY "schools_delete_super_admin" ON schools
    FOR DELETE TO authenticated
    USING (is_super_admin());

-- ==============================================================================
-- 4.2 USERS
-- ==============================================================================
CREATE POLICY "users_select_tenant_or_self" ON users
    FOR SELECT TO authenticated
    USING (is_super_admin() OR id = auth.uid() OR school_id = get_auth_school_id());

CREATE POLICY "users_insert_admin" ON users
    FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR (school_id = get_auth_school_id() AND is_school_admin_or_manager(school_id)));

CREATE POLICY "users_update_self_or_admin" ON users
    FOR UPDATE TO authenticated
    USING (is_super_admin() OR id = auth.uid() OR (school_id = get_auth_school_id() AND is_school_admin_or_manager(school_id)))
    WITH CHECK (is_super_admin() OR id = auth.uid() OR (school_id = get_auth_school_id() AND is_school_admin_or_manager(school_id)));

CREATE POLICY "users_delete_admin" ON users
    FOR DELETE TO authenticated
    USING (is_super_admin() OR (school_id = get_auth_school_id() AND is_school_admin_or_manager(school_id)));

-- ==============================================================================
-- 4.3 USER_ROLES
-- ==============================================================================
CREATE POLICY "user_roles_select_self_or_admin" ON user_roles
    FOR SELECT TO authenticated
    USING (is_super_admin() OR user_id = auth.uid() OR (school_id IS NOT NULL AND is_school_admin_or_manager(school_id)));

CREATE POLICY "user_roles_insert_admin" ON user_roles
    FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR (school_id IS NOT NULL AND is_school_admin_or_manager(school_id)));

CREATE POLICY "user_roles_update_admin" ON user_roles
    FOR UPDATE TO authenticated
    USING (is_super_admin() OR (school_id IS NOT NULL AND is_school_admin_or_manager(school_id)))
    WITH CHECK (is_super_admin() OR (school_id IS NOT NULL AND is_school_admin_or_manager(school_id)));

CREATE POLICY "user_roles_delete_admin" ON user_roles
    FOR DELETE TO authenticated
    USING (is_super_admin() OR (school_id IS NOT NULL AND is_school_admin_or_manager(school_id)));

-- ==============================================================================
-- 4.4 BUSES
-- ==============================================================================
CREATE POLICY "buses_select_tenant" ON buses
    FOR SELECT TO authenticated
    USING (is_super_admin() OR school_id = get_auth_school_id());

CREATE POLICY "buses_insert_admin" ON buses
    FOR INSERT TO authenticated
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "buses_update_admin" ON buses
    FOR UPDATE TO authenticated
    USING (is_school_admin_or_manager(school_id))
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "buses_delete_admin" ON buses
    FOR DELETE TO authenticated
    USING (is_school_admin_or_manager(school_id));

-- ==============================================================================
-- 4.5 GPS_DEVICES
-- ==============================================================================
CREATE POLICY "gps_devices_select_tenant" ON gps_devices
    FOR SELECT TO authenticated
    USING (is_super_admin() OR school_id = get_auth_school_id());

CREATE POLICY "gps_devices_insert_admin" ON gps_devices
    FOR INSERT TO authenticated
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "gps_devices_update_admin" ON gps_devices
    FOR UPDATE TO authenticated
    USING (is_school_admin_or_manager(school_id))
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "gps_devices_delete_admin" ON gps_devices
    FOR DELETE TO authenticated
    USING (is_school_admin_or_manager(school_id));

-- ==============================================================================
-- 4.6 RFID_DEVICES
-- ==============================================================================
CREATE POLICY "rfid_devices_select_tenant" ON rfid_devices
    FOR SELECT TO authenticated
    USING (is_super_admin() OR school_id = get_auth_school_id());

CREATE POLICY "rfid_devices_insert_admin" ON rfid_devices
    FOR INSERT TO authenticated
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "rfid_devices_update_admin" ON rfid_devices
    FOR UPDATE TO authenticated
    USING (is_school_admin_or_manager(school_id))
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "rfid_devices_delete_admin" ON rfid_devices
    FOR DELETE TO authenticated
    USING (is_school_admin_or_manager(school_id));

-- ==============================================================================
-- 4.7 GPS_LOCATIONS (Telemetry: Append-Only)
-- ADR-11: direct school_id filtering for tenant isolation and active parent tracking.
-- ==============================================================================
CREATE POLICY "gps_locations_select_authorized" ON gps_locations
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'DRIVER', 'ATTENDANT']::user_role_type[])
        OR (
            school_id = get_auth_school_id()
            AND EXISTS (
                SELECT 1 FROM trips t
                JOIN trip_students ts ON ts.trip_id = t.id
                JOIN guardians g ON g.student_id = ts.student_id
                WHERE t.bus_id = gps_locations.bus_id
                  AND t.status = 'IN_PROGRESS'
                  AND g.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "gps_locations_insert_authorized" ON gps_locations
    FOR INSERT TO authenticated
    WITH CHECK (
        is_super_admin()
        OR has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'DRIVER']::user_role_type[])
    );

-- No UPDATE or DELETE policy: gps_locations is immutable time-series data.

-- ==============================================================================
-- 4.8 ROUTES
-- ==============================================================================
CREATE POLICY "routes_select_tenant" ON routes
    FOR SELECT TO authenticated
    USING (is_super_admin() OR school_id = get_auth_school_id());

CREATE POLICY "routes_insert_admin" ON routes
    FOR INSERT TO authenticated
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "routes_update_admin" ON routes
    FOR UPDATE TO authenticated
    USING (is_school_admin_or_manager(school_id))
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "routes_delete_admin" ON routes
    FOR DELETE TO authenticated
    USING (is_school_admin_or_manager(school_id));

-- ==============================================================================
-- 4.9 STOPS
-- ==============================================================================
CREATE POLICY "stops_select_tenant" ON stops
    FOR SELECT TO authenticated
    USING (is_super_admin() OR school_id = get_auth_school_id());

CREATE POLICY "stops_insert_admin" ON stops
    FOR INSERT TO authenticated
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "stops_update_admin" ON stops
    FOR UPDATE TO authenticated
    USING (is_school_admin_or_manager(school_id))
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "stops_delete_admin" ON stops
    FOR DELETE TO authenticated
    USING (is_school_admin_or_manager(school_id));

-- ==============================================================================
-- 4.10 TRIPS
-- ==============================================================================
CREATE POLICY "trips_select_authorized" ON trips
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'DRIVER', 'ATTENDANT']::user_role_type[])
                OR is_parent_of_trip_student(id)
            )
        )
    );

CREATE POLICY "trips_insert_admin" ON trips
    FOR INSERT TO authenticated
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "trips_update_staff_or_admin" ON trips
    FOR UPDATE TO authenticated
    USING (
        is_school_admin_or_manager(school_id)
        OR (school_id = get_auth_school_id() AND is_assigned_staff_on_trip(id))
    )
    WITH CHECK (
        is_school_admin_or_manager(school_id)
        OR (school_id = get_auth_school_id() AND is_assigned_staff_on_trip(id))
    );

CREATE POLICY "trips_delete_admin" ON trips
    FOR DELETE TO authenticated
    USING (is_school_admin_or_manager(school_id));

-- ==============================================================================
-- 4.11 STUDENTS
-- ==============================================================================
CREATE POLICY "students_select_authorized" ON students
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'DRIVER', 'ATTENDANT']::user_role_type[])
                OR is_parent_of_student(id)
            )
        )
    );

CREATE POLICY "students_insert_admin" ON students
    FOR INSERT TO authenticated
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "students_update_admin" ON students
    FOR UPDATE TO authenticated
    USING (is_school_admin_or_manager(school_id))
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "students_delete_admin" ON students
    FOR DELETE TO authenticated
    USING (is_school_admin_or_manager(school_id));

-- ==============================================================================
-- 4.12 GUARDIANS
-- ==============================================================================
CREATE POLICY "guardians_select_authorized" ON guardians
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = guardians.student_id
              AND is_school_admin_or_manager(s.school_id)
        )
    );

CREATE POLICY "guardians_insert_admin" ON guardians
    FOR INSERT TO authenticated
    WITH CHECK (
        is_super_admin()
        OR EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = guardians.student_id
              AND is_school_admin_or_manager(s.school_id)
        )
    );

CREATE POLICY "guardians_update_authorized" ON guardians
    FOR UPDATE TO authenticated
    USING (
        is_super_admin()
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = guardians.student_id
              AND is_school_admin_or_manager(s.school_id)
        )
    )
    WITH CHECK (
        is_super_admin()
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = guardians.student_id
              AND is_school_admin_or_manager(s.school_id)
        )
    );

CREATE POLICY "guardians_delete_admin" ON guardians
    FOR DELETE TO authenticated
    USING (
        is_super_admin()
        OR EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = guardians.student_id
              AND is_school_admin_or_manager(s.school_id)
        )
    );

-- ==============================================================================
-- 4.13 STUDENT_ROUTE_ASSIGNMENTS
-- ==============================================================================
CREATE POLICY "student_route_assignments_select_authorized" ON student_route_assignments
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'DRIVER', 'ATTENDANT']::user_role_type[])
                OR is_parent_of_student(student_id)
            )
        )
    );

CREATE POLICY "student_route_assignments_insert_admin" ON student_route_assignments
    FOR INSERT TO authenticated
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "student_route_assignments_update_admin" ON student_route_assignments
    FOR UPDATE TO authenticated
    USING (is_school_admin_or_manager(school_id))
    WITH CHECK (is_school_admin_or_manager(school_id));

CREATE POLICY "student_route_assignments_delete_admin" ON student_route_assignments
    FOR DELETE TO authenticated
    USING (is_school_admin_or_manager(school_id));

-- ==============================================================================
-- 4.14 TRIP_STUDENTS (Manifest)
-- ==============================================================================
CREATE POLICY "trip_students_select_authorized" ON trip_students
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'DRIVER', 'ATTENDANT']::user_role_type[])
                OR is_parent_of_student(student_id)
            )
        )
    );

CREATE POLICY "trip_students_insert_authorized" ON trip_students
    FOR INSERT TO authenticated
    WITH CHECK (
        is_school_admin_or_manager(school_id)
        OR (school_id = get_auth_school_id() AND is_assigned_staff_on_trip(trip_id))
    );

CREATE POLICY "trip_students_update_authorized" ON trip_students
    FOR UPDATE TO authenticated
    USING (
        is_school_admin_or_manager(school_id)
        OR (school_id = get_auth_school_id() AND is_assigned_staff_on_trip(trip_id))
    )
    WITH CHECK (
        is_school_admin_or_manager(school_id)
        OR (school_id = get_auth_school_id() AND is_assigned_staff_on_trip(trip_id))
    );

CREATE POLICY "trip_students_delete_admin" ON trip_students
    FOR DELETE TO authenticated
    USING (is_school_admin_or_manager(school_id));

-- ==============================================================================
-- 4.15 JOURNEY_EVENTS (Immutable Audit Trail)
-- ADR-6: UUID v7 idempotency, append-only, updates/deletions blocked by trigger & RLS
-- ==============================================================================
CREATE POLICY "journey_events_select_authorized" ON journey_events
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'DRIVER', 'ATTENDANT']::user_role_type[])
                OR (student_id IS NOT NULL AND is_parent_of_student(student_id))
            )
        )
    );

CREATE POLICY "journey_events_insert_authorized" ON journey_events
    FOR INSERT TO authenticated
    WITH CHECK (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']::user_role_type[])
                OR is_assigned_staff_on_trip(trip_id)
            )
        )
    );

-- No UPDATE or DELETE policy: immutable log.

-- ==============================================================================
-- 4.16 STUDENT_JOURNEY_STATES (Materialized Operational Snapshot)
-- ==============================================================================
CREATE POLICY "student_journey_states_select_authorized" ON student_journey_states
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'DRIVER', 'ATTENDANT']::user_role_type[])
                OR is_parent_of_student(student_id)
            )
        )
    );

CREATE POLICY "student_journey_states_insert_authorized" ON student_journey_states
    FOR INSERT TO authenticated
    WITH CHECK (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']::user_role_type[])
                OR is_assigned_staff_on_trip(trip_id)
            )
        )
    );

CREATE POLICY "student_journey_states_update_authorized" ON student_journey_states
    FOR UPDATE TO authenticated
    USING (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']::user_role_type[])
                OR is_assigned_staff_on_trip(trip_id)
            )
        )
    )
    WITH CHECK (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']::user_role_type[])
                OR is_assigned_staff_on_trip(trip_id)
            )
        )
    );

-- ==============================================================================
-- 4.17 EXCEPTIONS
-- ==============================================================================
CREATE POLICY "exceptions_select_authorized" ON exceptions
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'DRIVER', 'ATTENDANT']::user_role_type[])
                OR (student_id IS NOT NULL AND is_parent_of_student(student_id))
            )
        )
    );

CREATE POLICY "exceptions_insert_authorized" ON exceptions
    FOR INSERT TO authenticated
    WITH CHECK (
        is_super_admin()
        OR (
            school_id = get_auth_school_id()
            AND (
                has_role_in_school(school_id, ARRAY['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']::user_role_type[])
                OR is_assigned_staff_on_trip(trip_id)
            )
        )
    );

CREATE POLICY "exceptions_update_admin" ON exceptions
    FOR UPDATE TO authenticated
    USING (is_school_admin_or_manager(school_id))
    WITH CHECK (is_school_admin_or_manager(school_id));

-- No DELETE policy: operational exceptions must be preserved for compliance.

-- ==============================================================================
-- 4.18 NOTIFICATIONS
-- ==============================================================================
CREATE POLICY "notifications_select_recipient_or_admin" ON notifications
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR user_id = auth.uid()
        OR (school_id = get_auth_school_id() AND is_school_admin_or_manager(school_id))
    );

CREATE POLICY "notifications_insert_admin" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK (
        is_super_admin()
        OR (school_id = get_auth_school_id() AND is_school_admin_or_manager(school_id))
    );

CREATE POLICY "notifications_update_recipient" ON notifications
    FOR UPDATE TO authenticated
    USING (is_super_admin() OR user_id = auth.uid())
    WITH CHECK (is_super_admin() OR user_id = auth.uid());

CREATE POLICY "notifications_delete_recipient" ON notifications
    FOR DELETE TO authenticated
    USING (is_super_admin() OR user_id = auth.uid());

-- ==============================================================================
-- 4.19 AUDIT_LOGS (Immutable Security Log)
-- ==============================================================================
CREATE POLICY "audit_logs_select_admin" ON audit_logs
    FOR SELECT TO authenticated
    USING (
        is_super_admin()
        OR (school_id = get_auth_school_id() AND is_school_admin_or_manager(school_id))
    );

CREATE POLICY "audit_logs_insert_tenant" ON audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        is_super_admin()
        OR school_id = get_auth_school_id()
    );

-- No UPDATE or DELETE policy: audit_logs is append-only (enforced by RLS & trg_audit_logs_immutable).

-- ------------------------------------------------------------------------------
-- 5. FINAL INDEXES FOR RLS EVALUATION & QUERY OPTIMIZATION
-- ------------------------------------------------------------------------------

-- Composite index to support has_role_in_school and is_super_admin with index-only scan
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role_school 
    ON user_roles(user_id, role, school_id);

-- Support parent GPS bus lookup on active trips
CREATE INDEX IF NOT EXISTS idx_trips_bus_status 
    ON trips(bus_id, status);

-- Support spatial geofence queries on stops (ST_Contains/ST_Covers)
CREATE INDEX IF NOT EXISTS idx_stops_geofence 
    ON stops USING GIST(geofence) 
    WHERE geofence IS NOT NULL;
