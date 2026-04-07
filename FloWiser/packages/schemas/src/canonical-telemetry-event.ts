import { z } from "zod";

export const canonicalSchemaVersion = "1.0.0" as const;

export const rawProtocolSchema = z.enum(["mqtt", "http", "tcp", "gateway"]);
export type RawProtocol = z.infer<typeof rawProtocolSchema>;

export const qualityStatusSchema = z.enum(["unknown", "good", "suspicious", "bad"]);
export type QualityStatus = z.infer<typeof qualityStatusSchema>;

export const canonicalMetricKeys = [
  "kw",
  "kwhTotal",
  "voltageL1",
  "voltageL2",
  "voltageL3",
  "currentL1",
  "currentL2",
  "currentL3",
  "frequency",
  "powerFactor"
] as const;

export type CanonicalMetricKey = (typeof canonicalMetricKeys)[number];

const isoDateTime = z.string().datetime({ offset: true });

export const canonicalMetricsSchema = z
  .object({
    kw: z.number().finite().optional(),
    kwhTotal: z.number().finite().optional(),
    voltageL1: z.number().finite().optional(),
    voltageL2: z.number().finite().optional(),
    voltageL3: z.number().finite().optional(),
    currentL1: z.number().finite().optional(),
    currentL2: z.number().finite().optional(),
    currentL3: z.number().finite().optional(),
    frequency: z.number().finite().optional(),
    powerFactor: z.number().finite().optional()
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: "At least one canonical metric must be present."
  });

export const canonicalStatusSchema = z.object({
  meterOnline: z.boolean().default(true),
  tamperFlag: z.boolean().default(false),
  gridAvailable: z.boolean().optional(),
  generatorRunning: z.boolean().optional()
});

export const canonicalQualitySchema = z.object({
  status: qualityStatusSchema.default("unknown"),
  score: z.number().min(0).max(100).default(100),
  flags: z.array(z.string()).default([])
});

export const canonicalTelemetryEventSchema = z.object({
  eventId: z.string().uuid(),
  rawEventId: z.string().uuid(),
  schemaVersion: z.literal(canonicalSchemaVersion),
  receivedAt: isoDateTime,
  meterTimestamp: isoDateTime,
  tenantId: z.string().min(1),
  branchId: z.string().min(1),
  siteId: z.string().min(1),
  deviceId: z.string().min(1),
  sourceProtocol: rawProtocolSchema,
  sourceTopic: z.string().min(1),
  decoderId: z.string().min(1),
  decoderVersion: z.string().min(1),
  decoderAuditId: z.string().uuid(),
  sequenceNo: z.number().int().nonnegative().optional(),
  metrics: canonicalMetricsSchema,
  status: canonicalStatusSchema,
  quality: canonicalQualitySchema
});

export type CanonicalMetrics = z.infer<typeof canonicalMetricsSchema>;
export type CanonicalStatus = z.infer<typeof canonicalStatusSchema>;
export type CanonicalQuality = z.infer<typeof canonicalQualitySchema>;
export type CanonicalTelemetryEvent = z.infer<typeof canonicalTelemetryEventSchema>;
