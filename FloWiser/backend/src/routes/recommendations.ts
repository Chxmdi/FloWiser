import { Router } from "express";
import { recommendationDecisionSchema } from "../modules/recommendations/recommendation.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const recommendationsRouter = Router();

recommendationsRouter.get("/top-actions", async (request, response) => {
  if (!platformServices.recommendationEngineService) {
    return response.status(501).json({
      error: "Recommendations are unavailable until DATABASE_URL is configured."
    });
  }

  const recommendations = await platformServices.recommendationEngineService.listRecommendations({
    siteId: request.query.siteId as string | undefined,
    deviceId: request.query.deviceId as string | undefined,
    status: request.query.status as string | undefined,
    approvalStatus: request.query.approvalStatus as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ recommendations });
});

recommendationsRouter.get("/", async (request, response) => {
  if (!platformServices.recommendationEngineService) {
    return response.status(501).json({
      error: "Recommendations are unavailable until DATABASE_URL is configured."
    });
  }

  const recommendations = await platformServices.recommendationEngineService.listRecommendations({
    siteId: request.query.siteId as string | undefined,
    deviceId: request.query.deviceId as string | undefined,
    status: request.query.status as string | undefined,
    approvalStatus: request.query.approvalStatus as string | undefined,
    ruleId: request.query.ruleId as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ recommendations });
});

recommendationsRouter.get("/:actionId", async (request, response) => {
  if (!platformServices.recommendationEngineService) {
    return response.status(501).json({
      error: "Recommendations are unavailable until DATABASE_URL is configured."
    });
  }

  const recommendation = await platformServices.recommendationEngineService.getRecommendation(request.params.actionId);

  if (!recommendation) {
    return response.status(404).json({
      error: `Recommendation ${request.params.actionId} was not found`
    });
  }

  return response.status(200).json(recommendation);
});

recommendationsRouter.post("/:actionId/approve", async (request, response) => {
  const parsed = recommendationDecisionSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid recommendation decision payload", details: parsed.error.flatten() });
  }

  if (!platformServices.recommendationEngineService) {
    return response.status(501).json({
      error: "Recommendations are unavailable until DATABASE_URL is configured."
    });
  }

  const recommendation = await platformServices.recommendationEngineService.approveRecommendation(
    request.params.actionId,
    parsed.data
  );

  if (!recommendation) {
    return response.status(404).json({ error: `Recommendation ${request.params.actionId} was not found` });
  }

  return response.status(200).json(recommendation);
});

recommendationsRouter.post("/:actionId/reject", async (request, response) => {
  const parsed = recommendationDecisionSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid recommendation decision payload", details: parsed.error.flatten() });
  }

  if (!platformServices.recommendationEngineService) {
    return response.status(501).json({
      error: "Recommendations are unavailable until DATABASE_URL is configured."
    });
  }

  const recommendation = await platformServices.recommendationEngineService.rejectRecommendation(
    request.params.actionId,
    parsed.data
  );

  if (!recommendation) {
    return response.status(404).json({ error: `Recommendation ${request.params.actionId} was not found` });
  }

  return response.status(200).json(recommendation);
});

recommendationsRouter.post("/:actionId/resolve", async (request, response) => {
  const parsed = recommendationDecisionSchema.safeParse(request.body ?? { actor: "system" });
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid recommendation resolution payload", details: parsed.error.flatten() });
  }

  if (!platformServices.recommendationEngineService) {
    return response.status(501).json({
      error: "Recommendations are unavailable until DATABASE_URL is configured."
    });
  }

  const recommendation = await platformServices.recommendationEngineService.resolveRecommendation(
    request.params.actionId,
    parsed.data
  );

  if (!recommendation) {
    return response.status(404).json({ error: `Recommendation ${request.params.actionId} was not found` });
  }

  return response.status(200).json(recommendation);
});
