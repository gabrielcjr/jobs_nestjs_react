/**
 * OpenTelemetry Tracing Initialization for NestJS Backend.
 * Automatically instruments HTTP/Fastify requests, Prisma queries, and Redis calls.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (otelEndpoint) {
  const serviceName = process.env.OTEL_SERVICE_NAME || 'jobs-backend';
  const targetUrl = otelEndpoint.endsWith('/v1/traces')
    ? otelEndpoint
    : `${otelEndpoint}/v1/traces`;

  const traceExporter = new OTLPTraceExporter({
    url: targetUrl,
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs/dns spans to avoid excessive noise
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (req) => {
            const url = req.url || '';
            return url.includes('/health') || url.includes('/metrics') || url.includes('/favicon.ico');
          },
        },
      }),
    ],
  });

  sdk.start();
  console.log(`[OpenTelemetry] Tracing initialized for ${serviceName} -> ${targetUrl}`);

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('[OpenTelemetry] SDK terminated'))
      .catch((error) => console.error('[OpenTelemetry] Error terminating SDK', error))
      .finally(() => process.exit(0));
  });
}
