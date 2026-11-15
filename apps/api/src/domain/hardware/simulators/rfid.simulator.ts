import { NormalizedRFIDEvent } from '../rfid/rfid-adapter';

export type RfidSimulationMode =
  | 'BOARDING'
  | 'EXIT'
  | 'DUPLICATE'
  | 'WRONG_BUS'
  | 'MALFORMED';

export interface RfidSimulationOptions {
  readerHardwareId: string;
  cardToken: string;
  tripId?: string;
  mode?: RfidSimulationMode;
  timestamp?: string;
}

/**
 * Deterministic 13.56 MHz ISO/IEC 14443 RFID Reader Hardware Simulator for Development & Testing.
 * Isolated from production runtime path.
 */
export class RFIDSimulator {
  constructor(private defaultReaderId: string) {}

  public generateScan(options: RfidSimulationOptions): Record<string, unknown> | NormalizedRFIDEvent {
    const readerId = options.readerHardwareId || this.defaultReaderId;
    const mode = options.mode || 'BOARDING';

    switch (mode) {
      case 'MALFORMED':
        return {
          readerHardwareId: readerId,
          cardId: '', // Empty UID
          timestamp: 'corrupted-timestamp',
        };

      case 'DUPLICATE':
      case 'WRONG_BUS':
      case 'EXIT':
      case 'BOARDING':
      default:
        return {
          readerHardwareId: readerId,
          cardToken: options.cardToken.toUpperCase(),
          timestamp: options.timestamp || new Date().toISOString(),
          protocol: 'ISO_14443_A',
          metadata: { simulatedMode: mode },
        };
    }
  }
}
