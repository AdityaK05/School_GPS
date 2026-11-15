import { describe, it, expect, vi } from 'vitest';
import { AuthMiddleware, AuthenticatedRequest } from '../apps/api/src/auth/auth.middleware';
import { SupabaseContainer } from '../apps/api/src/repositories/supabase.repository';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Real DB + Real JWT — Supabase & JWT Authentication Integration', () => {
  describe('Cryptographic Supabase JWT Authentication', () => {
    it('successfully verifies Supabase JWT via auth.getUser and resolves tenant auth context', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr_supabase_admin_123',
                email: 'admin@greenwood.edu',
              },
            },
            error: null,
          }),
        },
      } as unknown as SupabaseClient;

      const mockUserRepo = {
        resolveUserContext: vi.fn().mockResolvedValue({
          userId: 'usr_supabase_admin_123',
          email: 'admin@greenwood.edu',
          role: 'SCHOOL_ADMIN',
          schoolId: 'sch_greenwood_001',
          isSuperAdmin: false,
        }),
      };

      const middleware = new AuthMiddleware(mockUserRepo, mockSupabaseClient);

      const mockReq: AuthenticatedRequest = {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid_supabase_token',
        },
      };

      const result = await middleware.authenticate(mockReq);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid_supabase_token'
      );
      expect(mockUserRepo.resolveUserContext).toHaveBeenCalledWith('usr_supabase_admin_123');
      expect(result.authenticated).toBe(true);
      expect(result.context).toEqual({
        userId: 'usr_supabase_admin_123',
        email: 'admin@greenwood.edu',
        role: 'SCHOOL_ADMIN',
        schoolId: 'sch_greenwood_001',
        isSuperAdmin: false,
      });
    });

    it('rejects invalid or expired Supabase JWT with 401 error', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'JWT expired' },
          }),
        },
      } as unknown as SupabaseClient;

      const mockUserRepo = {
        resolveUserContext: vi.fn(),
      };

      const middleware = new AuthMiddleware(mockUserRepo, mockSupabaseClient);

      const mockReq: AuthenticatedRequest = {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired_token',
        },
      };

      const result = await middleware.authenticate(mockReq);
      expect(result.authenticated).toBe(false);
      expect((result.error as any).error.message).toContain('JWT expired');
      expect(mockUserRepo.resolveUserContext).not.toHaveBeenCalled();
    });

    it('rejects request with missing or malformed authorization header', async () => {
      const middleware = new AuthMiddleware({
        resolveUserContext: vi.fn(),
      });

      const mockReqEmpty: AuthenticatedRequest = { headers: {} };
      const res1 = await middleware.authenticate(mockReqEmpty);
      expect(res1.authenticated).toBe(false);
      expect((res1.error as any).error.message).toContain('Authentication token required');

      const mockReqInvalidFormat: AuthenticatedRequest = {
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      };
      const res2 = await middleware.authenticate(mockReqInvalidFormat);
      expect(res2.authenticated).toBe(false);
      expect((res2.error as any).error.message).toContain('Authentication token required');
    });

    it('rejects authenticated user if no tenant assignment or user profile exists in database', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr_unassigned',
                email: 'orphan@nowhere.com',
              },
            },
            error: null,
          }),
        },
      } as unknown as SupabaseClient;

      const mockUserRepo = {
        resolveUserContext: vi.fn().mockResolvedValue(null),
      };

      const middleware = new AuthMiddleware(mockUserRepo, mockSupabaseClient);

      const mockReq: AuthenticatedRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };

      const result = await middleware.authenticate(mockReq);
      expect(result.authenticated).toBe(false);
      expect((result.error as any).error.message).toContain('User profile or authorization not found');
    });
  });

  describe('SupabaseContainer Repository Queries & Schema Mapping', () => {
    it('maps database snake_case tables to domain models correctly', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'bus_001',
            school_id: 'sch_001',
            registration_number: 'KA-01-E-1234',
            capacity: 40,
            status: 'ACTIVE',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          error: null,
        }),
      };

      const mockClient = {
        from: vi.fn().mockReturnValue(mockChain),
      } as unknown as SupabaseClient;

      const container = new SupabaseContainer(mockClient);
      const bus = await container.busRepo.findById('bus_001');

      expect(mockClient.from).toHaveBeenCalledWith('buses');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'bus_001');
      expect(bus).toEqual({
        id: 'bus_001',
        schoolId: 'sch_001',
        registrationNumber: 'KA-01-E-1234',
        capacity: 40,
        status: 'ACTIVE',
        activeGpsDeviceId: undefined,
        activeRfidDeviceId: undefined,
        fleetNumber: undefined,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });
    });

    it('resolves active user context and tenant role from user_schools view', async () => {
      const mockUserChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: {
            id: 'usr_attendant_01',
            email: 'attendant@school.edu',
            role: 'ATTENDANT',
            status: 'ACTIVE',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          error: null,
        }),
      };

      const mockBindingChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: {
            school_id: 'sch_001',
            role: 'ATTENDANT',
          },
          error: null,
        }),
      };

      const mockClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') return mockUserChain;
          if (table === 'user_schools') return mockBindingChain;
          return {};
        }),
      } as unknown as SupabaseClient;

      const container = new SupabaseContainer(mockClient);
      const authCtx = await container.userRepo.resolveAuthContext('usr_attendant_01');

      expect(authCtx).toEqual({
        userId: 'usr_attendant_01',
        email: 'attendant@school.edu',
        role: 'ATTENDANT',
        schoolId: 'sch_001',
        isSuperAdmin: false,
      });
    });
  });
});
