import { Router } from "express";
import { sreRunbookRequestSchema } from "../modules/sre/sre.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const sreRouter = Router();

sreRouter.get("/runbooks", async (_request, response) => {
  if (!platformServices.sreRunbookService) {
    return response.status(501).json({ error: "SRE tooling is unavailable until DATABASE_URL is configured." });
  }

  const runbooks = await platformServices.sreRunbookService.listRunbooks();
  return response.status(200).json({ runbooks });
});

sreRouter.get("/executions", async (request, response) => {
  if (!platformServices.sreRunbookService) {
    return response.status(501).json({ error: "SRE tooling is unavailable until DATABASE_URL is configured." });
  }

  const executions = await platformServices.sreRunbookService.listExecutions(parseLimit(request.query.limit));
  return response.status(200).json({ executions });
});

sreRouter.post("/runbooks/:runbookKey/execute", async (request, response) => {
  const parsed = sreRunbookRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid runbook payload", details: parsed.error.flatten() });
  }

  if (!platformServices.sreRunbookService) {
    return response.status(501).json({ error: "SRE tooling is unavailable until DATABASE_URL is configured." });
  }

  const result = await platformServices.sreRunbookService.executeRunbook(request.params.runbookKey, parsed.data);
  if (!result) {
    return response.status(404).json({ error: `Runbook ${request.params.runbookKey} was not found` });
  }

  return response.status(201).json(result);
});
