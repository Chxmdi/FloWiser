import { Router } from "express";
import { platformServices } from "../modules/platform/platform-services.js";

export const stateRouter = Router();

stateRouter.get("/devices/:deviceId", async (request, response) => {
  if (!platformServices.stateEngineService) {
    return response.status(501).json({
      error: "State inspection is unavailable until DATABASE_URL is configured."
    });
  }

  const state = await platformServices.stateEngineService.getDeviceState(request.params.deviceId);

  if (!state) {
    return response.status(404).json({
      error: `Device state for ${request.params.deviceId} was not found`
    });
  }

  return response.status(200).json(state);
});

stateRouter.get("/sites/:siteId", async (request, response) => {
  if (!platformServices.stateEngineService) {
    return response.status(501).json({
      error: "State inspection is unavailable until DATABASE_URL is configured."
    });
  }

  const state = await platformServices.stateEngineService.getSiteState(request.params.siteId);

  if (!state) {
    return response.status(404).json({
      error: `Site state for ${request.params.siteId} was not found`
    });
  }

  return response.status(200).json(state);
});

stateRouter.get("/branches/:branchId", async (request, response) => {
  if (!platformServices.stateEngineService) {
    return response.status(501).json({
      error: "State inspection is unavailable until DATABASE_URL is configured."
    });
  }

  const state = await platformServices.stateEngineService.getBranchState(request.params.branchId);

  if (!state) {
    return response.status(404).json({
      error: `Branch state for ${request.params.branchId} was not found`
    });
  }

  return response.status(200).json(state);
});
