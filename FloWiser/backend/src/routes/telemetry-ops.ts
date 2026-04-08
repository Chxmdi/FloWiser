import { Router } from "express";
import {
  logEntryInputSchema,
  metricsCaptureSchema,
  traceSpanInputSchema
} from "../modules/telemetry-infra/telemetry-infra.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const telemetryOpsRouter = Router();

telemetryOpsRouter.get("/metrics", async (request, response) => {
  if (!platformServices.externalTelemetryService) {
    return response.status(501).json({ error: "Telemetry ops are unavailable until DATABASE_URL is configured." });
  }

  const points = await platformServices.externalTelemetryService.listMetrics({
    metricKey: request.query.metricKey as string | undefined,
    source: request.query.source as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ points });
});

telemetryOpsRouter.post("/metrics/capture", async (request, response) => {
  const parsed = metricsCaptureSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid metric capture payload", details: parsed.error.flatten() });
  }

  if (!platformServices.externalTelemetryService) {
    return response.status(501).json({ error: "Telemetry ops are unavailable until DATABASE_URL is configured." });
  }

  const result = await platformServices.externalTelemetryService.captureMetrics(parsed.data);
  return response.status(201).json(result);
});

telemetryOpsRouter.get("/logs", async (request, response) => {
  if (!platformServices.externalTelemetryService) {
    return response.status(501).json({ error: "Telemetry ops are unavailable until DATABASE_URL is configured." });
  }

  const logs = await platformServices.externalTelemetryService.listLogs({
    severity: request.query.severity as string | undefined,
    source: request.query.source as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ logs });
});

telemetryOpsRouter.post("/logs", async (request, response) => {
  const parsed = logEntryInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid log payload", details: parsed.error.flatten() });
  }

  if (!platformServices.externalTelemetryService) {
    return response.status(501).json({ error: "Telemetry ops are unavailable until DATABASE_URL is configured." });
  }

  const logEntry = await platformServices.externalTelemetryService.recordLog(parsed.data);
  return response.status(201).json(logEntry);
});

telemetryOpsRouter.get("/traces", async (request, response) => {
  if (!platformServices.externalTelemetryService) {
    return response.status(501).json({ error: "Telemetry ops are unavailable until DATABASE_URL is configured." });
  }

  const spans = await platformServices.externalTelemetryService.listTraceSpans({
    traceId: request.query.traceId as string | undefined,
    source: request.query.source as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ spans });
});

telemetryOpsRouter.post("/traces", async (request, response) => {
  const parsed = traceSpanInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid trace span payload", details: parsed.error.flatten() });
  }

  if (!platformServices.externalTelemetryService) {
    return response.status(501).json({ error: "Telemetry ops are unavailable until DATABASE_URL is configured." });
  }

  const span = await platformServices.externalTelemetryService.recordTraceSpan(parsed.data);
  return response.status(201).json(span);
});
