// Polyfill diagnostics_channel.tracingChannel for Node.js 18 environments running Fastify 5
import * as dc from 'diagnostics_channel';
if (!(dc as any).tracingChannel) {
  (dc as any).tracingChannel = () => ({
    start: { publish: () => {} },
    end: { publish: () => {} },
    asyncStart: { publish: () => {} },
    asyncEnd: { publish: () => {} },
    error: { publish: () => {} },
    tracePromise: (_fn: any, run: any) => (typeof run === 'function' ? run() : undefined),
    traceCallback: (fn: any) => fn,
    traceSync: (_fn: any, run: any) => (typeof run === 'function' ? run() : undefined),
  });
}

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';


describe('DevATS API (E2E)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/ingest/providers -> should return available ATS providers', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/ingest/providers',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((p: any) => p.provider === 'GREENHOUSE')).toBe(true);
    expect(body.data.some((p: any) => p.provider === 'LEVER')).toBe(true);
    expect(body.data.some((p: any) => p.provider === 'ASHBY')).toBe(true);
  });

  it('GET /api/v1/jobs -> should return paginated jobs response structure', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs?limit=5',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('jobs');
    expect(body).toHaveProperty('totalCount');
    expect(body).toHaveProperty('facets');
    expect(Array.isArray(body.jobs)).toBe(true);
  });

  it('GET /api/v1/jobs/tags -> should return top extracted tech tags', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/jobs/tags',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /api/v1/ingest/csv-summary -> should read CSV metadata', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/ingest/csv-summary?tier=1',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.totalRows).toBeGreaterThan(0);
  });

  it('POST /api/v1/jobs/prune -> should allow localhost dry-run audit', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/jobs/prune',
      payload: {
        days: 45,
        dryRun: true,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.dryRun).toBe(true);
    expect(body.data.daysThreshold).toBe(45);
    expect(typeof body.data.deactivatedCount).toBe('number');
  });

  it('POST /api/v1/jobs/prune -> should reject external forwarded IP with 403 Forbidden', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/jobs/prune',
      headers: {
        'x-forwarded-for': '198.51.100.23, 127.0.0.1',
      },
      payload: {
        days: 45,
        dryRun: true,
      },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('restricted to local VM execution only');
  });

  it('POST /api/v1/ingest/start-csv-discovery -> should allow localhost triggering', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ingest/start-csv-discovery',
      payload: {
        tier: 1,
        limit: 1,
        concurrency: 1,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Started automated background ATS discovery');
    expect(body.data).toHaveProperty('id');
  });

  it('POST /api/v1/ingest/start-csv-discovery -> should reject external forwarded IP with 403 Forbidden', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ingest/start-csv-discovery',
      headers: {
        'x-forwarded-for': '198.51.100.23, 127.0.0.1',
      },
      payload: {
        tier: 1,
        limit: 1,
      },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('restricted to local VM execution only');
  });
});


