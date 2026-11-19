export interface TraccarPosition {
  id?: number;
  attributes?: Record<string, unknown>;
  deviceId?: number | string;
  protocol?: string;
  serverTime?: string;
  deviceTime?: string;
  fixTime?: string;
  outdated?: boolean;
  valid?: boolean;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number; // Knots in Traccar standard or km/h
  course?: number; // Heading 0-360
  address?: string;
  accuracy?: number;
  network?: unknown;
}

export interface TraccarDevice {
  id: number;
  name?: string;
  uniqueId: string; // IMEI or Tracker Hardware Identifier
  status?: string;
  disabled?: boolean;
  lastUpdate?: string;
  positionId?: number;
  attributes?: Record<string, unknown>;
}

export interface TraccarWebhookEvent {
  event?: {
    id?: number;
    type?: string;
    serverTime?: string;
    deviceId?: number;
    positionId?: number;
    geofenceId?: number;
  };
  device?: TraccarDevice;
  position?: TraccarPosition;
}

export interface NotificationOutboxItem {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  status: 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED';
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  sentAt?: string;
}

export interface PlatformSettings {
  schoolId: string;
  schoolName: string;
  gpsFreshnessSeconds: number; // default 60
  gpsStaleSeconds: number; // default 120
  geofenceRadiusMeters: number; // default 75
  mapTileProvider: 'carto-dark' | 'carto-light' | 'osm-standard';
  fcmEnabled: boolean;
  dataRetentionDays: number;
  updatedAt: string;
}

export interface BusMaintenanceRecord {
  id: string;
  busId: string;
  schoolId: string;
  serviceDate: string;
  serviceType: string;
  odometerReading?: number;
  cost?: number;
  notes: string;
  technicianName?: string;
  createdAt: string;
}

export interface StaffProfile {
  id: string;
  userId: string;
  schoolId: string;
  role: 'DRIVER' | 'ATTENDANT';
  name: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  assignedBusId?: string;
  assignedRouteId?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  createdAt: string;
}

export interface ParentLinkRequest {
  parentId: string;
  studentId: string;
  admissionNumber: string;
  verificationCode: string;
  relationship: string;
}
