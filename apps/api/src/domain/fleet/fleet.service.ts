import { Bus, GPSDevice, RFIDDevice } from '@school-transport-platform/shared-types';
import { IBusRepository, IDeviceRepository } from '../../repositories/interfaces';
import { AuditService } from '../audit/audit.service';
import crypto from 'crypto';

export class FleetService {
  constructor(
    private busRepo: IBusRepository,
    private deviceRepo: IDeviceRepository,
    private auditService: AuditService
  ) {}

  public async createBus(params: {
    schoolId: string;
    registrationNumber: string;
    fleetNumber: string;
    capacity: number;
  }): Promise<Bus> {
    const bus: Bus = {
      id: crypto.randomUUID(),
      schoolId: params.schoolId,
      registrationNumber: params.registrationNumber,
      fleetNumber: params.fleetNumber,
      capacity: params.capacity,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return await this.busRepo.create(bus);
  }

  public async assignGpsDevice(
    busId: string,
    deviceId: string,
    actorUserId?: string
  ): Promise<Bus> {
    const bus = await this.busRepo.findById(busId);
    if (!bus) throw new Error(`Bus ${busId} not found`);

    const device = await this.deviceRepo.findGpsById(deviceId);
    if (!device) throw new Error(`GPS Device ${deviceId} not found`);

    const previousGps = bus.activeGpsDeviceId;
    await this.deviceRepo.updateGps(deviceId, { busId, status: 'ONLINE' });
    const updatedBus = await this.busRepo.update(busId, { activeGpsDeviceId: deviceId });

    await this.auditService.log(
      bus.schoolId,
      actorUserId,
      'GPS_DEVICE_ASSIGNED',
      'buses',
      busId,
      { activeGpsDeviceId: previousGps },
      { activeGpsDeviceId: deviceId },
      `Assigned GPS device ${deviceId} to bus ${bus.registrationNumber}`
    );

    return updatedBus;
  }

  public async assignRfidDevice(
    busId: string,
    deviceId: string,
    actorUserId?: string
  ): Promise<Bus> {
    const bus = await this.busRepo.findById(busId);
    if (!bus) throw new Error(`Bus ${busId} not found`);

    const device = await this.deviceRepo.findRfidById(deviceId);
    if (!device) throw new Error(`RFID Device ${deviceId} not found`);

    // Deactivate existing active RFID reader on this bus to preserve ADR-10 (1 active per bus)
    const existingActive = await this.deviceRepo.findRfidByBus(busId);
    if (existingActive && existingActive.id !== deviceId) {
      await this.deviceRepo.updateRfid(existingActive.id, { status: 'DECOMMISSIONED' });
    }

    await this.deviceRepo.updateRfid(deviceId, { busId, status: 'ACTIVE' });
    const updatedBus = await this.busRepo.update(busId, { activeRfidDeviceId: deviceId });

    await this.auditService.log(
      bus.schoolId,
      actorUserId,
      'RFID_DEVICE_ASSIGNED',
      'buses',
      busId,
      { activeRfidDeviceId: existingActive?.id },
      { activeRfidDeviceId: deviceId },
      `Assigned RFID device ${deviceId} to bus ${bus.registrationNumber}`
    );

    return updatedBus;
  }
}
