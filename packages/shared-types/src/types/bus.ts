export interface Bus {
  id: string;
  schoolId: string;

  registrationNumber: string;
  fleetNumber: string;

  capacity: number;

  status:
    | "ACTIVE"
    | "MAINTENANCE"
    | "INACTIVE";

  activeGpsDeviceId?: string;
  activeRfidDeviceId?: string;

  createdAt: string;
  updatedAt: string;
}