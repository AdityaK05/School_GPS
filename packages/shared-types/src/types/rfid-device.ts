export interface RFIDDevice {
  id: string;

  busId: string;
  schoolId: string;

  /**
   * Hardware model/vendor identifier (e.g. "ACR122U", "NFC-X1").
   * Does not affect domain logic; used for device management and audit.
   */
  hardwareModel?: string;

  /**
   * Reader hardware identity/serial number used by reader adapter
   */
  readerHardwareId?: string;

  /**
   * Protocol standard: ISO/IEC 14443-A/B (13.56 MHz HF RFID).
   * MVP target. Adapter layer handles protocol-specific communication.
   */
  protocol: "ISO_14443_A" | "ISO_14443_B" | "OTHER";

  status: "ACTIVE" | "INACTIVE" | "DECOMMISSIONED";

  serialNumber?: string;

  activatedAt?: string;
  decommissionedAt?: string;

  createdAt: string;
}
