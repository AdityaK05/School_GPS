import { afterEach, describe, expect, it, vi } from 'vitest';
import { PreviewDemoApiClient } from '../apps/admin-web/src/demo-api-client';

describe('Vercel preview demo API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serves synthetic admin records without making network requests', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const client = new PreviewDemoApiClient({
      baseUrl: 'https://school-gps-api.onrender.com',
      getToken: () => 'must-not-be-sent',
    });

    const [students, buses, journeys] = await Promise.all([
      client.getStudents(),
      client.listBuses(),
      client.listJourneys(),
    ]);

    expect(students).toHaveLength(3);
    expect(students[0].admissionNumber).toBe('DEMO-2026-001');
    expect(buses[0].fleetNumber).toBe('DEMO-BUS-12');
    expect(journeys[0].student.id).toBe(students[0].id);
    expect(journeys[0].boardingStatus).toBe('BOARDED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects operational writes rather than forwarding them to an API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const client = new PreviewDemoApiClient({ baseUrl: 'https://production.example' });

    await expect(
      client.createBus({ registrationNumber: 'DEMO-00-999', fleetNumber: 'DEMO-BUS-99', capacity: 20 })
    ).rejects.toMatchObject({ code: 'DEMO_READ_ONLY' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
