import { Router } from "express";
import { platformServices } from "../modules/platform/platform-services.js";

export const dashboardRouter = Router();

dashboardRouter.get("/overview", async (_request, response) => {
  if (!platformServices.experienceRepository) {
    return response.status(501).json({
      error: "Dashboard experience is unavailable until DATABASE_URL is configured."
    });
  }

  const overview = await platformServices.experienceRepository.getOverview();
  return response.status(200).json(overview);
});

dashboardRouter.get("/branches", async (_request, response) => {
  if (!platformServices.experienceRepository) {
    return response.status(501).json({
      error: "Dashboard experience is unavailable until DATABASE_URL is configured."
    });
  }

  const branches = await platformServices.experienceRepository.listBranches();
  return response.status(200).json({ branches });
});

dashboardRouter.get("/branches/:branchId", async (request, response) => {
  if (!platformServices.experienceRepository) {
    return response.status(501).json({
      error: "Dashboard experience is unavailable until DATABASE_URL is configured."
    });
  }

  const detail = await platformServices.experienceRepository.getBranchDetail(request.params.branchId);

  if (!detail) {
    return response.status(404).json({
      error: `Branch ${request.params.branchId} was not found`
    });
  }

  return response.status(200).json(detail);
});

dashboardRouter.get("/sites/:siteId", async (request, response) => {
  if (!platformServices.experienceRepository) {
    return response.status(501).json({
      error: "Dashboard experience is unavailable until DATABASE_URL is configured."
    });
  }

  const detail = await platformServices.experienceRepository.getSiteDetail(request.params.siteId);

  if (!detail) {
    return response.status(404).json({
      error: `Site ${request.params.siteId} was not found`
    });
  }

  return response.status(200).json(detail);
});

dashboardRouter.get("/executive", async (_request, response) => {
  if (!platformServices.experienceRepository) {
    return response.status(501).json({
      error: "Dashboard experience is unavailable until DATABASE_URL is configured."
    });
  }

  const executive = await platformServices.experienceRepository.getExecutive();
  return response.status(200).json(executive);
});
