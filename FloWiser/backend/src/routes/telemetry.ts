import { Router } from "express";
import { telemetryDecodeRequestSchema } from "../modules/decoders/decoder.types.js";
import { DecodePreviewError } from "../modules/decoders/errors.js";
import { platformServices } from "../modules/platform/platform-services.js";

export const telemetryRouter = Router();

telemetryRouter.get("/decoders", (_request, response) => {
  response.status(200).json({
    supportedDecoders: platformServices.decoderRegistry.listSupportedDecoders()
  });
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
