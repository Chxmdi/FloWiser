import { Router } from "express";
import { platformServices } from "../modules/platform/platform-services.js";

export const rawEventsRouter = Router();

rawEventsRouter.get("/:rawEventId", (request, response) => {
  try {
    const record = platformServices.rawEventArchiveService.getById(request.params.rawEventId);
    return response.status(200).json(record);
  } catch (error) {
    return response.status(404).json({
      error: error instanceof Error ? error.message : "Raw event not found"
    });
  }
});
