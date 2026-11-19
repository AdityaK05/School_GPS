import {
  AuthContext,
  Bus,
  GPSDevice,
  RFIDDevice,
  Route,
  Stop,
  Trip,
  TripStudent,
  Student,
  StudentRouteAssignment,
  JourneyEvent,
  JourneyEventResult,
  JourneyException,
  Notification,
} from '@school-transport-platform/shared-types';
import { ApiResponse } from '@school-transport-platform/utils';

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class ApiClient {
  constructor(private config: ApiClientConfig) {}

  public async request<T>(
    endpoint: string,
    options: { method?: string; body?: unknown } = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-Id': `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    const token = this.config.getToken ? this.config.getToken() : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let result: ApiResponse<T>;
    try {
      result = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new ApiClientError(
        `Request failed with HTTP ${response.status}: response was not valid JSON`,
        response.status,
        'INVALID_RESPONSE'
      );
    }

    if (!response.ok || !result.success) {
      const error = 'error' in result ? result.error : undefined;
      const errorMsg = error ? `${error.code}: ${error.message}` : 'Request failed';
      throw new ApiClientError(errorMsg, response.status, error?.code);
    }

    return result.data;
  }

  // Health
  public async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request('/api/v1/health');
  }

  // Auth
  public async getMe(): Promise<AuthContext> {
    return this.request('/api/v1/auth/me');
  }

  // Schools
  public async getSchool(id: string) {
    return this.request(`/api/v1/schools/${id}`);
  }

  // Buses
  public async listBuses(): Promise<Bus[]> {
    return this.request('/api/v1/buses');
  }
  public async createBus(data: { registrationNumber: string; fleetNumber: string; capacity: number }): Promise<Bus> {
    return this.request('/api/v1/buses', { method: 'POST', body: data });
  }

  // Hardware Devices
  public async assignGps(busId: string, deviceId: string): Promise<Bus> {
    return this.request('/api/v1/devices/gps/assign', { method: 'POST', body: { busId, deviceId } });
  }
  public async assignRfid(busId: string, deviceId: string): Promise<Bus> {
    return this.request('/api/v1/devices/rfid/assign', { method: 'POST', body: { busId, deviceId } });
  }
  public async replaceGps(data: { busId: string; oldDeviceId: string; newDeviceId: string; reason: string }): Promise<Bus> {
    return this.request('/api/v1/devices/gps/replace', { method: 'POST', body: data });
  }
  public async replaceRfid(data: { busId: string; oldDeviceId: string; newDeviceId: string; reason: string }): Promise<Bus> {
    return this.request('/api/v1/devices/rfid/replace', { method: 'POST', body: data });
  }
  public async decommissionRfid(data: { deviceId: string; reason: string }): Promise<RFIDDevice> {
    return this.request('/api/v1/devices/rfid/decommission', { method: 'POST', body: data });
  }
  public async getGpsHealth(deviceId: string): Promise<any> {
    return this.request(`/api/v1/devices/gps/${deviceId}/health`);
  }
  public async getRfidHealth(deviceId: string): Promise<any> {
    return this.request(`/api/v1/devices/rfid/${deviceId}/health`);
  }
  public async checkTripGracePeriod(tripId: string, currentTimeMs?: number): Promise<JourneyException[]> {
    return this.request(`/api/v1/trips/${tripId}/check-grace-period`, { method: 'POST', body: { currentTimeMs } });
  }

  // Routes & Stops
  public async createRoute(data: { name: string; code: string; direction: 'MORNING' | 'EVENING' }): Promise<Route> {
    return this.request('/api/v1/routes', { method: 'POST', body: data });
  }
  public async createStop(data: {
    routeId: string;
    name: string;
    latitude: number;
    longitude: number;
    sequence: number;
    geofenceRadiusMeters?: number;
  }): Promise<Stop> {
    return this.request('/api/v1/stops', { method: 'POST', body: data });
  }

  // Trips
  public async createTrip(data: {
    routeId: string;
    busId: string;
    tripDate: string;
    direction: 'MORNING' | 'EVENING';
  }): Promise<Trip> {
    return this.request('/api/v1/trips', { method: 'POST', body: data });
  }
  public async startTrip(tripId: string): Promise<Trip> {
    return this.request(`/api/v1/trips/${tripId}/start`, { method: 'POST' });
  }
  public async completeTrip(tripId: string): Promise<Trip> {
    return this.request(`/api/v1/trips/${tripId}/complete`, { method: 'POST' });
  }
  public async getTripManifest(tripId: string): Promise<TripStudent[]> {
    return this.request(`/api/v1/trips/${tripId}/manifest`);
  }

  // Students & Assignments
  public async getStudents(): Promise<Student[]> {
    return this.request('/api/v1/students');
  }
  public async assignStudentCard(studentId: string, cardId: string): Promise<Student> {
    return this.request(`/api/v1/students/${studentId}/card`, { method: 'POST', body: { cardId } });
  }
  public async createStudent(data: {
    admissionNumber: string;
    firstName: string;
    lastName: string;
    className?: string;
    section?: string;
    rfidCardId?: string;
  }): Promise<Student> {
    return this.request('/api/v1/students', { method: 'POST', body: data });
  }
  public async assignStudentRoute(data: {
    studentId: string;
    routeId: string;
    stopId: string;
    effectiveFrom: string;
  }): Promise<StudentRouteAssignment> {
    return this.request('/api/v1/assignments', { method: 'POST', body: data });
  }

  // Journey Events
  public async ingestJourneyEvent(data: Partial<JourneyEvent>): Promise<JourneyEventResult> {
    return this.request('/api/v1/journey-events', { method: 'POST', body: data });
  }
  public async batchSyncEvents(
    deviceId: string,
    events: Partial<JourneyEvent>[]
  ): Promise<{ accepted: string[]; rejected: Array<{ idempotencyKey: string; error: string }> }> {
    return this.request('/api/v1/journey-events/batch', { method: 'POST', body: { deviceId, events } });
  }

  // RFID & GPS
  public async scanRfid(data: {
    cardId: string;
    readerHardwareId: string;
    tripId?: string;
    timestamp?: string;
    idempotencyKey?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<JourneyEventResult> {
    return this.request('/api/v1/rfid/scan', { method: 'POST', body: data });
  }
  public async ingestGps(data: {
    deviceId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    recordedAt: string;
  }): Promise<{ locationId: string; busId: string; stale: boolean; stopReached?: string }> {
    return this.request('/api/v1/gps/events', { method: 'POST', body: data });
  }

  // Manual Attendance Override
  public async executeManualOverride(data: {
    studentId: string;
    tripId: string;
    newStatus: 'BOARDED' | 'EXIT_RECORDED' | 'COMPLETED';
    reason: string;
    stopId?: string;
  }): Promise<{ success: boolean; overrideEventId: string; previousState: string; newState: string }> {
    return this.request('/api/v1/manual-override', { method: 'POST', body: data });
  }

  // Exceptions
  public async getExceptions(): Promise<JourneyException[]> {
    return this.request('/api/v1/exceptions');
  }
  public async resolveException(exceptionId: string, reason: string): Promise<JourneyException> {
    return this.request(`/api/v1/exceptions/${exceptionId}/resolve`, { method: 'POST', body: { reason } });
  }

  // Audit Logs
  public async getAuditLogs(): Promise<any[]> {
    return this.request('/api/v1/audit-logs');
  }

  // Dashboard Overview
  public async getDashboardOverview(): Promise<{
    activeBuses: number;
    totalBuses: number;
    totalStudents: number;
    accountedStudents: number;
    manifestStudents: number;
    studentsOnboard: number;
    openExceptions: number;
    recentIncidents: JourneyException[];
  }> {
    return this.request('/api/v1/dashboard/overview');
  }

  // Parent & Guardian Experience
  public async getParentChildren(): Promise<any[]> {
    return this.request('/api/v1/parent/children');
  }

  public async getChildJourneyDetails(studentId: string): Promise<any> {
    return this.request(`/api/v1/parent/children/${studentId}/journey`);
  }

  public async getChildJourneyHistory(studentId: string): Promise<any[]> {
    return this.request(`/api/v1/parent/children/${studentId}/history`);
  }

  public async getParentNotifications(): Promise<Notification[]> {
    return this.request('/api/v1/parent/notifications');
  }

  public async markNotificationRead(id: string): Promise<Notification> {
    return this.request(`/api/v1/parent/notifications/${id}/read`, { method: 'PATCH' });
  }

  // Extended Bus & Fleet Management
  public async getBusDetails(busId: string): Promise<any> {
    return this.request(`/api/v1/buses/${busId}`);
  }
  public async updateBus(busId: string, data: any): Promise<Bus> {
    return this.request(`/api/v1/buses/${busId}`, { method: 'PATCH', body: data });
  }
  public async deleteBus(busId: string): Promise<any> {
    return this.request(`/api/v1/buses/${busId}`, { method: 'DELETE' });
  }
  public async getBusMaintenance(busId: string): Promise<any[]> {
    return this.request(`/api/v1/buses/${busId}/maintenance`);
  }
  public async createBusMaintenance(data: any): Promise<any> {
    return this.request(`/api/v1/buses/${data.busId}/maintenance`, { method: 'POST', body: data });
  }

  // Extended GPS Device Management
  public async listGpsDevices(): Promise<GPSDevice[]> {
    return this.request('/api/v1/devices/gps');
  }
  public async registerGpsDevice(data: { imei: string; busId: string; provider?: string }): Promise<GPSDevice> {
    return this.request('/api/v1/devices/gps', { method: 'POST', body: data });
  }
  public async deleteGpsDevice(id: string): Promise<any> {
    return this.request(`/api/v1/devices/gps/${id}`, { method: 'DELETE' });
  }

  // Extended Routes & Stops
  public async listRoutes(): Promise<any[]> {
    return this.request('/api/v1/routes');
  }
  public async getRoute(id: string): Promise<any> {
    return this.request(`/api/v1/routes/${id}`);
  }
  public async updateRoute(id: string, data: any): Promise<Route> {
    return this.request(`/api/v1/routes/${id}`, { method: 'PATCH', body: data });
  }
  public async deleteRoute(id: string): Promise<any> {
    return this.request(`/api/v1/routes/${id}`, { method: 'DELETE' });
  }
  public async listStops(routeId?: string): Promise<Stop[]> {
    return this.request(routeId ? `/api/v1/stops?routeId=${routeId}` : '/api/v1/stops');
  }
  public async updateStop(id: string, data: any): Promise<Stop> {
    return this.request(`/api/v1/stops/${id}`, { method: 'PATCH', body: data });
  }
  public async deleteStop(id: string): Promise<any> {
    return this.request(`/api/v1/stops/${id}`, { method: 'DELETE' });
  }

  // Extended Trips
  public async listTrips(date?: string): Promise<any[]> {
    return this.request(date ? `/api/v1/trips?date=${date}` : '/api/v1/trips');
  }
  public async listJourneys(date?: string): Promise<any[]> {
    return this.request(date ? `/api/v1/journeys?date=${date}` : '/api/v1/journeys');
  }
  public async getTrip(id: string): Promise<any> {
    return this.request(`/api/v1/trips/${id}`);
  }
  public async cancelTrip(id: string): Promise<Trip> {
    return this.request(`/api/v1/trips/${id}/cancel`, { method: 'POST' });
  }
  public async delayTrip(id: string): Promise<Trip> {
    return this.request(`/api/v1/trips/${id}/delay`, { method: 'POST' });
  }

  // Staff Management (Drivers & Attendants)
  public async listStaff(): Promise<any[]> {
    return this.request('/api/v1/staff');
  }
  public async createStaff(data: any): Promise<any> {
    return this.request('/api/v1/staff', { method: 'POST', body: data });
  }
  public async updateStaff(id: string, data: any): Promise<any> {
    return this.request(`/api/v1/staff/${id}`, { method: 'PATCH', body: data });
  }
  public async deleteStaff(id: string): Promise<any> {
    return this.request(`/api/v1/staff/${id}`, { method: 'DELETE' });
  }

  // Notifications Outbox & Announcements
  public async getOutboxNotifications(): Promise<any[]> {
    return this.request('/api/v1/notifications/outbox');
  }
  public async retryOutboxNotifications(): Promise<any> {
    return this.request('/api/v1/notifications/outbox/retry', { method: 'POST' });
  }
  public async broadcastAnnouncement(data: { title: string; body: string }): Promise<any> {
    return this.request('/api/v1/notifications/broadcast', { method: 'POST', body: data });
  }

  // Reports & Analytics
  public async getReportsSummary(): Promise<any> {
    return this.request('/api/v1/reports/summary');
  }

  // Platform Settings
  public async getPlatformSettings(): Promise<any> {
    return this.request('/api/v1/settings');
  }
  public async updatePlatformSettings(data: any): Promise<any> {
    return this.request('/api/v1/settings', { method: 'PATCH', body: data });
  }

  // Parent Auth & Linking
  public async requestParentOtp(identifier: string): Promise<any> {
    return this.request('/api/v1/parent/auth/request-otp', { method: 'POST', body: { identifier } });
  }
  public async verifyParentOtp(identifier: string, otp: string): Promise<any> {
    return this.request('/api/v1/parent/auth/verify-otp', { method: 'POST', body: { identifier, otp } });
  }
  public async linkParentStudent(data: { admissionNumber: string; invitationCode: string; relationship?: string }): Promise<any> {
    return this.request('/api/v1/parent/link-student', { method: 'POST', body: data });
  }
}
