import { canonicalTelemetryEventSchema } from "@flowiser/schemas";
import { createDecoderAuditRecord } from "../decoders/decoder-audit.js";
import type {
  DecodePreviewResult,
  TelemetryDecodeRequest
} from "../decoders/decoder.types.js";
import { telemetryDecodeRequestSchema } from "../decoders/decoder.types.js";
import { DecodePreviewError } from "../decoders/errors.js";
import type { DecoderRegistry } from "../decoders/registry.js";
import { RawEventArchiveService } from "../raw-events/raw-event-archive.service.js";
import { resolveReceivedAt } from "../normalization/timestamps.js";
import { TelemetryQualityService } from "../quality/telemetry-quality.service.js";

export class TelemetryDecodeService {
  constructor(
    private readonly decoderRegistry: DecoderRegistry,
    private readonly rawEventArchiveService: RawEventArchiveService,
    private readonly telemetryQualityService: TelemetryQualityService
  ) {}

  decodePreview(input: TelemetryDecodeRequest): DecodePreviewResult {
    const request = telemetryDecodeRequestSchema.parse(input);
    const rawEvent = this.rawEventArchiveService.archivePending(request);
    const resolution = this.decoderRegistry.resolve({
      payload: request.payload,
      decoderHint: request.decoderHint
    });
    const decoderAudit = createDecoderAuditRecord(resolution.decoder, resolution.selection);

    try {
      const canonicalEvent = resolution.decoder.decode({
        ...request,
        rawEventId: rawEvent.rawEventId,
        receivedAt: resolveReceivedAt(request.receivedAt),
        decoderAuditId: decoderAudit.decoderAuditId
      });

      const evaluatedEvent = this.telemetryQualityService.evaluate(canonicalEvent);
      canonicalTelemetryEventSchema.parse(evaluatedEvent);

      const archived = this.rawEventArchiveService.markSuccess(
        rawEvent.rawEventId,
        evaluatedEvent.eventId,
        evaluatedEvent.decoderId
      );

      return {
        canonicalEvent: evaluatedEvent,
        decoderAudit,
        rawEvent: archived
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown decoder error";
      this.rawEventArchiveService.markFailure(rawEvent.rawEventId, message);
      throw new DecodePreviewError(rawEvent.rawEventId, decoderAudit, message);
    }
  }
}
