import { z } from 'zod';

// ==========================================
// 1. CONFIGURATION SCHEMA
// ==========================================
export const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
  SUPABASE_SECRET_KEY: z.string().min(10).optional(),
  LOG_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO'),
  CORS_ORIGIN: z.string().default('*'),
  // Groq AI Transport Assistant
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  AI_ENABLED: z.coerce.boolean().default(true),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

// ==========================================
// 2. DOMAIN OBJECT & EVENT SCHEMAS
// ==========================================

export const UserRoleSchema = z.enum([
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'TRANSPORT_MANAGER',
  'DRIVER',
  'ATTENDANT',
  'PARENT',
]);

export const JourneyStateSchema = z.enum([
  'EXPECTED',
  'BOARDING_PENDING',
  'BOARDED',
  'ONBOARD',
  'EXIT_PENDING',
  'EXIT_RECORDED',
  'COMPLETED',
]);

export const JourneyEventTypeSchema = z.enum([
  'TRIP_STARTED',
  'TRIP_COMPLETED',
  'STUDENT_BOARDING',
  'STUDENT_EXIT',
  'BUS_LOCATION_UPDATE',
  'BUS_REACHED_STOP',
  'GPS_OFFLINE',
  'GPS_RECOVERED',
  'DUPLICATE_RFID_SCAN',
  'MANUAL_ATTENDANCE_OVERRIDE',
]);

export const ExceptionTypeSchema = z.enum([
  'BOARDING_MISSING',
  'WRONG_BUS',
  'WRONG_STOP_EXIT',
  'EXIT_MISSING',
  'GPS_UNAVAILABLE',
  'DUPLICATE_SCAN',
  'SYNC_FAILURE',
  'MANUAL_ATTENDANCE_OVERRIDE',
]);

// Request Schemas

export const IngestJourneyEventSchema = z.object({
  idempotencyKey: z.string().uuid(),
  eventType: JourneyEventTypeSchema,
  tripId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
  busId: z.string().uuid().optional(),
  stopId: z.string().uuid().optional(),
  eventTimestamp: z.string().datetime(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  source: z.enum(['RFID', 'GPS', 'ATTENDANT', 'ADMIN', 'SYSTEM']).default('RFID'),
  deviceId: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export const BatchJourneyEventsSchema = z.object({
  deviceId: z.string().min(1),
  events: z.array(IngestJourneyEventSchema).min(1).max(500),
});

export const IngestGpsLocationSchema = z.object({
  deviceId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().min(0).optional(),
  recordedAt: z.string().datetime(),
});

export const ManualAttendanceOverrideSchema = z.object({
  studentId: z.string().uuid(),
  tripId: z.string().uuid(),
  newStatus: z.enum(['BOARDED', 'EXIT_RECORDED', 'COMPLETED']),
  reason: z.string().min(5, 'Reason must be at least 5 characters for audit compliance'),
  stopId: z.string().uuid().optional(),
});

export const CreateBusSchema = z.object({
  registrationNumber: z.string().min(3),
  fleetNumber: z.string().min(1),
  capacity: z.number().int().positive(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).default('ACTIVE'),
});

export const CreateRouteSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  direction: z.enum(['MORNING', 'EVENING']),
});

export const CreateStopSchema = z.object({
  routeId: z.string().uuid(),
  name: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofenceRadiusMeters: z.number().positive().default(75),
  sequence: z.number().int().min(1),
  expectedArrivalTime: z.string().optional(),
});

export const CreateTripSchema = z.object({
  routeId: z.string().uuid(),
  busId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  attendantId: z.string().uuid().optional(),
  tripDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  direction: z.enum(['MORNING', 'EVENING']),
});

export const CreateStudentSchema = z.object({
  admissionNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  className: z.string().optional(),
  section: z.string().optional(),
  rfidCardId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const AssignStudentRouteSchema = z.object({
  studentId: z.string().uuid(),
  routeId: z.string().uuid(),
  stopId: z.string().uuid(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effectiveUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// GPS Device Registration
export const RegisterGpsDeviceSchema = z.object({
  imei: z.string().min(8, 'IMEI must be at least 8 characters'),
  busId: z.string().uuid(),
  provider: z.string().default('TRACCAR'),
  model: z.string().optional(),
});

// Traccar HTTP Forward / Webhook Ingestion Schema
export const TraccarForwardSchema = z.object({
  uniqueId: z.string().optional(),
  deviceId: z.union([z.string(), z.number()]).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  speed: z.coerce.number().optional(),
  course: z.coerce.number().optional(),
  altitude: z.coerce.number().optional(),
  deviceTime: z.string().optional(),
  fixTime: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
});

// Parent Auth & Verification Schemas
export const RequestOtpSchema = z.object({
  identifier: z.string().min(5, 'Phone or email required'),
});

export const VerifyOtpSchema = z.object({
  identifier: z.string().min(5),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const LinkStudentSchema = z.object({
  admissionNumber: z.string().min(2, 'Admission number required'),
  invitationCode: z.string().min(4, 'Invitation code required'),
  relationship: z.string().default('PARENT'),
});

// Platform Settings Schema
export const UpdateSettingsSchema = z.object({
  schoolName: z.string().min(2).optional(),
  gpsFreshnessSeconds: z.number().int().min(10).max(300).optional(),
  gpsStaleSeconds: z.number().int().min(30).max(600).optional(),
  geofenceRadiusMeters: z.number().int().min(20).max(500).optional(),
  mapTileProvider: z.enum(['carto-dark', 'carto-light', 'osm-standard']).optional(),
  fcmEnabled: z.boolean().optional(),
  dataRetentionDays: z.number().int().min(7).max(3650).optional(),
});

// Staff Management Schema
export const CreateStaffSchema = z.object({
  name: z.string().min(2),
  role: z.enum(['DRIVER', 'ATTENDANT']),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  licenseNumber: z.string().optional(),
  assignedBusId: z.string().uuid().optional(),
  assignedRouteId: z.string().uuid().optional(),
});

// Maintenance Log Schema
export const CreateMaintenanceSchema = z.object({
  busId: z.string().uuid(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceType: z.string().min(3),
  odometerReading: z.number().optional(),
  cost: z.number().optional(),
  notes: z.string().min(3),
  technicianName: z.string().optional(),
});

// Exception Status Transition Schema
export const TransitionExceptionSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']),
  reason: z.string().min(3, 'Resolution or transition note required'),
});
