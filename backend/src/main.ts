import './tracing';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  // Security Headers via Fastify Helmet
  await app.register(fastifyHelmet as Parameters<NestFastifyApplication['register']>[0], {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'https:', 'http:'],
        scriptSrc: [`'self'`],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // CORS Configuration: restrict allowed origins via CORS_ORIGINS env var or localhost in dev
  const rawCorsOrigins = process.env.CORS_ORIGINS;
  const allowedOrigins: (string | RegExp)[] = rawCorsOrigins
    ? rawCorsOrigins
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];

  await app.register(fastifyCors as Parameters<NestFastifyApplication['register']>[0], {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global Validation Pipe with auto-transform and strip unknown properties
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const host = process.env.HOST || '127.0.0.1';

  await app.listen(port, host);
  logger.log(`🚀 Multi-ATS Jobs Backend running on http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal error starting NestJS server:', err);
  process.exit(1);
});
