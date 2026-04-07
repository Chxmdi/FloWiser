import { Router } from "express";
import { platformServices } from "../modules/platform/platform-services.js";

export const alertsRouter = Router();

alertsRouter.get("/", async (request, response) => {
  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Alert workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const alerts = await platformServices.alertWorkflowService.listAlerts({
    siteId: request.query.siteId as string | undefined,
    deviceId: request.query.deviceId as string | undefined,
    state: request.query.state as string | undefined,
    severity: request.query.severity as string | undefined
  });

  return response.status(200).json({ alerts });
});

alertsRouter.get("/:alertId", async (request, response) => {
  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Alert workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const alert = await platformServices.alertWorkflowService.getAlert(request.params.alertId);

  if (!alert) {
    return response.status(404).json({
      error: `Alert ${request.params.alertId} was not found`
    });
  }

  return response.status(200).json(alert);
});
