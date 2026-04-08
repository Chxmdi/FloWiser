import { Router } from "express";
import { fieldMeasurementInputSchema } from "../modules/field-verification/field-verification.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const fieldVerificationRouter = Router();

fieldVerificationRouter.get("/measurements", async (request, response) => {
  if (!platformServices.fieldVerificationService) {
    return response.status(501).json({ error: "Field verification is unavailable until DATABASE_URL is configured." });
  }

  const measurements = await platformServices.fieldVerificationService.listMeasurements({
    siteId: request.query.siteId as string | undefined,
    actionId: request.query.actionId as string | undefined,
    limit: parseLimit(request.query.limit)
  });
  return response.status(200).json({ measurements });
});

fieldVerificationRouter.get("/recommendations/:actionId", async (request, response) => {
  if (!platformServices.fieldVerificationService) {
    return response.status(501).json({ error: "Field verification is unavailable until DATABASE_URL is configured." });
  }

  const result = await platformServices.fieldVerificationService.getRecommendationMeasurements(request.params.actionId);
  if (!result) {
    return response.status(404).json({ error: `Recommendation ${request.params.actionId} was not found` });
  }

  return response.status(200).json(result);
});

fieldVerificationRouter.post("/recommendations/:actionId/measure", async (request, response) => {
  const parsed = fieldMeasurementInputSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid field measurement payload", details: parsed.error.flatten() });
  }

  if (!platformServices.fieldVerificationService) {
    return response.status(501).json({ error: "Field verification is unavailable until DATABASE_URL is configured." });
  }

  const measurement = await platformServices.fieldVerificationService.createMeasurement(request.params.actionId, parsed.data);
  if (!measurement) {
    return response.status(404).json({ error: `Recommendation ${request.params.actionId} was not found` });
  }

  return response.status(201).json(measurement);
});
