import { Router } from "express";
import {
  controlPolicyUpdateSchema,
  executionApprovalSchema,
  executionCompleteSchema,
  executionRequestSchema
} from "../modules/controls/control.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const controlsRouter = Router();

controlsRouter.get("/policies", async (_request, response) => {
  if (!platformServices.actionExecutionService) {
    return response.status(501).json({
      error: "Controls are unavailable until DATABASE_URL is configured."
    });
  }

  const policies = await platformServices.actionExecutionService.listPolicies();
  return response.status(200).json({ policies });
});

controlsRouter.get("/policies/:policyId", async (request, response) => {
  if (!platformServices.actionExecutionService) {
    return response.status(501).json({
      error: "Controls are unavailable until DATABASE_URL is configured."
    });
  }

  const policy = await platformServices.actionExecutionService.getPolicy(request.params.policyId);
  if (!policy) {
    return response.status(404).json({ error: `Policy ${request.params.policyId} was not found` });
  }

  return response.status(200).json(policy);
});

controlsRouter.patch("/policies/:policyId", async (request, response) => {
  const parsed = controlPolicyUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid policy update payload", details: parsed.error.flatten() });
  }

  if (!platformServices.actionExecutionService) {
    return response.status(501).json({
      error: "Controls are unavailable until DATABASE_URL is configured."
    });
  }

  const policy = await platformServices.actionExecutionService.updatePolicy(request.params.policyId, parsed.data);
  if (!policy) {
    return response.status(404).json({ error: `Policy ${request.params.policyId} was not found` });
  }

  return response.status(200).json(policy);
});

controlsRouter.get("/executions", async (request, response) => {
  if (!platformServices.actionExecutionService) {
    return response.status(501).json({
      error: "Controls are unavailable until DATABASE_URL is configured."
    });
  }

  const executions = await platformServices.actionExecutionService.listExecutions({
    siteId: request.query.siteId as string | undefined,
    status: request.query.status as string | undefined,
    actionId: request.query.actionId as string | undefined,
    limit: parseLimit(request.query.limit)
  });
  return response.status(200).json({ executions });
});

controlsRouter.get("/executions/:executionId", async (request, response) => {
  if (!platformServices.actionExecutionService) {
    return response.status(501).json({
      error: "Controls are unavailable until DATABASE_URL is configured."
    });
  }

  const detail = await platformServices.actionExecutionService.getExecution(request.params.executionId);
  if (!detail) {
    return response.status(404).json({ error: `Execution ${request.params.executionId} was not found` });
  }

  return response.status(200).json(detail);
});

controlsRouter.post("/executions", async (request, response) => {
  const parsed = executionRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid execution request payload", details: parsed.error.flatten() });
  }

  if (!platformServices.actionExecutionService) {
    return response.status(501).json({
      error: "Controls are unavailable until DATABASE_URL is configured."
    });
  }

  const result = await platformServices.actionExecutionService.requestExecution(parsed.data);
  if (!result) {
    return response.status(404).json({ error: `Recommendation ${parsed.data.actionId} was not found` });
  }

  return response.status(201).json(result);
});

controlsRouter.post("/executions/:executionId/approvals", async (request, response) => {
  const parsed = executionApprovalSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid approval payload", details: parsed.error.flatten() });
  }

  if (!platformServices.actionExecutionService) {
    return response.status(501).json({
      error: "Controls are unavailable until DATABASE_URL is configured."
    });
  }

  try {
    const result = await platformServices.actionExecutionService.addApproval(request.params.executionId, parsed.data);
    if (!result) {
      return response.status(404).json({ error: `Execution ${request.params.executionId} was not found` });
    }
    return response.status(200).json(result);
  } catch (error) {
    return response.status(409).json({
      error: error instanceof Error ? error.message : "Execution approval could not be applied"
    });
  }
});

controlsRouter.post("/executions/:executionId/complete", async (request, response) => {
  const parsed = executionCompleteSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid execution completion payload", details: parsed.error.flatten() });
  }

  if (!platformServices.actionExecutionService) {
    return response.status(501).json({
      error: "Controls are unavailable until DATABASE_URL is configured."
    });
  }

  try {
    const result = await platformServices.actionExecutionService.completeExecution(request.params.executionId, parsed.data);
    if (!result) {
      return response.status(404).json({ error: `Execution ${request.params.executionId} was not found` });
    }
    return response.status(200).json(result);
  } catch (error) {
    return response.status(409).json({
      error: error instanceof Error ? error.message : "Execution completion could not be applied"
    });
  }
});
