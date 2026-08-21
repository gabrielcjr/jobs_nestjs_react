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

  it('should throw 403 Forbidden for external direct IP', () => {
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

  it('should throw 403 Forbidden if x-forwarded-for contains an external IP', () => {
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
});
