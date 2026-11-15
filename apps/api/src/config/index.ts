import dotenv from 'dotenv';
import { ConfigSchema, AppConfig } from '@school-transport-platform/validation';

dotenv.config();

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const result = ConfigSchema.safeParse(env);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    console.error('CRITICAL: Backend configuration validation failed:\n' + errorDetails);
    throw new Error('Invalid backend configuration. Halting startup.');
  }
  return result.data;
}

export const config = loadConfig(process.env);
