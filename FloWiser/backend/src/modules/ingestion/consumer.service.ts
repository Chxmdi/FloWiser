import { randomUUID } from "node:crypto";
import { DecodePreviewError } from "../decoders/errors.js";
import type { TelemetryDecodeService } from "../telemetry/telemetry-decode.service.js";
import { buildCanonicalIdempotencyKey, buildTransportIdempotencyKey } from "./fingerprint.js";
import { assertTrustedSourceAuth, InvalidIngestionSourceError } from "./source-auth.js";
import type {
  IngestionEnvelope,
  IngestionProcessingResult
} from "./ingestion.types.js";
import { ingestionEnvelopeSchema } from "./ingestion.types.js";
import type { IdempotencyService } from "./idempotency.service.js";
import type { OrderingService } from "./ordering.service.js";
import type { DeadLetterService } from "./dead-letter.service.js";

export class IngestionConsumerService {
  constructor(
    private readonly telemetryDecodeService: TelemetryDecodeService,
    private readonly idempotencyService: IdempotencyService,
    private readonly orderingService: OrderingService,
    private readonly deadLetterService: DeadLetterService
  ) {}

  process(input: IngestionEnvelope): IngestionProcessingResult {
    const envelope = ingestionEnvelopeSchema.parse(input);
    const traceId = randomUUID();

    try {
      assertTrustedSourceAuth(envelope.sourceAuth);
    } catch (error) {
      const entry = this.deadLetterService.create(
        "source_auth",
        error instanceof Error ? error.message : "Unknown source-auth error",
        envelope,
        traceId
      );

      return {
        traceId,
        status: "dead_letter",
        findings: [],
        deadLetterEntryId: entry.entryId
      };
    }

    const transportKey = buildTransportIdempotencyKey(envelope);
    const transportClaim = this.idempotencyService.claim(transportKey, "transport");

    if (!transportClaim.claimed) {
      return {
        traceId,
        status: "duplicate_transport",
        findings: [],
        duplicateOfKey: transportKey
      };
    }

    try {
      const decodeResult = this.telemetryDecodeService.decodePreview(envelope);
      const canonicalKey = buildCanonicalIdempotencyKey(decodeResult.canonicalEvent);
      const canonicalClaim = this.idempotencyService.claim(canonicalKey, "canonical");

      if (!canonicalClaim.claimed) {
        return {
          traceId,
          status: "duplicate_canonical",
          findings: [],
          rawEventId: decodeResult.rawEvent.rawEventId,
          canonicalEventId: decodeResult.canonicalEvent.eventId,
          duplicateOfKey: canonicalKey
        };
      }

      const findings = this.orderingService.evaluate(decodeResult.canonicalEvent);

      return {
        traceId,
        status: "processed",
        findings,
        rawEventId: decodeResult.rawEvent.rawEventId,
        canonicalEventId: decodeResult.canonicalEvent.eventId
      };
    } catch (error) {
      if (error instanceof DecodePreviewError) {
        const entry = this.deadLetterService.create(
          "decode",
          error.message,
          envelope,
          traceId,
          error.rawEventId
        );

        return {
          traceId,
          status: "dead_letter",
          findings: [],
          rawEventId: error.rawEventId,
          deadLetterEntryId: entry.entryId
        };
      }

      if (error instanceof InvalidIngestionSourceError) {
        const entry = this.deadLetterService.create("source_auth", error.message, envelope, traceId);
        return {
          traceId,
          status: "dead_letter",
          findings: [],
          deadLetterEntryId: entry.entryId
        };
      }

      const entry = this.deadLetterService.create(
        "processing",
        error instanceof Error ? error.message : "Unknown ingestion error",
        envelope,
        traceId
      );

      return {
        traceId,
        status: "dead_letter",
        findings: [],
        deadLetterEntryId: entry.entryId
      };
    }
  }
}
