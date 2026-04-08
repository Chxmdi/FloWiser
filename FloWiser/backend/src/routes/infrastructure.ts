import { Router } from "express";
import { infraProfileUpdateSchema, metricsCaptureSchema } from "../modules/telemetry-infra/telemetry-infra.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

export const infrastructureRouter = Router();

infrastructureRouter.get("/profiles", async (_request, response) => {
  if (!platformServices.externalTelemetryService) {
    return response.status(501).json({ error: "Infrastructure telemetry is unavailable until DATABASE_URL is configured." });
  }

  const profiles = await platformServices.externalTelemetryService.listProfiles();
  return response.status(200).json({ profiles });
});

infrastructureRouter.get("/profiles/:profileId", async (request, response) => {
  if (!platformServices.externalTelemetryService) {
    return response.status(501).json({ error: "Infrastructure telemetry is unavailable until DATABASE_URL is configured." });
  }

  const profile = await platformServices.externalTelemetryService.getProfile(request.params.profileId);
  if (!profile) {
    return response.status(404).json({ error: `Infra profile ${request.params.profileId} was not found` });
  }

  return response.status(200).json(profile);
});

infrastructureRouter.patch("/profiles/:profileId", async (request, response) => {
  const parsed = infraProfileUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid infra profile payload", details: parsed.error.flatten() });
  }

  if (!platformServices.externalTelemetryService) {
    return response.status(501).json({ error: "Infrastructure telemetry is unavailable until DATABASE_URL is configured." });
  }

  const profile = await platformServices.externalTelemetryService.updateProfile(request.params.profileId, parsed.data);
  if (!profile) {
    return response.status(404).json({ error: `Infra profile ${request.params.profileId} was not found` });
  }

  return response.status(200).json(profile);
});

infrastructureRouter.post("/profiles/:profileId/check", async (request, response) => {
  const parsed = metricsCaptureSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid infra check payload", details: parsed.error.flatten() });
  }

  if (!platformServices.externalTelemetryService) {
    return response.status(501).json({ error: "Infrastructure telemetry is unavailable until DATABASE_URL is configured." });
  }

  const profile = await platformServices.externalTelemetryService.checkProfile(request.params.profileId, parsed.data.actor);
  if (!profile) {
    return response.status(404).json({ error: `Infra profile ${request.params.profileId} was not found` });
  }

  return response.status(200).json(profile);
});
