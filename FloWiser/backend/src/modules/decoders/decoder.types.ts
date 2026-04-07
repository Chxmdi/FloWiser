import type { CanonicalTelemetryEvent, RawProtocol } from "@flowiser/schemas";
import { z } from "zod";

export const decoderHintSchema = z.object({
  vendor: z.string().min(1),
  model: z.string().min(1),
  version: z.string().min(1)
});

export const telemetryDecodeRequestSchema = z.object({
  protocol: z.enum(["mqtt", "http", "tcp", "gateway"]),
  topic: z.string().min(1),
  receivedAt: z.string().datetime({ offset: true }).optional(),
  decoderHint: decoderHintSchema.optional(),
  context: z.object({
    tenantId: z.string().min(1),
    branchId: z.string().min(1),
    siteId: z.string().min(1),
    deviceId: z.string().min(1)
  }),
  payload: z.unknown()
});

export type DecoderHint = z.infer<typeof decoderHintSchema>;
export type TelemetryDecodeRequest = z.infer<typeof telemetryDecodeRequestSchema>;

export type TelemetryDecodeJob = TelemetryDecodeRequest & {
  rawEventId: string;
  receivedAt: string;
  decoderAuditId: string;
};

export type DecoderResolutionSource = "hint" | "payload-match" | "fallback";

export type TelemetryDecoder = {
  id: string;
  vendor: string;
  model: string;
  version: string;
  canHandle(input: { payload: unknown; decoderHint?: DecoderHint }): boolean;
  decode(input: TelemetryDecodeJob): CanonicalTelemetryEvent;
};

export type DecodePreviewResult = {
  canonicalEvent: CanonicalTelemetryEvent;
  decoderAudit: DecoderAuditRecord;
  rawEvent: RawEventArchiveRecord;
};

export type DecoderAuditRecord = {
  decoderAuditId: string;
  decoderId: string;
  decoderVersion: string;
  vendor: string;
  model: string;
  selection: DecoderResolutionSource;
  recordedAt: string;
};

export type RawEventArchiveRecord = {
  rawEventId: string;
  protocol: RawProtocol;
  topic: string;
  decoderHint?: DecoderHint;
  tenantId: string;
  branchId: string;
  siteId: string;
  deviceId: string;
  archivedAt: string;
  retentionUntil: string;
  parseStatus: "pending" | "success" | "failed";
  parseError?: string;
  normalizedEventId?: string;
  decoderId?: string;
  rawPayload: unknown;
};
