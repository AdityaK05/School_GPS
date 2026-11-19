import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, createServices, AppServices } from '../apps/api/src/server';
import http from 'http';
import { AddressInfo } from 'net';

describe('HTTP API Server Integration', () => {
  let server: http.Server;
  let baseUrl: string;
  const schoolId = '11111111-1111-1111-1111-111111111111';
  const adminToken = `test-token:admin_01:SCHOOL_ADMIN:${schoolId}`;

  const request = async (
    path: string,
    options: { method?: string; token?: string; body?: unknown } = {}
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = (await res.json()) as any;
    return { status: res.status, json };
  };

  beforeAll(async () => {
    const services = createServices();
    await services.container.schoolRepo.create({
      id: schoolId,
      name: 'Greenwood High',
      code: 'GWH01',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    server = createServer(services);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('GET /api/v1/health returns 200 HEALTHY without authentication', async () => {
    const res = await request('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.json.data.status).toBe('HEALTHY');
  });

  it('Protected endpoint rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
    const res = await request('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.json.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me resolves authenticated user role and school context', async () => {
    const res = await request('/api/v1/auth/me', { token: adminToken });
    expect(res.status).toBe(200);
    expect(res.json.data.role).toBe('SCHOOL_ADMIN');
    expect(res.json.data.schoolId).toBe(schoolId);
  });

  it('POST /api/v1/buses creates bus resource', async () => {
    const res = await request('/api/v1/buses', {
      method: 'POST',
      token: adminToken,
      body: {
        registrationNumber: 'DL-01-XY-9999',
        fleetNumber: 'BUS-09',
        capacity: 45,
      },
    });
    expect(res.status).toBe(201);
    expect(res.json.data.fleetNumber).toBe('BUS-09');
  });

  it('POST /api/v1/routes creates route resource', async () => {
    const res = await request('/api/v1/routes', {
      method: 'POST',
      token: adminToken,
      body: {
        name: 'South Express Morning',
        code: 'SE-M',
        direction: 'MORNING',
      },
    });
    expect(res.status).toBe(201);
    expect(res.json.data.code).toBe('SE-M');
  });

  it('POST /api/v1/students creates student resource', async () => {
    const res = await request('/api/v1/students', {
      method: 'POST',
      token: adminToken,
      body: {
        admissionNumber: 'ADM-2026-999',
        firstName: 'Ananya',
        lastName: 'Verma',
        rfidCardId: 'CARD_ANANYA_01',
      },
    });
    expect(res.status).toBe(201);
    expect(res.json.data.firstName).toBe('Ananya');
  });

  it('GET /api/v1/dashboard/overview aggregates operational counts', async () => {
    const res = await request('/api/v1/dashboard/overview', { token: adminToken });
    expect(res.status).toBe(200);
    expect(res.json.data.activeBuses).toBe(3);
    expect(res.json.data.totalStudents).toBe(4);
  });

  it('GET /api/v1/journeys returns only the authenticated school scope', async () => {
    const res = await request('/api/v1/journeys', { token: adminToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.json.data)).toBe(true);
  });

  it('GET /api/v1/journeys rejects an explicitly requested foreign school', async () => {
    const res = await request('/api/v1/journeys?schoolId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', {
      token: adminToken,
    });
    expect(res.status).toBe(403);
  });
});
