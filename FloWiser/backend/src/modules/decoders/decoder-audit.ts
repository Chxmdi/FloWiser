import { randomUUID } from "node:crypto";
import type { DecoderResolutionSource, TelemetryDecoder } from "./decoder.types.js";

export const createDecoderAuditRecord = (
  decoder: TelemetryDecoder,
  selection: DecoderResolutionSource
) => ({
  decoderAuditId: randomUUID(),
  decoderId: decoder.id,
  decoderVersion: decoder.version,
  vendor: decoder.vendor,
  model: decoder.model,
  selection,
  recordedAt: new Date().toISOString()
});
