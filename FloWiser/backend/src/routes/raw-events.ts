import { Router } from "express";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const rawEventsRouter = Router();

rawEventsRouter.get("/", async (request, response) => {
  if (!platformServices.storageOrchestratorService) {
    return response.status(501).json({
      error: "Persistent raw-event queries are unavailable until DATABASE_URL is configured."
    });
  }

  const events = await platformServices.storageOrchestratorService.findRawEvents({
    rawEventId: request.query.rawEventId as string | undefined,
    deviceId: request.query.deviceId as string | undefined,
    from: request.query.from as string | undefined,
    to: request.query.to as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ events });
});

rawEventsRouter.get("/:rawEventId", async (request, response) => {
  try {
    const record = platformServices.rawEventArchiveService.getById(request.params.rawEventId);
    return response.status(200).json(record);
  } catch {
    if (platformServices.storageOrchestratorService) {
      const record = await platformServices.storageOrchestratorService.findRawEventById(request.params.rawEventId);
      if (record) {
        return response.status(200).json(record);
      }
    }

    return response.status(404).json({
      error: `Raw event ${request.params.rawEventId} was not found`
    });
  }
});
