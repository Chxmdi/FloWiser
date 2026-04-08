import { Router } from "express";
import { observabilityCaptureSchema } from "../modules/observability/observability.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const observabilityRouter = Router();

observabilityRouter.get("/overview", async (_request, response) => {
  if (!platformServices.observabilityService) {
    return response.status(501).json({ error: "Observability is unavailable until DATABASE_URL is configured." });
  }

  const overview = await platformServices.observabilityService.getOverview();
  return response.status(200).json(overview);
});

observabilityRouter.get("/snapshots", async (request, response) => {
  if (!platformServices.observabilityService) {
    return response.status(501).json({ error: "Observability is unavailable until DATABASE_URL is configured." });
  }

  const snapshots = await platformServices.observabilityService.listSnapshots(parseLimit(request.query.limit));
  return response.status(200).json({ snapshots });
});

observabilityRouter.post("/capture", async (request, response) => {
  const parsed = observabilityCaptureSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid observability capture payload", details: parsed.error.flatten() });
  }

  if (!platformServices.observabilityService) {
    return response.status(501).json({ error: "Observability is unavailable until DATABASE_URL is configured." });
  }

  const result = await platformServices.observabilityService.captureSnapshot(parsed.data);
  return response.status(201).json(result);
});
