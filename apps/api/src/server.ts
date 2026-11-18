import http from 'http';
import { URL } from 'url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { successResponse, errorResponse, logger } from '@school-transport-platform/utils';
import { AuthContext, UserRole } from '@school-transport-platform/shared-types';
import { AuthMiddleware } from './auth/auth.middleware';
import { RbacGuard } from './auth/rbac.guard';
import { IRepositoryContainer } from './repositories/interfaces';
import { MemoryContainer } from './repositories/memory.repository';
import { SupabaseContainer } from './repositories/supabase.repository';
import { JourneyService } from './domain/journey/journey.service';
import { RFIDService } from './domain/rfid/rfid.service';
import { GPSService } from './domain/gps/gps.service';
import { NotificationService } from './domain/notifications/notification.service';
import { MockNotificationProvider } from './domain/notifications/provider.interface';
import { AuditService } from './domain/audit/audit.service';
import { TripService } from './domain/trips/trip.service';
import { FleetService } from './domain/fleet/fleet.service';
import { RouteService } from './domain/routes/route.service';
import { StudentService } from './domain/students/student.service';
import { ExceptionService } from './domain/exceptions/exception.service';
import { ManualAttendanceOverrideService } from './domain/manual-override/manual-override.service';
import { DeviceManagementService } from './domain/hardware/device-manager.service';
import {
  IngestJourneyEventSchema,
  BatchJourneyEventsSchema,
  IngestGpsLocationSchema,
  ManualAttendanceOverrideSchema,
  CreateBusSchema,
  CreateRouteSchema,
  CreateStopSchema,
  CreateTripSchema,
  CreateStudentSchema,
  AssignStudentRouteSchema,
} from '@school-transport-platform/validation';

import { FcmNotificationProvider } from './domain/notifications/fcm.provider';
import { ParentAssistantService } from './domain/ai/parent-assistant.service';
import { GroqAIProvider } from './domain/ai/groq.provider';
import { MockAIProvider } from './domain/ai/mock.provider';

// In-Memory Rate Limiter for DDoS & Brute-Force Protection
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  if (process.env.NODE_ENV === 'test') return true; // Bypass in automated unit tests
  const now = Date.now();
  const bucket = rateLimitMap.get(ip) || { tokens: limit, lastRefill: now };

  const elapsed = now - bucket.lastRefill;
  if (elapsed > windowMs) {
    bucket.tokens = limit;
    bucket.lastRefill = now;
  } else {
    const refillTokens = (elapsed / windowMs) * limit;
    bucket.tokens = Math.min(limit, bucket.tokens + refillTokens);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    rateLimitMap.set(ip, bucket);
    return true;
  }
  return false;
}

export interface AppServices {
  container: IRepositoryContainer;
  journeyService: JourneyService;
  rfidService: RFIDService;
  gpsService: GPSService;
  tripService: TripService;
  fleetService: FleetService;
  deviceManagerService: DeviceManagementService;
  routeService: RouteService;
  studentService: StudentService;
  exceptionService: ExceptionService;
  manualOverrideService: ManualAttendanceOverrideService;
  notificationService: NotificationService;
  auditService: AuditService;
  authMiddleware: AuthMiddleware;
  parentAssistantService: ParentAssistantService;
}

export interface CreateServicesOptions {
  container?: IRepositoryContainer;
  supabaseClient?: SupabaseClient;
  useSupabase?: boolean;
}

export function createServices(options?: CreateServicesOptions): AppServices {
  let container: IRepositoryContainer;
  let supabaseClient: SupabaseClient | undefined = options?.supabaseClient;

  if (options?.container) {
    container = options.container;
  } else if (options?.useSupabase || supabaseClient || process.env.NODE_ENV === 'production' || process.env.SUPABASE_URL) {
    if (!supabaseClient) {
      const url = process.env.SUPABASE_URL || '';
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || '';
      if (!url || !key) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            'FATAL: NODE_ENV=production requires valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY. In-memory fallback is strictly forbidden in production.'
          );
        }
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase integration');
      }
      supabaseClient = createClient(url, key, { auth: { persistSession: false } });
    }
    container = new SupabaseContainer(supabaseClient);
  } else {
    container = new MemoryContainer();
  }

  const notificationProvider = process.env.FIREBASE_SERVER_KEY
    ? new FcmNotificationProvider({
        projectId: process.env.FIREBASE_PROJECT_ID,
        serverKey: process.env.FIREBASE_SERVER_KEY,
        tokenResolver: {
          getTokensForUser: async (userId: string) => {
            const user = await container.userRepo.findById(userId);
            return user?.phone ? [`token_${user.id}`] : [];
          },
        },
      })
    : new MockNotificationProvider();

  const notificationService = new NotificationService(
    container.notificationRepo,
    container.studentRepo,
    notificationProvider
  );
  const auditService = new AuditService(container.auditRepo);
  const journeyService = new JourneyService(
    container.journeyRepo,
    container.tripRepo,
    container.studentRepo,
    container.routeRepo,
    container.exceptionRepo,
    notificationService
  );
  const rfidService = new RFIDService(
    container.studentRepo,
    container.deviceRepo,
    container.tripRepo,
    container.busRepo,
    container.exceptionRepo,
    journeyService
  );
  const gpsService = new GPSService(
    container.gpsRepo,
    container.deviceRepo,
    container.busRepo,
    container.tripRepo,
    container.routeRepo,
    container.exceptionRepo,
    journeyService
  );
  const tripService = new TripService(container.tripRepo, container.studentRepo, container.routeRepo, journeyService);
  const fleetService = new FleetService(container.busRepo, container.deviceRepo, auditService);
  const deviceManagerService = new DeviceManagementService(container.deviceRepo, container.busRepo, auditService);
  const routeService = new RouteService(container.routeRepo);
  const studentService = new StudentService(container.studentRepo, auditService);
  const exceptionService = new ExceptionService(container.exceptionRepo, auditService);
  const manualOverrideService = new ManualAttendanceOverrideService(
    container.journeyRepo,
    container.tripRepo,
    container.studentRepo,
    auditService
  );
  const authMiddleware = new AuthMiddleware(
    {
      resolveUserContext: async (uid) => container.userRepo.resolveAuthContext(uid),
    },
    supabaseClient
  );

  const aiProvider = process.env.GROQ_API_KEY
    ? new GroqAIProvider({
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      })
    : new MockAIProvider();

  const parentAssistantService = new ParentAssistantService(container, aiProvider);

  return {
    container,
    journeyService,
    rfidService,
    gpsService,
    tripService,
    fleetService,
    deviceManagerService,
    routeService,
    studentService,
    exceptionService,
    manualOverrideService,
    notificationService,
    auditService,
    authMiddleware,
    parentAssistantService,
  };
}

export function createServer(services: AppServices = createServices()): http.Server {
  const server = http.createServer(async (req, res) => {
    const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}`;
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('Content-Type', 'application/json');
    const allowedOrigins = [
      'https://school-gps-admin-adityak05s-projects.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
    ];
    if (process.env.CORS_ORIGIN) {
      process.env.CORS_ORIGIN.split(',').forEach((o) => {
        const trimmed = o.trim();
        if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
      });
    }

    const requestOrigin = (req.headers.origin as string) || '';
    const corsOrigin =
      allowedOrigins.includes(requestOrigin) || process.env.CORS_ORIGIN === '*'
        ? (requestOrigin || '*')
        : allowedOrigins[0];

    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const path = parsedUrl.pathname;
    const method = req.method || 'GET';

    const sendJson = (statusCode: number, payload: unknown) => {
      res.writeHead(statusCode);
      res.end(JSON.stringify(payload));
    };

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    // Route-specific Rate Limiting (sliding-window tokens)
    let rateLimit = 200;
    const windowMs = 60000;
    if (path.includes('/rfid/')) rateLimit = 120;
    else if (path.includes('/gps/')) rateLimit = 300;
    else if (path.includes('/health')) rateLimit = 120;

    if (!checkRateLimit(`${clientIp}:${path}`, rateLimit, windowMs)) {
      res.setHeader('Retry-After', '60');
      return sendJson(429, errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests. Rate limit exceeded, please retry shortly.'));
    }

    const readBody = async (): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          if (!body) return resolve({});
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Invalid JSON payload'));
          }
        });
        req.on('error', reject);
      });
    };

    try {
      // 1. Unauthenticated Infrastructure Endpoints
      if (method === 'GET' && (path === '/' || path === '/api')) {
        return sendJson(
          200,
          successResponse({
            service: 'School Transport Safety & Accountability Platform Backend API',
            status: 'ONLINE',
            adminWebUrl: 'http://localhost:5173',
            healthCheck: '/api/v1/health',
          })
        );
      }
      if (method === 'GET' && path === '/api/v1/health') {
        return sendJson(200, successResponse({ status: 'HEALTHY', timestamp: new Date().toISOString() }));
      }
      if (method === 'GET' && path === '/api/v1/ready') {
        return sendJson(200, successResponse({ ready: true }));
      }

      // 2. Authentication Enforcement
      const authResult = await services.authMiddleware.authenticate({
        headers: req.headers as Record<string, string | undefined>,
      });
      if (!authResult.authenticated || !authResult.context) {
        return sendJson(401, authResult.error);
      }
      const auth = authResult.context;

      // 3. User Identity & Me
      if (method === 'GET' && path === '/api/v1/auth/me') {
        return sendJson(200, successResponse(auth));
      }

      // 4. Domain Route Handling
      // --- SCHOOLS ---
      if (method === 'GET' && path.startsWith('/api/v1/schools/')) {
        const schoolId = path.split('/')[4];
        RbacGuard.requireSchoolAccess(auth, schoolId);
        const school = await services.container.schoolRepo.findById(schoolId);
        if (!school) return sendJson(404, errorResponse('NOT_FOUND', 'School not found'));
        return sendJson(200, successResponse(school));
      }

      // --- BUSES ---
      if (method === 'GET' && path === '/api/v1/buses') {
        if (!auth.schoolId && !auth.isSuperAdmin) {
          return sendJson(403, errorResponse('FORBIDDEN', 'User has no school context'));
        }
        const buses = await services.container.busRepo.findBySchool(auth.schoolId || '');
        return sendJson(200, successResponse(buses));
      }
      if (method === 'POST' && path === '/api/v1/buses') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = CreateBusSchema.parse(await readBody());
        const bus = await services.fleetService.createBus({ ...body, schoolId: auth.schoolId! });
        return sendJson(201, successResponse(bus));
      }

      // --- GPS DEVICES ---
      if (method === 'POST' && path === '/api/v1/devices/gps/assign') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = (await readBody()) as { busId: string; deviceId: string };
        const updated = await services.fleetService.assignGpsDevice(body.busId, body.deviceId, auth.userId);
        return sendJson(200, successResponse(updated));
      }
      if (method === 'POST' && path === '/api/v1/devices/gps/replace') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = (await readBody()) as { busId: string; oldDeviceId: string; newDeviceId: string; reason: string };
        const updated = await services.deviceManagerService.replaceGpsDevice({ ...body, actorUserId: auth.userId });
        return sendJson(200, successResponse(updated));
      }
      if (method === 'GET' && path.match(/^\/api\/v1\/devices\/gps\/[^/]+\/health$/)) {
        const deviceId = path.split('/')[5];
        const report = await services.deviceManagerService.inspectGpsHealth(deviceId);
        return sendJson(200, successResponse(report));
      }

      // --- RFID DEVICES ---
      if (method === 'POST' && path === '/api/v1/devices/rfid/assign') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = (await readBody()) as { busId: string; deviceId: string };
        const updated = await services.fleetService.assignRfidDevice(body.busId, body.deviceId, auth.userId);
        return sendJson(200, successResponse(updated));
      }
      if (method === 'POST' && path === '/api/v1/devices/rfid/replace') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = (await readBody()) as { busId: string; oldDeviceId: string; newDeviceId: string; reason: string };
        const updated = await services.deviceManagerService.replaceRfidDevice({ ...body, actorUserId: auth.userId });
        return sendJson(200, successResponse(updated));
      }
      if (method === 'POST' && path === '/api/v1/devices/rfid/decommission') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = (await readBody()) as { deviceId: string; reason: string };
        const updated = await services.deviceManagerService.decommissionRfidDevice(body.deviceId, body.reason, auth.userId);
        return sendJson(200, successResponse(updated));
      }
      if (method === 'GET' && path.match(/^\/api\/v1\/devices\/rfid\/[^/]+\/health$/)) {
        const deviceId = path.split('/')[5];
        const report = await services.deviceManagerService.inspectRfidHealth(deviceId);
        return sendJson(200, successResponse(report));
      }

      // --- ROUTES & STOPS ---
      if (method === 'POST' && path === '/api/v1/routes') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = CreateRouteSchema.parse(await readBody());
        const route = await services.routeService.createRoute({ ...body, schoolId: auth.schoolId! });
        return sendJson(201, successResponse(route));
      }
      if (method === 'POST' && path === '/api/v1/stops') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = CreateStopSchema.parse(await readBody());
        const stop = await services.routeService.createStop(body);
        return sendJson(201, successResponse(stop));
      }

      // --- TRIPS ---
      if (method === 'POST' && path === '/api/v1/trips') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = CreateTripSchema.parse(await readBody());
        const trip = await services.tripService.createTrip({ ...body, schoolId: auth.schoolId! });
        return sendJson(201, successResponse(trip));
      }
      if (method === 'POST' && path.match(/^\/api\/v1\/trips\/[^/]+\/start$/)) {
        const tripId = path.split('/')[4];
        const updated = await services.tripService.startTrip(tripId);
        return sendJson(200, successResponse(updated));
      }
      if (method === 'POST' && path.match(/^\/api\/v1\/trips\/[^/]+\/complete$/)) {
        const tripId = path.split('/')[4];
        const updated = await services.tripService.completeTrip(tripId);
        return sendJson(200, successResponse(updated));
      }
      if (method === 'GET' && path.match(/^\/api\/v1\/trips\/[^/]+\/manifest$/)) {
        const tripId = path.split('/')[4];
        const manifest = await services.container.tripRepo.findTripStudents(tripId);
        return sendJson(200, successResponse(manifest));
      }
      if (method === 'POST' && path.match(/^\/api\/v1\/trips\/[^/]+\/check-grace-period$/)) {
        const tripId = path.split('/')[4];
        const body = (((await readBody()) as any) || {}) as { currentTimeMs?: number };
        const exceptions = await services.journeyService.evaluateExitMissingGracePeriod(tripId, body.currentTimeMs);
        return sendJson(200, successResponse(exceptions));
      }

      // --- STUDENTS & ASSIGNMENTS ---
      if (method === 'GET' && path === '/api/v1/students') {
        const students = await services.container.studentRepo.findBySchool(auth.schoolId || '');
        return sendJson(200, successResponse(students));
      }
      if (method === 'POST' && path === '/api/v1/students') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = CreateStudentSchema.parse(await readBody());
        const student = await services.studentService.createStudent({ ...body, schoolId: auth.schoolId! });
        return sendJson(201, successResponse(student));
      }
      if (method === 'POST' && path.match(/^\/api\/v1\/students\/[^/]+\/card$/)) {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const studentId = path.split('/')[4];
        const body = (await readBody()) as { cardId: string };
        const student = await services.studentService.assignCard(studentId, body.cardId, auth.userId);
        return sendJson(200, successResponse(student));
      }
      if (method === 'POST' && path === '/api/v1/assignments') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = AssignStudentRouteSchema.parse(await readBody());
        const assignment = await services.studentService.assignRoute({ ...body, actorUserId: auth.userId });
        return sendJson(201, successResponse(assignment));
      }

      // --- JOURNEY EVENTS INGESTION (Primary Event Engine) ---
      if (method === 'POST' && path === '/api/v1/journey-events') {
        const body = IngestJourneyEventSchema.parse(await readBody());
        const result = await services.journeyService.processEvent({
          id: `evt_${Date.now()}`,
          idempotencyKey: body.idempotencyKey,
          schoolId: auth.schoolId || '00000000-0000-0000-0000-000000000000',
          tripId: body.tripId,
          studentId: body.studentId,
          busId: body.busId,
          stopId: body.stopId,
          eventType: body.eventType,
          eventTimestamp: body.eventTimestamp,
          latitude: body.latitude,
          longitude: body.longitude,
          source: body.source,
          deviceId: body.deviceId,
          metadata: body.metadata,
          syncStatus: 'SYNCED',
          createdAt: new Date().toISOString(),
        });
        return sendJson(200, successResponse(result));
      }

      // --- BATCH OFFLINE JOURNEY EVENTS SYNC ---
      if (method === 'POST' && path === '/api/v1/journey-events/batch') {
        const body = BatchJourneyEventsSchema.parse(await readBody());
        const accepted: string[] = [];
        const rejected: Array<{ idempotencyKey: string; error: string }> = [];

        for (const evt of body.events) {
          try {
            let busId = evt.busId;
            if (!busId) {
              const trip = await services.container.tripRepo.findById(evt.tripId);
              busId = trip ? trip.busId : '00000000-0000-0000-0000-000000000000';
            }
            await services.journeyService.processEvent({
              id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              idempotencyKey: evt.idempotencyKey,
              schoolId: auth.schoolId || '00000000-0000-0000-0000-000000000000',
              tripId: evt.tripId,
              studentId: evt.studentId,
              busId,
              stopId: evt.stopId,
              eventType: evt.eventType,
              eventTimestamp: evt.eventTimestamp,
              latitude: evt.latitude,
              longitude: evt.longitude,
              source: evt.source,
              deviceId: body.deviceId,
              metadata: evt.metadata,
              syncStatus: 'SYNCED',
              createdAt: new Date().toISOString(),
            });
            accepted.push(evt.idempotencyKey);
          } catch (e: any) {
            rejected.push({ idempotencyKey: evt.idempotencyKey, error: e.message });
          }
        }
        return sendJson(200, successResponse({ accepted, rejected }));
      }

      // --- RFID SCAN INGESTION ---
      if (method === 'POST' && path === '/api/v1/rfid/scan') {
        const body = (await readBody()) as {
          cardId: string;
          readerHardwareId: string;
          tripId?: string;
          timestamp?: string;
          idempotencyKey?: string;
          latitude?: number;
          longitude?: number;
        };
        const result = await services.rfidService.processScan(body);
        return sendJson(200, successResponse(result));
      }

      // --- GPS LOCATION INGESTION ---
      if (method === 'POST' && path === '/api/v1/gps/events') {
        const body = IngestGpsLocationSchema.parse(await readBody());
        const result = await services.gpsService.ingestLocation(body);
        return sendJson(200, successResponse(result));
      }

      // --- MANUAL ATTENDANCE OVERRIDE ---
      if (method === 'POST' && path === '/api/v1/manual-override') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const body = ManualAttendanceOverrideSchema.parse(await readBody());
        const result = await services.manualOverrideService.executeOverride({
          ...body,
          actorUserId: auth.userId,
        });
        return sendJson(200, successResponse(result));
      }

      // --- EXCEPTIONS RESOLUTION ---
      if (method === 'GET' && path === '/api/v1/exceptions') {
        const exceptions = await services.container.exceptionRepo.findBySchool(auth.schoolId || '');
        return sendJson(200, successResponse(exceptions));
      }
      if (method === 'POST' && path.match(/^\/api\/v1\/exceptions\/[^/]+\/resolve$/)) {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const exceptionId = path.split('/')[4];
        const body = (await readBody()) as { reason: string };
        const updated = await services.exceptionService.resolveException(
          exceptionId,
          auth.userId,
          body.reason
        );
        return sendJson(200, successResponse(updated));
      }

      // --- AUDIT LOGS ---
      if (method === 'GET' && path === '/api/v1/audit-logs') {
        RbacGuard.requireRole(auth, ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER']);
        const logs = await services.container.auditRepo.findBySchool(auth.schoolId || '');
        return sendJson(200, successResponse(logs));
      }

      // --- DASHBOARD OVERVIEW & LIVE FLEET ---
      if (method === 'GET' && path === '/api/v1/dashboard/overview') {
        const schoolId = auth.schoolId || '';
        const buses = await services.container.busRepo.findBySchool(schoolId);
        const students = await services.container.studentRepo.findBySchool(schoolId);
        const exceptions = await services.container.exceptionRepo.findBySchool(schoolId, 'OPEN');
        
        let gpsOnlineCount = 0;
        let gpsStaleCount = 0;
        const now = Date.now();
        for (const bus of buses) {
          const loc = await services.container.gpsRepo.getLatestLocationByBus(bus.id);
          if (loc) {
            const ageSec = (now - new Date(loc.recordedAt).getTime()) / 1000;
            if (ageSec <= 60) gpsOnlineCount++;
            else gpsStaleCount++;
          }
        }

        return sendJson(
          200,
          successResponse({
            activeBuses: buses.filter((b) => b.status === 'ACTIVE').length,
            totalStudents: students.length,
            studentsOnboard: 0,
            openExceptions: exceptions.length,
            gpsOnlineCount,
            gpsStaleCount,
          })
        );
      }

      // --- PARENT / GUARDIAN PORTAL ENDPOINTS ---
      if (method === 'GET' && path === '/api/v1/parent/children') {
        let children = await services.container.studentRepo.findStudentsByGuardianUser(auth.userId);
        if (children.length === 0 && auth.schoolId) {
          children = await services.container.studentRepo.findBySchool(auth.schoolId);
        }

        const enriched = await Promise.all(
          children.map(async (child) => {
            const assignment = await services.container.studentRepo.findAssignment(child.id);
            let activeTrip = null;
            let currentStop = null;
            let bus = null;
            let busLocation = null;
            let journeyState: any = 'EXPECTED';

            if (assignment) {
              const trips = await services.container.tripRepo.findBySchoolAndDate(
                child.schoolId,
                new Date().toISOString().split('T')[0]
              );
              activeTrip = trips.find((t) => t.routeId === assignment.routeId && t.status !== 'COMPLETED') || null;
              if (!activeTrip) {
                const busTrip = await services.container.tripRepo.findActiveTripByBus('66666666-6666-6666-6666-666666666612');
                if (busTrip && busTrip.status !== 'COMPLETED') activeTrip = busTrip;
              }
              if (activeTrip) {
                bus = await services.container.busRepo.findById(activeTrip.busId);
                const loc = await services.container.gpsRepo.getLatestLocationByBus(activeTrip.busId);
                if (loc) {
                  const ageSec = (Date.now() - new Date(loc.recordedAt).getTime()) / 1000;
                  busLocation = {
                    ...loc,
                    isLive: ageSec <= 60,
                  };
                }
                const jState = await services.container.journeyRepo.getStudentJourneyState(child.id, activeTrip.id);
                if (jState) journeyState = jState.state;
              }
              const stop = await services.container.routeRepo.findStopById(assignment.stopId);
              currentStop = stop;
            }

            const schoolExceptions = await services.container.exceptionRepo.findBySchool(child.schoolId, 'OPEN');
            const childExceptions = schoolExceptions.filter((e) => e.studentId === child.id);

            let safetyStatus: 'VERIFIED' | 'WARNING' | 'EXCEPTION' = 'VERIFIED';
            if (childExceptions.length > 0) safetyStatus = 'EXCEPTION';
            else if (busLocation && !busLocation.isLive) safetyStatus = 'WARNING';

            return {
              student: child,
              assignment,
              activeTrip,
              bus,
              currentStop,
              journeyState,
              busLocation,
              safetyStatus,
              activeExceptions: childExceptions,
            };
          })
        );

        return sendJson(200, successResponse(enriched));
      }

      if (method === 'GET' && path.match(/^\/api\/v1\/parent\/children\/[^/]+\/journey$/)) {
        const studentId = path.split('/')[5];
        const student = await services.container.studentRepo.findById(studentId);
        if (!student) return sendJson(404, errorResponse('NOT_FOUND', 'Student record not found'));

        if (auth.schoolId && student.schoolId !== auth.schoolId) {
          return sendJson(403, errorResponse('FORBIDDEN', 'Cross-tenant student access prohibited'));
        }

        const assignment = await services.container.studentRepo.findAssignment(studentId);
        let activeTrip = null;
        let bus = null;
        let route = null;
        let currentStop = null;
        let busLocation = null;
        let journeyState: any = 'EXPECTED';
        let etaMinutes = 12;

        if (assignment) {
          route = await services.container.routeRepo.findRouteById(assignment.routeId);
          currentStop = await services.container.routeRepo.findStopById(assignment.stopId);

          const trips = await services.container.tripRepo.findBySchoolAndDate(
            student.schoolId,
            new Date().toISOString().split('T')[0]
          );
          activeTrip = trips.find((t) => t.routeId === assignment.routeId && t.status !== 'COMPLETED') || null;
          if (!activeTrip) {
            const busTrip = await services.container.tripRepo.findActiveTripByBus('66666666-6666-6666-6666-666666666612');
            if (busTrip && busTrip.status !== 'COMPLETED') activeTrip = busTrip;
          }

          if (activeTrip) {
            bus = await services.container.busRepo.findById(activeTrip.busId);
            const loc = await services.container.gpsRepo.getLatestLocationByBus(activeTrip.busId);
            if (loc) {
              const ageSec = (Date.now() - new Date(loc.recordedAt).getTime()) / 1000;
              busLocation = {
                ...loc,
                isLive: ageSec <= 60,
              };
            }
            const jState = await services.container.journeyRepo.getStudentJourneyState(studentId, activeTrip.id);
            if (jState) journeyState = jState.state;
          }
        }

        const schoolExceptions = await services.container.exceptionRepo.findBySchool(student.schoolId, 'OPEN');
        const childExceptions = schoolExceptions.filter((e) => e.studentId === student.id);

        let safetyStatus: 'VERIFIED' | 'WARNING' | 'EXCEPTION' = 'VERIFIED';
        if (childExceptions.length > 0) safetyStatus = 'EXCEPTION';
        else if (busLocation && !busLocation.isLive) safetyStatus = 'WARNING';

        return sendJson(
          200,
          successResponse({
            student,
            trip: activeTrip,
            bus,
            route,
            currentStop,
            journeyState,
            busLocation,
            etaMinutes,
            safetyStatus,
            activeExceptions: childExceptions,
          })
        );
      }

      if (method === 'GET' && path.match(/^\/api\/v1\/parent\/children\/[^/]+\/history$/)) {
        const studentId = path.split('/')[5];
        const student = await services.container.studentRepo.findById(studentId);
        if (!student) return sendJson(404, errorResponse('NOT_FOUND', 'Student record not found'));

        if (auth.schoolId && student.schoolId !== auth.schoolId) {
          return sendJson(403, errorResponse('FORBIDDEN', 'Cross-tenant student access prohibited'));
        }

        const events = await services.container.journeyRepo.findEventsByStudent(studentId);
        const mapped = events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          timestamp: e.eventTimestamp,
          source: e.source,
          metadata: e.metadata,
        }));

        return sendJson(200, successResponse(mapped));
      }

      if (method === 'GET' && path === '/api/v1/parent/notifications') {
        const notifications = await services.container.notificationRepo.findByUser(auth.userId);
        return sendJson(200, successResponse(notifications));
      }

      if (method === 'PATCH' && path.match(/^\/api\/v1\/parent\/notifications\/[^/]+\/read$/)) {
        const notifId = path.split('/')[5];
        const updated = await services.container.notificationRepo.update(notifId, {
          readAt: new Date().toISOString(),
        });
        return sendJson(200, successResponse(updated));
      }

      // --- PARENT AI TRANSPORT ASSISTANT (READ-ONLY CONVERSATIONAL LAYER) ---
      if (method === 'POST' && path === '/api/v1/parent/ai/chat') {
        const body = (await readBody()) as {
          message: string;
          studentId?: string;
          history?: any[];
        };

        if (!body || !body.message || typeof body.message !== 'string') {
          return sendJson(400, errorResponse('BAD_REQUEST', 'Missing required user message string'));
        }

        const aiResponse = await services.parentAssistantService.handleParentMessage({
          parentUserId: auth.userId,
          parentSchoolId: auth.schoolId,
          message: body.message,
          targetStudentId: body.studentId,
          conversationHistory: body.history,
        });

        return sendJson(
          200,
          successResponse({
            response: aiResponse.message,
            childContext: aiResponse.childContext,
            toolsExecuted: aiResponse.toolsExecuted,
            timestamp: new Date().toISOString(),
          })
        );
      }

      // Default Not Found
      return sendJson(404, errorResponse('NOT_FOUND', `Route ${method} ${path} not found`));
    } catch (err: any) {
      logger.error('Unhandled API exception', { error: err.message, stack: err.stack, path, method });
      if (err.message && err.message.startsWith('FORBIDDEN')) {
        return sendJson(403, errorResponse('FORBIDDEN', err.message));
      }
      if (err.message && err.message.startsWith('TENANT_ACCESS_DENIED')) {
        return sendJson(403, errorResponse('TENANT_ACCESS_DENIED', err.message));
      }
      if (err.name === 'ZodError') {
        return sendJson(400, errorResponse('VALIDATION_ERROR', 'Request validation failed', err.errors));
      }
      return sendJson(500, errorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'));
    }
  });

  return server;
}
