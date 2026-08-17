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
});
