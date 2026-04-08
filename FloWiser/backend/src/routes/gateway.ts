import { Router } from "express";
import { createProtectedRouteMiddleware } from "../modules/access/access.middleware.js";
import { gatewayDispatchResultSchema, gatewayHeartbeatSchema, gatewayPullSchema } from "../modules/gateway/gateway.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const adminAccess = createProtectedRouteMiddleware(platformServices.accessAuthorizationService, [
  "tenant_admin",
  "platform_admin"
]);

const getGatewayKey = (request: Parameters<typeof gatewayHeartbeatSchema.safeParse>[0] extends never ? never : any) =>
  request.header("x-gateway-key") as string | undefined;

export const gatewayRouter = Router();

gatewayRouter.get("/agents", adminAccess, async (request, response) => {
  if (!platformServices.gatewayIntegrationService) {
    return response.status(501).json({ error: "Gateway integration is unavailable until DATABASE_URL is configured." });
  }

  const agents = await platformServices.gatewayIntegrationService.listAgents({
    tenantId: request.query.tenantId as string | undefined,
    siteId: request.query.siteId as string | undefined,
    limit: Number(request.query.limit ?? 100)
  });
  return response.status(200).json({ agents });
});

gatewayRouter.get("/dispatches/:dispatchId/receipts", adminAccess, async (request, response) => {
  if (!platformServices.gatewayIntegrationService) {
    return response.status(501).json({ error: "Gateway integration is unavailable until DATABASE_URL is configured." });
  }

  const receipts = await platformServices.gatewayIntegrationService.listReceipts(request.params.dispatchId);
  return response.status(200).json({ receipts });
});

gatewayRouter.post("/agents/:agentId/heartbeat", async (request, response) => {
  const parsed = gatewayHeartbeatSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid gateway heartbeat payload", details: parsed.error.flatten() });
  }

  if (!platformServices.gatewayIntegrationService) {
    return response.status(501).json({ error: "Gateway integration is unavailable until DATABASE_URL is configured." });
  }

  const gatewayKey = getGatewayKey(request);
  if (!gatewayKey) {
    return response.status(401).json({ error: "Missing x-gateway-key header" });
  }

  const agent = await platformServices.gatewayIntegrationService.heartbeat(request.params.agentId, gatewayKey, parsed.data);
  if (!agent) {
    return response.status(403).json({ error: `Gateway agent ${request.params.agentId} could not be authenticated` });
  }

  return response.status(200).json({ agent });
});

gatewayRouter.post("/agents/:agentId/pull-dispatches", async (request, response) => {
  const parsed = gatewayPullSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid gateway pull payload", details: parsed.error.flatten() });
  }

  if (!platformServices.gatewayIntegrationService) {
    return response.status(501).json({ error: "Gateway integration is unavailable until DATABASE_URL is configured." });
  }

  const gatewayKey = getGatewayKey(request);
  if (!gatewayKey) {
    return response.status(401).json({ error: "Missing x-gateway-key header" });
  }

  const result = await platformServices.gatewayIntegrationService.pullDispatches(
    request.params.agentId,
    gatewayKey,
    parsed.data.limit ?? 20
  );
  if (!result) {
    return response.status(403).json({ error: `Gateway agent ${request.params.agentId} could not be authenticated` });
  }

  return response.status(200).json(result);
});

gatewayRouter.post("/agents/:agentId/dispatches/:dispatchId/result", async (request, response) => {
  const parsed = gatewayDispatchResultSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid gateway result payload", details: parsed.error.flatten() });
  }

  if (!platformServices.gatewayIntegrationService) {
    return response.status(501).json({ error: "Gateway integration is unavailable until DATABASE_URL is configured." });
  }

  const gatewayKey = getGatewayKey(request);
  if (!gatewayKey) {
    return response.status(401).json({ error: "Missing x-gateway-key header" });
  }

  try {
    const result = await platformServices.gatewayIntegrationService.submitDispatchResult(
      request.params.agentId,
      gatewayKey,
      request.params.dispatchId,
      parsed.data
    );

    if (result === undefined) {
      return response.status(403).json({ error: `Gateway agent ${request.params.agentId} could not be authenticated` });
    }

    if (result === null) {
      return response.status(404).json({ error: `Dispatch ${request.params.dispatchId} was not found` });
    }

    return response.status(200).json(result);
  } catch (error) {
    return response.status(409).json({
      error: error instanceof Error ? error.message : "Gateway dispatch result could not be processed"
    });
  }
});
