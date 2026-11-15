export interface RFIDScanPayload {
  cardId: string;
  deviceId: string;
  timestamp: string;
}

/**
 * Adapter interface encapsulating vendor/hardware RFID reader specifics (ADR-9).
 * Converts 13.56 MHz ISO/IEC 14443 contactless hardware scans into canonical RFIDScanPayload.
 */
export interface IRFIDReaderAdapter {
  parseRawScan(rawPayload: unknown): RFIDScanPayload;
}

export class StandardRFIDReaderAdapter implements IRFIDReaderAdapter {
  public parseRawScan(rawPayload: unknown): RFIDScanPayload {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('Invalid raw RFID payload format');
    }
    const data = rawPayload as Record<string, unknown>;
    return {
      cardId: String(data.cardId || data.uid || data.tag_id),
      deviceId: String(data.deviceId || data.reader_id),
      timestamp: String(data.timestamp || new Date().toISOString()),
    };
  }
}
