export interface NormalizedRFIDEvent {
  readerHardwareId: string;
  cardToken: string; // Opaque token UID - never raw student PII
  timestamp: string; // Hardware tap timestamp
  protocol: 'ISO_14443_A' | 'ISO_14443_B' | 'OTHER';
  metadata?: Record<string, unknown>;
}

export interface IRFIDAdapter {
  readonly protocol: 'ISO_14443_A' | 'ISO_14443_B' | 'OTHER';
  normalize(rawPayload: unknown): NormalizedRFIDEvent;
}

/**
 * Standard 13.56 MHz ISO/IEC 14443 Contactless RFID / NFC Hardware Adapter (ADR-9).
 * Parses hardware scans from onboard bus readers (e.g. ACR122U, PN532, RC522).
 */
export class Iso14443RfidAdapter implements IRFIDAdapter {
  readonly protocol = 'ISO_14443_A' as const;

  public normalize(rawPayload: unknown): NormalizedRFIDEvent {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('MALFORMED_RFID_PAYLOAD: Raw payload must be an object');
    }

    const data = rawPayload as Record<string, unknown>;

    // Enforce reader hardware identifier
    const readerHardwareId = String(
      data.readerHardwareId || data.readerId || data.reader_id || data.device_id || ''
    ).trim();
    if (!readerHardwareId) {
      throw new Error('MALFORMED_RFID_PAYLOAD: Missing readerHardwareId');
    }

    // Extract opaque UID (hex or formatted token)
    const rawCardId = String(data.cardId || data.uid || data.cardToken || data.tag_id || '').trim();
    if (!rawCardId) {
      throw new Error('MALFORMED_RFID_PAYLOAD: Missing card identifier / UID token');
    }

    // Reject biometrics if mistakenly attempted
    if (data.biometric || data.fingerprint || data.facial_encoding) {
      throw new Error('SECURITY_VIOLATION: Biometric data prohibited in transport platform');
    }

    // Normalize UID to uppercase canonical token representation
    const cardToken = rawCardId.toUpperCase();

    // Timestamp handling
    const rawTs = data.timestamp || data.scan_time;
    let timestamp: string;
    if (rawTs) {
      const parsed = new Date(String(rawTs));
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`MALFORMED_RFID_PAYLOAD: Invalid scan timestamp: ${rawTs}`);
      }
      timestamp = parsed.toISOString();
    } else {
      timestamp = new Date().toISOString();
    }

    const protocolType = data.protocol === 'ISO_14443_B' ? 'ISO_14443_B' : 'ISO_14443_A';

    return {
      readerHardwareId,
      cardToken,
      timestamp,
      protocol: protocolType,
      metadata: {
        frequency: '13.56 MHz',
        bitRate: data.bitRate || '106 kbps',
        antennaId: data.antennaId,
      },
    };
  }
}

/**
 * Generic Webhook / USB Scanner JSON RFID Adapter.
 */
export class GenericJsonRfidAdapter implements IRFIDAdapter {
  readonly protocol = 'ISO_14443_A' as const;

  public normalize(rawPayload: unknown): NormalizedRFIDEvent {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('MALFORMED_RFID_PAYLOAD: Payload must be an object');
    }

    const data = rawPayload as Record<string, unknown>;
    const readerHardwareId = String(data.readerHardwareId || data.deviceId || '').trim();
    const cardToken = String(data.cardId || data.token || '').trim().toUpperCase();

    if (!readerHardwareId || !cardToken) {
      throw new Error('MALFORMED_RFID_PAYLOAD: Reader ID and Card ID are required');
    }

    return {
      readerHardwareId,
      cardToken,
      timestamp: data.timestamp ? new Date(String(data.timestamp)).toISOString() : new Date().toISOString(),
      protocol: 'ISO_14443_A',
      metadata: { source: 'WEBHOOK' },
    };
  }
}
