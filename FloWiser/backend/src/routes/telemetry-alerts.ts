import { Router } from "express";
import {
  alertEvaluationSchema,
  alertPolicyUpdateSchema
} from "../modules/telemetry-infra/telemetry-infra.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const telemetryAlertsRouter = Router();

telemetryAlertsRouter.get("/policies", async (_request, response) => {
  if (!platformServices.alertingService) {
    return response.status(501).json({ error: "Telemetry alerting is unavailable until DATABASE_URL is configured." });
  }

  const policies = await platformServices.alertingService.listPolicies();
  return response.status(200).json({ policies });
});

telemetryAlertsRouter.get("/policies/:policyId", async (request, response) => {
  if (!platformServices.alertingService) {
    return response.status(501).json({ error: "Telemetry alerting is unavailable until DATABASE_URL is configured." });
  }

  const policy = await platformServices.alertingService.getPolicy(request.params.policyId);
  if (!policy) {
    return response.status(404).json({ error: `Alert policy ${request.params.policyId} was not found` });
  }

  return response.status(200).json(policy);
});

telemetryAlertsRouter.patch("/policies/:policyId", async (request, response) => {
  const parsed = alertPolicyUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid alert policy payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertingService) {
    return response.status(501).json({ error: "Telemetry alerting is unavailable until DATABASE_URL is configured." });
  }

  const policy = await platformServices.alertingService.updatePolicy(request.params.policyId, parsed.data);
  if (!policy) {
    return response.status(404).json({ error: `Alert policy ${request.params.policyId} was not found` });
  }

  return response.status(200).json(policy);
});

telemetryAlertsRouter.get("/events", async (request, response) => {
  if (!platformServices.alertingService) {
    return response.status(501).json({ error: "Telemetry alerting is unavailable until DATABASE_URL is configured." });
  }

  const events = await platformServices.alertingService.listEvents({
    status: request.query.status as string | undefined,
    severity: request.query.severity as string | undefined,
    policyId: request.query.policyId as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ events });
});

telemetryAlertsRouter.post("/evaluate", async (request, response) => {
  const parsed = alertEvaluationSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid alert evaluation payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertingService) {
    return response.status(501).json({ error: "Telemetry alerting is unavailable until DATABASE_URL is configured." });
  }

  const result = await platformServices.alertingService.evaluate(parsed.data);
  return response.status(200).json(result);
});
