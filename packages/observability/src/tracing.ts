/**
 * OpenTelemetry tracing initialisation.
 *
 * Call initTracing(serviceName) as the FIRST statement in each service's
 * entry point (before any other imports that touch HTTP/DB/Redis).
 *
 * Traces are exported to the OTLP endpoint (Jaeger) via gRPC.
 * Set OTEL_EXPORTER_OTLP_ENDPOINT (default: http://jaeger:4317).
 */
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { Resource } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://jaeger:4317'

let _sdk: NodeSDK | null = null

export function initTracing(serviceName: string, serviceVersion = '0.1.0'): void {
  if (_sdk) return // already initialised

  _sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
    }),
    traceExporter: new OTLPTraceExporter({
      url: OTLP_ENDPOINT,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Reduce noise: disable fs instrumentation (very chatty)
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  })

  _sdk.start()

  process.on('SIGTERM', async () => {
    await _sdk?.shutdown()
  })
}
