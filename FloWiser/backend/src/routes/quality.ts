import { Router } from "express";
import { platformServices } from "../modules/platform/platform-services.js";

export const qualityRouter = Router();

qualityRouter.get("/metrics", (_request, response) => {
  response.status(200).json({
    metrics: platformServices.qualityMetricsService.snapshot()
  });
});

qualityRouter.post("/re-evaluate/:eventId", async (request, response) => {
  if (!platformServices.storageOrchestratorService) {
    return response.status(501).json({
      error: "Quality reevaluation is unavailable until DATABASE_URL is configured."
    });
  }

  const event = await platformServices.storageOrchestratorService.findTelemetryEventById(request.params.eventId);

  if (!event) {
    return response.status(404).json({
      error: `Telemetry event ${request.params.eventId} was not found`
    });
  }

  const evaluatedEvent = platformServices.telemetryQualityService.reEvaluate(event);
  await platformServices.storageOrchestratorService.persistReevaluatedTelemetry(evaluatedEvent);

  return response.status(200).json({
    eventId: evaluatedEvent.eventId,
    quality: evaluatedEvent.quality
  });
});
