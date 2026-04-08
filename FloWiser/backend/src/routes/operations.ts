import { Router } from "express";
import { operationsRequestSchema } from "../modules/operations/operations.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const operationsRouter = Router();

operationsRouter.get("/gateway-health", async (request, response) => {
  if (!platformServices.gatewayOperationsService) {
    return response.status(501).json({ error: "Operations are unavailable until DATABASE_URL is configured." });
  }

  const health = await platformServices.gatewayOperationsService.getGatewayHealth({
    tenantId: request.query.tenantId as string | undefined,
    siteId: request.query.siteId as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json(health);
});

operationsRouter.get("/incidents", async (request, response) => {
  if (!platformServices.gatewayOperationsService) {
    return response.status(501).json({ error: "Operations are unavailable until DATABASE_URL is configured." });
  }

  const incidents = await platformServices.gatewayOperationsService.listIncidents({
    status: request.query.status as string | undefined,
    incidentType: request.query.incidentType as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ incidents });
});

operationsRouter.get("/dead-letters", async (request, response) => {
  if (!platformServices.gatewayOperationsService) {
    return response.status(501).json({ error: "Operations are unavailable until DATABASE_URL is configured." });
  }

  const deadLetters = await platformServices.gatewayOperationsService.listDeadLetters(parseLimit(request.query.limit));
  return response.status(200).json({ deadLetters });
});

operationsRouter.post("/dispatches/:dispatchId/retry", async (request, response) => {
  const parsed = operationsRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid retry payload", details: parsed.error.flatten() });
  }

  if (!platformServices.gatewayOperationsService) {
    return response.status(501).json({ error: "Operations are unavailable until DATABASE_URL is configured." });
  }

  try {
    const result = await platformServices.gatewayOperationsService.retryDispatch(request.params.dispatchId, parsed.data);
    if (!result) {
      return response.status(404).json({ error: `Dispatch ${request.params.dispatchId} was not found` });
    }
    return response.status(200).json(result);
  } catch (error) {
    return response.status(409).json({
      error: error instanceof Error ? error.message : "Retry could not be scheduled"
    });
  }
});

operationsRouter.post("/retries/run", async (request, response) => {
  const parsed = operationsRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid operations payload", details: parsed.error.flatten() });
  }

  if (!platformServices.gatewayOperationsService) {
    return response.status(501).json({ error: "Operations are unavailable until DATABASE_URL is configured." });
  }

  const result = await platformServices.gatewayOperationsService.runRetrySweep(parsed.data);
  return response.status(200).json(result);
});
