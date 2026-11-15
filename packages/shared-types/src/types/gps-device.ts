export interface GPSDevice {
  id: string;

  busId: string;
  schoolId?: string;

  provider: string;
  externalDeviceId: string;

  status:
    | "ONLINE"
    | "OFFLINE"
    | "UNKNOWN";

  lastSeenAt?: string;

  createdAt: string;
}
