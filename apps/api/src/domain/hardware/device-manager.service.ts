import {
  GPSDevice,
  RFIDDevice,
  Bus,
} from '@school-transport-platform/shared-types';
import { THRESHOLDS } from '@school-transport-platform/constants';
import { IDeviceRepository, IBusRepository } from '../../repositories/interfaces';
import { AuditService } from '../audit/audit.service';
import crypto from 'crypto';

export interface GpsHealthReport {
  deviceId: string;
  busId: string;
  provider: string;
  status: 'LIVE' | 'STALE' | 'UNAVAILABLE';
  lastSeenAt?: string;
  freshnessAgeSeconds?: number;
  isStale: boolean;
  isOnline: boolean;
}

export interface RfidHealthReport {
  deviceId: string;
  busId: string;
  readerHardwareId?: string;
  protocol: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DECOMMISSIONED';
  activatedAt?: string;
  decommissionedAt?: string;
  isHealthy: boolean;
}

export class DeviceManagementService {
  constructor(
    private deviceRepo: IDeviceRepository,
    private busRepo: IBusRepository,
    private auditService: AuditService
  ) {}

  // ==========================================
  // GPS DEVICE LIFECYCLE
  // ==========================================

  public async registerGpsDevice(params: {
    schoolId: string;
    busId: string;
    provider: string;
    externalDeviceId: string;
    actorUserId?: string;
  }): Promise<GPSDevice> {
    const existing = await this.deviceRepo.findGpsByExternalId(params.externalDeviceId);
    if (existing) {
      throw new Error(`GPS device with external ID ${params.externalDeviceId} already registered`);
    }

    const device: GPSDevice = {
      id: crypto.randomUUID(),
      busId: params.busId,
      schoolId: params.schoolId,
      provider: params.provider,
      externalDeviceId: params.externalDeviceId,
      status: 'UNKNOWN',
      createdAt: new Date().toISOString(),
    };

    const created = await this.deviceRepo.createGps(device);

    await this.auditService.log(
      params.schoolId,
      params.actorUserId,
      'GPS_DEVICE_REGISTERED',
      'gps_devices',
      created.id,
      undefined,
      { externalDeviceId: params.externalDeviceId, busId: params.busId },
      `Registered GPS device ${params.externalDeviceId} for bus ${params.busId}`
    );

    return created;
  }

  public async assignGpsToBus(
    busId: string,
    deviceId: string,
    actorUserId?: string
  ): Promise<Bus> {
    const bus = await this.busRepo.findById(busId);
    if (!bus) throw new Error(`Bus ${busId} not found`);

    const device = await this.deviceRepo.findGpsById(deviceId);
    if (!device) throw new Error(`GPS device ${deviceId} not found`);

    // Deactivate previous active GPS device on this bus if different
    const previousDeviceId = bus.activeGpsDeviceId;
    if (previousDeviceId && previousDeviceId !== deviceId) {
      await this.deviceRepo.updateGps(previousDeviceId, { status: 'OFFLINE' });
    }

    // Link device to bus
    await this.deviceRepo.updateGps(deviceId, { busId, status: 'ONLINE' });
    const updatedBus = await this.busRepo.update(busId, { activeGpsDeviceId: deviceId });

    await this.auditService.log(
      bus.schoolId,
      actorUserId,
      'BUS_GPS_ASSIGNED',
      'buses',
      busId,
      { previousGpsDeviceId: previousDeviceId },
      { newGpsDeviceId: deviceId },
      `Assigned GPS device ${device.externalDeviceId} to bus ${bus.registrationNumber}`
    );

    return updatedBus;
  }

  public async replaceGpsDevice(params: {
    busId: string;
    oldDeviceId: string;
    newDeviceId: string;
    reason: string;
    actorUserId?: string;
  }): Promise<Bus> {
    const bus = await this.busRepo.findById(params.busId);
    if (!bus) throw new Error(`Bus ${params.busId} not found`);

    const oldDevice = await this.deviceRepo.findGpsById(params.oldDeviceId);
    const newDevice = await this.deviceRepo.findGpsById(params.newDeviceId);
    if (!newDevice) throw new Error(`New GPS device ${params.newDeviceId} not found`);

    // Deactivate old device - RETAINING historical location rows
    if (oldDevice) {
      await this.deviceRepo.updateGps(oldDevice.id, { status: 'OFFLINE' });
    }

    // Activate new device
    await this.deviceRepo.updateGps(newDevice.id, { busId: params.busId, status: 'ONLINE' });
    const updatedBus = await this.busRepo.update(params.busId, { activeGpsDeviceId: newDevice.id });

    await this.auditService.log(
      bus.schoolId,
      params.actorUserId,
      'GPS_DEVICE_REPLACED',
      'buses',
      params.busId,
      { oldDeviceId: params.oldDeviceId },
      { newDeviceId: params.newDeviceId },
      `Replaced GPS device on bus ${bus.registrationNumber}: ${params.reason}`
    );

    return updatedBus;
  }

  public async inspectGpsHealth(deviceId: string): Promise<GpsHealthReport> {
    const device = await this.deviceRepo.findGpsById(deviceId);
    if (!device) throw new Error(`GPS device ${deviceId} not found`);

    let freshnessAgeSeconds: number | undefined;
    let isStale = false;
    let computedStatus: 'LIVE' | 'STALE' | 'UNAVAILABLE' = 'UNAVAILABLE';

    if (device.lastSeenAt) {
      freshnessAgeSeconds = (Date.now() - new Date(device.lastSeenAt).getTime()) / 1000;
      isStale = freshnessAgeSeconds > THRESHOLDS.GPS_FRESHNESS_SECONDS;
      computedStatus = isStale ? 'STALE' : 'LIVE';
    }

    return {
      deviceId: device.id,
      busId: device.busId,
      provider: device.provider,
      status: computedStatus,
      lastSeenAt: device.lastSeenAt,
      freshnessAgeSeconds,
      isStale,
      isOnline: device.status === 'ONLINE' && !isStale,
    };
  }

  // ==========================================
  // RFID DEVICE LIFECYCLE (ENFORCING 1 ACTIVE PER BUS)
  // ==========================================

  public async registerRfidDevice(params: {
    schoolId: string;
    busId: string;
    readerHardwareId: string;
    protocol?: 'ISO_14443_A' | 'ISO_14443_B' | 'OTHER';
    hardwareModel?: string;
    actorUserId?: string;
  }): Promise<RFIDDevice> {
    const existing = await this.deviceRepo.findRfidByReaderId(params.readerHardwareId);
    if (existing) {
      throw new Error(`RFID reader ${params.readerHardwareId} already registered`);
    }

    const device: RFIDDevice = {
      id: crypto.randomUUID(),
      busId: params.busId,
      schoolId: params.schoolId,
      readerHardwareId: params.readerHardwareId,
      protocol: params.protocol || 'ISO_14443_A',
      hardwareModel: params.hardwareModel || 'ISO_14443_COMPLIANT',
      status: 'INACTIVE', // Registered in inactive state until explicitly activated
      createdAt: new Date().toISOString(),
    };

    const created = await this.deviceRepo.createRfid(device);

    await this.auditService.log(
      params.schoolId,
      params.actorUserId,
      'RFID_DEVICE_REGISTERED',
      'rfid_devices',
      created.id,
      undefined,
      { readerHardwareId: params.readerHardwareId, busId: params.busId },
      `Registered RFID device ${params.readerHardwareId} for bus ${params.busId}`
    );

    return created;
  }

  public async assignRfidToBus(
    busId: string,
    deviceId: string,
    actorUserId?: string
  ): Promise<Bus> {
    const bus = await this.busRepo.findById(busId);
    if (!bus) throw new Error(`Bus ${busId} not found`);

    const device = await this.deviceRepo.findRfidById(deviceId);
    if (!device) throw new Error(`RFID device ${deviceId} not found`);

    // Enforce Rule: Only one ACTIVE RFID reader per bus (ADR-10)
    const existingActive = await this.deviceRepo.findRfidByBus(busId);
    if (existingActive && existingActive.id !== deviceId) {
      // Deactivate the previous device
      await this.deviceRepo.updateRfid(existingActive.id, {
        status: 'INACTIVE',
      });
    }

    // Activate the target RFID reader
    await this.deviceRepo.updateRfid(deviceId, {
      busId,
      status: 'ACTIVE',
      activatedAt: new Date().toISOString(),
    });

    const updatedBus = await this.busRepo.update(busId, { activeRfidDeviceId: deviceId });

    await this.auditService.log(
      bus.schoolId,
      actorUserId,
      'BUS_RFID_ASSIGNED',
      'buses',
      busId,
      { previousRfidDeviceId: existingActive?.id },
      { newRfidDeviceId: deviceId },
      `Assigned active RFID reader ${device.readerHardwareId} to bus ${bus.registrationNumber}`
    );

    return updatedBus;
  }

  public async replaceRfidDevice(params: {
    busId: string;
    oldDeviceId: string;
    newDeviceId: string;
    reason: string;
    actorUserId?: string;
  }): Promise<Bus> {
    const bus = await this.busRepo.findById(params.busId);
    if (!bus) throw new Error(`Bus ${params.busId} not found`);

    const oldDevice = await this.deviceRepo.findRfidById(params.oldDeviceId);
    const newDevice = await this.deviceRepo.findRfidById(params.newDeviceId);
    if (!newDevice) throw new Error(`New RFID reader ${params.newDeviceId} not found`);

    // Deactivate old device, preserving historical scan audit records
    if (oldDevice) {
      await this.deviceRepo.updateRfid(oldDevice.id, {
        status: 'DECOMMISSIONED',
        decommissionedAt: new Date().toISOString(),
      });
    }

    // Activate new device
    await this.deviceRepo.updateRfid(newDevice.id, {
      busId: params.busId,
      status: 'ACTIVE',
      activatedAt: new Date().toISOString(),
    });

    const updatedBus = await this.busRepo.update(params.busId, { activeRfidDeviceId: newDevice.id });

    await this.auditService.log(
      bus.schoolId,
      params.actorUserId,
      'RFID_DEVICE_REPLACED',
      'buses',
      params.busId,
      { oldDeviceId: params.oldDeviceId },
      { newDeviceId: params.newDeviceId },
      `Replaced RFID device on bus ${bus.registrationNumber}: ${params.reason}`
    );

    return updatedBus;
  }

  public async decommissionRfidDevice(
    deviceId: string,
    reason: string,
    actorUserId?: string
  ): Promise<RFIDDevice> {
    const device = await this.deviceRepo.findRfidById(deviceId);
    if (!device) throw new Error(`RFID device ${deviceId} not found`);

    const updated = await this.deviceRepo.updateRfid(deviceId, {
      status: 'DECOMMISSIONED',
      decommissionedAt: new Date().toISOString(),
    });

    await this.auditService.log(
      device.schoolId,
      actorUserId,
      'RFID_DEVICE_DECOMMISSIONED',
      'rfid_devices',
      deviceId,
      { previousStatus: device.status },
      { status: 'DECOMMISSIONED' },
      `Decommissioned RFID reader ${device.readerHardwareId}: ${reason}`
    );

    return updated;
  }

  public async inspectRfidHealth(deviceId: string): Promise<RfidHealthReport> {
    const device = await this.deviceRepo.findRfidById(deviceId);
    if (!device) throw new Error(`RFID device ${deviceId} not found`);

    return {
      deviceId: device.id,
      busId: device.busId,
      readerHardwareId: device.readerHardwareId,
      protocol: device.protocol,
      status: device.status,
      activatedAt: device.activatedAt,
      decommissionedAt: device.decommissionedAt,
      isHealthy: device.status === 'ACTIVE',
    };
  }
}
