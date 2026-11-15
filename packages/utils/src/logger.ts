export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'secret',
  'service_role',
  'apikey',
  'cookie',
]);

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export class StructuredLogger {
  private context: Record<string, unknown>;

  constructor(context: Record<string, unknown> = {}) {
    this.context = context;
  }

  public child(extraContext: Record<string, unknown>): StructuredLogger {
    return new StructuredLogger({ ...this.context, ...extraContext });
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(data ? (sanitize(data) as Record<string, unknown>) : {}),
    };
    const output = JSON.stringify(entry);
    if (level === 'ERROR') {
      console.error(output);
    } else if (level === 'WARN') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  public debug(message: string, data?: Record<string, unknown>): void {
    this.log('DEBUG', message, data);
  }

  public info(message: string, data?: Record<string, unknown>): void {
    this.log('INFO', message, data);
  }

  public warn(message: string, data?: Record<string, unknown>): void {
    this.log('WARN', message, data);
  }

  public error(message: string, data?: Record<string, unknown>): void {
    this.log('ERROR', message, data);
  }
}

export const logger = new StructuredLogger({ service: 'school-gps-backend' });
