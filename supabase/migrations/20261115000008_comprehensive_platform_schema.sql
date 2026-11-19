-- Migration: 20261115000008_comprehensive_platform_schema.sql
-- Aegis Production Grade Platform Schema Extension:
-- Settings, Maintenance, Staff Profiles, Notification Outbox, and Traccar Telemetry

-- 1. Platform Runtime Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  school_id UUID PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  gps_freshness_seconds INTEGER NOT NULL DEFAULT 60,
  gps_stale_seconds INTEGER NOT NULL DEFAULT 120,
  geofence_radius_meters INTEGER NOT NULL DEFAULT 75,
  map_tile_provider TEXT NOT NULL DEFAULT 'carto-dark',
  fcm_enabled BOOLEAN NOT NULL DEFAULT true,
  data_retention_days INTEGER NOT NULL DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Bus Maintenance Records
CREATE TABLE IF NOT EXISTS public.bus_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL,
  odometer_reading NUMERIC,
  cost NUMERIC(10, 2),
  notes TEXT NOT NULL,
  technician_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bus_maintenance_bus_id ON public.bus_maintenance(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_maintenance_school_id ON public.bus_maintenance(school_id);

-- 3. Staff Profiles (Drivers & Attendants)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('DRIVER', 'ATTENDANT')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  license_number TEXT,
  assigned_bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  assigned_route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_school ON public.staff_profiles(school_id);

-- 4. Durable Notification Outbox with Retry Queue
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENDING', 'DELIVERED', 'FAILED')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON public.notification_outbox(status, retry_count) WHERE status IN ('PENDING', 'FAILED');

-- 5. Parent Student Invitation Codes (Secure Claiming)
CREATE TABLE IF NOT EXISTS public.parent_invitation_codes (
  code TEXT PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  admission_number TEXT NOT NULL,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_by_user_id UUID REFERENCES public.users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_student ON public.parent_invitation_codes(student_id);

-- 6. RLS Policies
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_invitation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow school staff access to settings"
  ON public.platform_settings FOR ALL
  USING (school_id IN (SELECT school_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Allow school staff access to maintenance"
  ON public.bus_maintenance FOR ALL
  USING (school_id IN (SELECT school_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Allow school staff access to staff profiles"
  ON public.staff_profiles FOR ALL
  USING (school_id IN (SELECT school_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Allow school staff access to outbox"
  ON public.notification_outbox FOR ALL
  USING (school_id IN (SELECT school_id FROM public.user_roles WHERE user_id = auth.uid()));
