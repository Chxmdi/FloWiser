import { Router } from "express";
import { commandRequestSchema } from "../modules/commands/command.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const commandsRouter = Router();

commandsRouter.get("/templates", async (_request, response) => {
  if (!platformServices.deviceCommandingService) {
    return response.status(501).json({ error: "Commanding is unavailable until DATABASE_URL is configured." });
  }

  const templates = await platformServices.deviceCommandingService.listTemplates();
  return response.status(200).json({ templates });
});

commandsRouter.get("/templates/:templateId", async (request, response) => {
  if (!platformServices.deviceCommandingService) {
    return response.status(501).json({ error: "Commanding is unavailable until DATABASE_URL is configured." });
  }

  const template = await platformServices.deviceCommandingService.getTemplate(request.params.templateId);
  if (!template) {
    return response.status(404).json({ error: `Template ${request.params.templateId} was not found` });
  }

  return response.status(200).json(template);
});

commandsRouter.get("/dispatches", async (request, response) => {
  if (!platformServices.deviceCommandingService) {
    return response.status(501).json({ error: "Commanding is unavailable until DATABASE_URL is configured." });
  }

  const dispatches = await platformServices.deviceCommandingService.listDispatches({
    executionId: request.query.executionId as string | undefined,
    siteId: request.query.siteId as string | undefined,
    dispatchStatus: request.query.dispatchStatus as string | undefined,
    limit: parseLimit(request.query.limit)
  });
  return response.status(200).json({ dispatches });
});

commandsRouter.get("/dispatches/:dispatchId", async (request, response) => {
  if (!platformServices.deviceCommandingService) {
    return response.status(501).json({ error: "Commanding is unavailable until DATABASE_URL is configured." });
  }

  const dispatch = await platformServices.deviceCommandingService.getDispatch(request.params.dispatchId);
  if (!dispatch) {
    return response.status(404).json({ error: `Dispatch ${request.params.dispatchId} was not found` });
  }

  return response.status(200).json(dispatch);
});

commandsRouter.post("/executions/:executionId/plan", async (request, response) => {
  const parsed = commandRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid command request payload", details: parsed.error.flatten() });
  }

  if (!platformServices.deviceCommandingService) {
    return response.status(501).json({ error: "Commanding is unavailable until DATABASE_URL is configured." });
  }

  const result = await platformServices.deviceCommandingService.planExecution(request.params.executionId, parsed.data);
  if (!result) {
    return response.status(404).json({ error: `Execution ${request.params.executionId} or its template was not found` });
  }

  return response.status(201).json(result);
});

commandsRouter.post("/executions/:executionId/simulate", async (request, response) => {
  const parsed = commandRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid command request payload", details: parsed.error.flatten() });
  }

  if (!platformServices.deviceCommandingService) {
    return response.status(501).json({ error: "Commanding is unavailable until DATABASE_URL is configured." });
  }

  const result = await platformServices.deviceCommandingService.simulateExecution(request.params.executionId, parsed.data);
  if (!result) {
    return response.status(404).json({ error: `Execution ${request.params.executionId} or its template was not found` });
  }

  return response.status(201).json(result);
});

commandsRouter.post("/executions/:executionId/dispatch", async (request, response) => {
  const parsed = commandRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid command request payload", details: parsed.error.flatten() });
  }

  if (!platformServices.deviceCommandingService) {
    return response.status(501).json({ error: "Commanding is unavailable until DATABASE_URL is configured." });
  }

  try {
    const result = await platformServices.deviceCommandingService.dispatchExecution(request.params.executionId, parsed.data);
    if (!result) {
      return response.status(404).json({ error: `Execution ${request.params.executionId} or its template was not found` });
    }

    return response.status(201).json(result);
  } catch (error) {
    return response.status(409).json({
      error: error instanceof Error ? error.message : "Command dispatch could not be completed"
    });
  }
});
