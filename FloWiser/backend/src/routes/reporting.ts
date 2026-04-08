import { Router } from "express";
import { verificationRequestSchema } from "../modules/reporting/reporting.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const reportingRouter = Router();

reportingRouter.get("/overview", async (_request, response) => {
  if (!platformServices.reportingService) {
    return response.status(501).json({ error: "Reporting is unavailable until DATABASE_URL is configured." });
  }

  const overview = await platformServices.reportingService.getOverview();
  return response.status(200).json(overview);
});

reportingRouter.get("/executive", async (_request, response) => {
  if (!platformServices.reportingService) {
    return response.status(501).json({ error: "Reporting is unavailable until DATABASE_URL is configured." });
  }

  const report = await platformServices.reportingService.getExecutiveReport();
  return response.status(200).json(report);
});

reportingRouter.get("/sites/:siteId", async (request, response) => {
  if (!platformServices.reportingService) {
    return response.status(501).json({ error: "Reporting is unavailable until DATABASE_URL is configured." });
  }

  const report = await platformServices.reportingService.getSiteReport(request.params.siteId);
  return response.status(200).json(report);
});

reportingRouter.get("/verifications", async (request, response) => {
  if (!platformServices.reportingService) {
    return response.status(501).json({ error: "Reporting is unavailable until DATABASE_URL is configured." });
  }

  const verifications = await platformServices.reportingService.listVerifications({
    siteId: request.query.siteId as string | undefined,
    actionId: request.query.actionId as string | undefined,
    verificationStatus: request.query.verificationStatus as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ verifications });
});

reportingRouter.get("/recommendations/:actionId", async (request, response) => {
  if (!platformServices.reportingService) {
    return response.status(501).json({ error: "Reporting is unavailable until DATABASE_URL is configured." });
  }

  const verification = await platformServices.reportingService.getRecommendationVerification(request.params.actionId);
  if (!verification) {
    return response.status(404).json({ error: `Recommendation ${request.params.actionId} was not found` });
  }

  return response.status(200).json(verification);
});

reportingRouter.post("/recommendations/:actionId/verify", async (request, response) => {
  const parsed = verificationRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid verification payload", details: parsed.error.flatten() });
  }

  if (!platformServices.reportingService) {
    return response.status(501).json({ error: "Reporting is unavailable until DATABASE_URL is configured." });
  }

  const result = await platformServices.reportingService.verifyRecommendation(request.params.actionId, parsed.data);
  if (!result) {
    return response.status(404).json({ error: `Recommendation ${request.params.actionId} was not found` });
  }

  return response.status(201).json(result);
});
