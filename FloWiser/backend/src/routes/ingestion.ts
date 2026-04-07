import { Router } from "express";
import { ingestionEnvelopeSchema } from "../modules/ingestion/ingestion.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

export const ingestionRouter = Router();

ingestionRouter.post("/process", (request, response) => {
  const parsed = ingestionEnvelopeSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      error: "Invalid ingestion envelope",
      details: parsed.error.flatten()
    });
  }

  const result = platformServices.ingestionConsumerService.process(parsed.data);
  const statusCode = result.status === "processed" ? 201 : result.status === "dead_letter" ? 422 : 200;

  return response.status(statusCode).json(result);
});

ingestionRouter.get("/dead-letter", (_request, response) => {
  response.status(200).json({
    entries: platformServices.deadLetterService.list()
  });
});

ingestionRouter.get("/dead-letter/:entryId", (request, response) => {
  try {
    const entry = platformServices.deadLetterService.get(request.params.entryId);
    return response.status(200).json(entry);
  } catch (error) {
    return response.status(404).json({
      error: error instanceof Error ? error.message : "Dead-letter entry not found"
    });
  }
});
