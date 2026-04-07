import { Router } from "express";
import { ruleUpdateSchema } from "../modules/rules/rule.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseMatched = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
};

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const rulesRouter = Router();

rulesRouter.get("/traces", async (request, response) => {
  if (!platformServices.rulesEngineService) {
    return response.status(501).json({
      error: "Rules engine is unavailable until DATABASE_URL is configured."
    });
  }

  const traces = await platformServices.rulesEngineService.listTraces({
    ruleId: request.query.ruleId as string | undefined,
    siteId: request.query.siteId as string | undefined,
    deviceId: request.query.deviceId as string | undefined,
    matched: parseMatched(request.query.matched),
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ traces });
});

rulesRouter.get("/", async (_request, response) => {
  if (!platformServices.rulesEngineService) {
    return response.status(501).json({
      error: "Rules engine is unavailable until DATABASE_URL is configured."
    });
  }

  const rules = await platformServices.rulesEngineService.listRules();
  return response.status(200).json({ rules });
});

rulesRouter.get("/:ruleId", async (request, response) => {
  if (!platformServices.rulesEngineService) {
    return response.status(501).json({
      error: "Rules engine is unavailable until DATABASE_URL is configured."
    });
  }

  const rule = await platformServices.rulesEngineService.getRule(request.params.ruleId);

  if (!rule) {
    return response.status(404).json({ error: `Rule ${request.params.ruleId} was not found` });
  }

  return response.status(200).json(rule);
});

rulesRouter.patch("/:ruleId", async (request, response) => {
  const parsed = ruleUpdateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid rule update payload", details: parsed.error.flatten() });
  }

  if (!platformServices.rulesEngineService) {
    return response.status(501).json({
      error: "Rules engine is unavailable until DATABASE_URL is configured."
    });
  }

  const rule = await platformServices.rulesEngineService.updateRule(request.params.ruleId, parsed.data);

  if (!rule) {
    return response.status(404).json({ error: `Rule ${request.params.ruleId} was not found` });
  }

  return response.status(200).json(rule);
});
