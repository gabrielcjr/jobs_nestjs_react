import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { LocalhostOnlyGuard } from './localhost-only.guard';

describe('LocalhostOnlyGuard', () => {
  let guard: LocalhostOnlyGuard;

  beforeEach(() => {
    guard = new LocalhostOnlyGuard();
  });

  const createMockContext = (req: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
      getHandler: () => ({ name: 'testHandler' }),
      getClass: () => ({ name: 'TestController' }),
    } as unknown as ExecutionContext;
  };

  it('should allow request originating from 127.0.0.1', () => {
    const ctx = createMockContext({
      ip: '127.0.0.1',
      headers: {},
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow request originating from IPv6 loopback (::1)', () => {
    const ctx = createMockContext({
      ip: '::1',
      headers: {},
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow request originating from mapped IPv4 loopback (::ffff:127.0.0.1)', () => {
    const ctx = createMockContext({
      ip: '::ffff:127.0.0.1',
      headers: {},
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow request originating from Docker bridge gateway (172.20.0.1)', () => {
    const ctx = createMockContext({
      ip: '172.20.0.1',
      headers: {},
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw 403 Forbidden for external public direct IP', () => {
    const ctx = createMockContext({
      ip: '198.51.100.42',
      headers: {},
    });

    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
    try {
      guard.canActivate(ctx);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(err.getResponse().message).toContain('restricted to local VM execution only');
    }
  });

  it('should throw 403 Forbidden if x-forwarded-for contains an external public IP', () => {
    const ctx = createMockContext({
      ip: '127.0.0.1',
      headers: {
        'x-forwarded-for': '203.0.113.195, 127.0.0.1',
      },
    });

    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
    try {
      guard.canActivate(ctx);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.FORBIDDEN);
    }
  });

  it('should throw 403 Forbidden if x-forwarded-for prepends a spoofed loopback IP ahead of a public hop', () => {
    const ctx = createMockContext({
      ip: '127.0.0.1',
      headers: {
        'x-forwarded-for': '127.0.0.1, 203.0.113.195',
      },
    });

    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
  });

  it('should throw 403 Forbidden when direct IP is missing/empty (fail-closed)', () => {
    const ctx = createMockContext({
      ip: '',
      headers: {},
    });

    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
  });

  it('should enforce ADMIN_API_KEY when configured in environment', () => {
    const prevKey = process.env.ADMIN_API_KEY;
    process.env.ADMIN_API_KEY = 'super-secret-key';

    try {
      const unauthorizedCtx = createMockContext({
        ip: '127.0.0.1',
        headers: {},
      });
      expect(() => guard.canActivate(unauthorizedCtx)).toThrow(HttpException);

      const authorizedCtx = createMockContext({
        ip: '127.0.0.1',
        headers: {
          'x-admin-api-key': 'super-secret-key',
        },
      });
      expect(guard.canActivate(authorizedCtx)).toBe(true);
    } finally {
      if (prevKey === undefined) {
        delete process.env.ADMIN_API_KEY;
      } else {
        process.env.ADMIN_API_KEY = prevKey;
      }
    }
  });
});
