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
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
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
