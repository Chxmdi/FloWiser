import { Router } from "express";
import { telemetryDecodeRequestSchema } from "../modules/decoders/decoder.types.js";
import { DecodePreviewError } from "../modules/decoders/errors.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const telemetryRouter = Router();

telemetryRouter.get("/decoders", (_request, response) => {
  response.status(200).json({
    supportedDecoders: platformServices.decoderRegistry.listSupportedDecoders()
  });
});

telemetryRouter.get("/events", async (request, response) => {
  if (!platformServices.storageOrchestratorService) {
    return response.status(501).json({
      error: "Persistent telemetry event queries are unavailable until DATABASE_URL is configured."
    });
  }

  const events = await platformServices.storageOrchestratorService.findTelemetryEvents({
    eventId: request.query.eventId as string | undefined,
    deviceId: request.query.deviceId as string | undefined,
    from: request.query.from as string | undefined,
    to: request.query.to as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ events });
});

telemetryRouter.post("/decode-preview", (request, response) => {
  const parsed = telemetryDecodeRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      error: "Invalid telemetry decode request",
      details: parsed.error.flatten()
    });
  }

  try {
    const result = platformServices.telemetryDecodeService.decodePreview(parsed.data);
    return response.status(201).json(result);
  } catch (error) {
    if (error instanceof DecodePreviewError) {
      return response.status(422).json({
        error: error.message,
        rawEventId: error.rawEventId,
        decoderAudit: error.decoderAudit
      });
    }

    return response.status(500).json({
      error: error instanceof Error ? error.message : "Unknown server error"
    });
  }
});
