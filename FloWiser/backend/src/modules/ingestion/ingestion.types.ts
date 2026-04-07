import { z } from "zod";
import { telemetryDecodeRequestSchema } from "../decoders/decoder.types.js";

export const sourceAuthSchema = z.object({
  transportMessageId: z.string().min(1),
  connectionId: z.string().min(1),
  principalId: z.string().min(1),
  authenticated: z.boolean(),
  signatureVerified: z.boolean().default(true),
  qos: z.coerce.number().int().min(0).max(2).default(1)
});

export const ingestionEnvelopeSchema = telemetryDecodeRequestSchema.extend({
  sourceAuth: sourceAuthSchema
});

export type SourceAuth = z.infer<typeof sourceAuthSchema>;
export type IngestionEnvelope = z.infer<typeof ingestionEnvelopeSchema>;

export type IngestionFinding =
  | "sequence_gap"
  | "out_of_order"
  | "late_arrival"
  | "replay_backlog";

export type IngestionProcessingStatus =
  | "processed"
  | "duplicate_transport"
  | "duplicate_canonical"
  | "dead_letter";

export type DeadLetterStage = "source_auth" | "decode" | "processing";

export type DeadLetterEntry = {
  entryId: string;
  createdAt: string;
  traceId: string;
  stage: DeadLetterStage;
  reason: string;
  topic: string;
  transportMessageId: string;
  tenantId: string;
  siteId: string;
  deviceId: string;
  rawEventId?: string;
};

export type IngestionProcessingResult = {
  traceId: string;
  status: IngestionProcessingStatus;
  findings: IngestionFinding[];
  rawEventId?: string;
  canonicalEventId?: string;
  deadLetterEntryId?: string;
  duplicateOfKey?: string;
};
