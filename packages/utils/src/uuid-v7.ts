function getRandomBytes(length: number): Uint8Array {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const arr = new Uint8Array(length);
    globalThis.crypto.getRandomValues(arr);
    return arr;
  }
  const arr = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Generates an RFC 9562 compliant UUID v7.
 * Uses 48-bit Unix timestamp in milliseconds for time-ordering (ADR-6).
 * Fully isomorphic (runs identically in Node.js, Web Browsers, and Mobile/React Native).
 */
export function generateUuidV7(timestampMs: number = Date.now()): string {
  const bytes = getRandomBytes(16);

  // Set 48-bit timestamp (bytes 0-5)
  bytes[0] = Math.floor(timestampMs / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(timestampMs / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(timestampMs / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(timestampMs / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(timestampMs / 2 ** 8) & 0xff;
  bytes[5] = timestampMs & 0xff;

  // Set version to 7 (byte 6: bits 4-7 = 0111)
  bytes[6] = (bytes[6] & 0x0f) | 0x70;

  // Set variant to RFC 4122 (byte 8: bits 6-7 = 10)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytesToHex(bytes);
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

/**
 * Validates whether a string is a valid UUID v7.
 */
export function isValidUuidV7(id: string): boolean {
  const uuidV7Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV7Regex.test(id);
}

/**
 * Extracts the Unix timestamp in milliseconds from a UUID v7.
 */
export function getTimestampFromUuidV7(id: string): number | null {
  if (!isValidUuidV7(id)) return null;
  const hex = id.replace(/-/g, '').substring(0, 12);
  return parseInt(hex, 16);
}
