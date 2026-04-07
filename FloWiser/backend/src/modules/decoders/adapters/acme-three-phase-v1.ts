import {
  canonicalSchemaVersion,
  canonicalTelemetryEventSchema,
  type CanonicalMetrics
} from "@flowiser/schemas";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { normalizeTimestampToUtc } from "../../normalization/timestamps.js";
import { identity } from "../../normalization/units.js";
import type { TelemetryDecodeJob, TelemetryDecoder } from "../decoder.types.js";

const acmePayloadSchema = z.object({
  vendor: z.literal("AcmePower"),
  model: z.literal("MTR-3P"),
  firmware: z.string().min(1),
  timestamp: z.string(),
  seq: z.number().int().nonnegative().optional(),
  measurements: z.object({
    activePowerKw: z.union([z.number(), z.string()]),
    totalEnergyKwh: z.union([z.number(), z.string()]),
    voltageL1: z.union([z.number(), z.string()]),
    voltageL2: z.union([z.number(), z.string()]),
    voltageL3: z.union([z.number(), z.string()]),
    currentL1: z.union([z.number(), z.string()]),
    currentL2: z.union([z.number(), z.string()]),
    currentL3: z.union([z.number(), z.string()]),
    frequencyHz: z.union([z.number(), z.string()]).optional(),
    powerFactor: z.union([z.number(), z.string()]).optional()
  }),
  status: z
    .object({
      online: z.boolean().default(true),
      tamper: z.boolean().default(false),
      gridAvailable: z.boolean().optional(),
      generatorRunning: z.boolean().optional()
    })
    .default({})
});

export const decodeAcmeThreePhasePayload = (
  job: TelemetryDecodeJob,
  payload: unknown,
  decoderId: string,
  decoderVersion: string
) => {
  const parsed = acmePayloadSchema.parse(payload);

  const metrics: CanonicalMetrics = {
    kw: identity(parsed.measurements.activePowerKw, "activePowerKw"),
    kwhTotal: identity(parsed.measurements.totalEnergyKwh, "totalEnergyKwh"),
    voltageL1: identity(parsed.measurements.voltageL1, "voltageL1"),
    voltageL2: identity(parsed.measurements.voltageL2, "voltageL2"),
    voltageL3: identity(parsed.measurements.voltageL3, "voltageL3"),
    currentL1: identity(parsed.measurements.currentL1, "currentL1"),
    currentL2: identity(parsed.measurements.currentL2, "currentL2"),
    currentL3: identity(parsed.measurements.currentL3, "currentL3"),
    frequency: parsed.measurements.frequencyHz
      ? identity(parsed.measurements.frequencyHz, "frequencyHz")
      : undefined,
    powerFactor: parsed.measurements.powerFactor
      ? identity(parsed.measurements.powerFactor, "powerFactor")
      : undefined
  };

  return canonicalTelemetryEventSchema.parse({
    eventId: randomUUID(),
    rawEventId: job.rawEventId,
    schemaVersion: canonicalSchemaVersion,
    receivedAt: job.receivedAt,
    meterTimestamp: normalizeTimestampToUtc(parsed.timestamp),
    tenantId: job.context.tenantId,
    branchId: job.context.branchId,
    siteId: job.context.siteId,
    deviceId: job.context.deviceId,
    sourceProtocol: job.protocol,
    sourceTopic: job.topic,
    decoderId,
    decoderVersion,
    decoderAuditId: job.decoderAuditId,
    sequenceNo: parsed.seq,
    metrics,
    status: {
      meterOnline: parsed.status.online,
      tamperFlag: parsed.status.tamper,
      gridAvailable: parsed.status.gridAvailable,
      generatorRunning: parsed.status.generatorRunning
    },
    quality: {
      status: "unknown",
      score: 100,
      flags: []
    }
  });
};

export class AcmeThreePhaseV1Decoder implements TelemetryDecoder {
  readonly id = "acme-three-phase-v1";
  readonly vendor = "AcmePower";
  readonly model = "MTR-3P";
  readonly version = "1.0.0";

  canHandle(input: { payload: unknown }) {
    return acmePayloadSchema.safeParse(input.payload).success;
  }

  decode(input: TelemetryDecodeJob) {
    return decodeAcmeThreePhasePayload(input, input.payload, this.id, this.version);
  }
}
