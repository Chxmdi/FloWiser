import {
  canonicalSchemaVersion,
  canonicalTelemetryEventSchema,
  type CanonicalMetrics
} from "@flowiser/schemas";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { mapSatecMetricCode } from "../../normalization/metric-map.js";
import { normalizeTimestampToUtc } from "../../normalization/timestamps.js";
import { identity, wattsToKw, whToKwh } from "../../normalization/units.js";
import type { TelemetryDecodeJob, TelemetryDecoder } from "../decoder.types.js";

const satecPayloadSchema = z.object({
  vendor: z.literal("Satec"),
  model: z.literal("PM130"),
  firmware: z.string().min(1),
  tsEpochMs: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative().optional(),
  channels: z.array(
    z.object({
      code: z.string().min(1),
      value: z.union([z.number(), z.string()])
    })
  ),
  flags: z.object({
    online: z.union([z.boolean(), z.number()]),
    tamper: z.union([z.boolean(), z.number()]).default(0)
  })
});

export class SatecPm130V2Decoder implements TelemetryDecoder {
  readonly id = "satec-pm130-v2";
  readonly vendor = "Satec";
  readonly model = "PM130";
  readonly version = "2.0.0";

  canHandle(input: { payload: unknown }) {
    return satecPayloadSchema.safeParse(input.payload).success;
  }

  decode(input: TelemetryDecodeJob) {
    const parsed = satecPayloadSchema.parse(input.payload);

    const metrics: CanonicalMetrics = {};

    for (const channel of parsed.channels) {
      const metricKey = mapSatecMetricCode(channel.code);

      if (!metricKey) {
        continue;
      }

      if (metricKey === "kw") {
        metrics.kw = wattsToKw(channel.value);
        continue;
      }

      if (metricKey === "kwhTotal") {
        metrics.kwhTotal = whToKwh(channel.value);
        continue;
      }

      metrics[metricKey] = identity(channel.value, channel.code);
    }

    return canonicalTelemetryEventSchema.parse({
      eventId: randomUUID(),
      rawEventId: input.rawEventId,
      schemaVersion: canonicalSchemaVersion,
      receivedAt: input.receivedAt,
      meterTimestamp: normalizeTimestampToUtc(parsed.tsEpochMs),
      tenantId: input.context.tenantId,
      branchId: input.context.branchId,
      siteId: input.context.siteId,
      deviceId: input.context.deviceId,
      sourceProtocol: input.protocol,
      sourceTopic: input.topic,
      decoderId: this.id,
      decoderVersion: this.version,
      decoderAuditId: input.decoderAuditId,
      sequenceNo: parsed.sequence,
      metrics,
      status: {
        meterOnline: Boolean(parsed.flags.online),
        tamperFlag: Boolean(parsed.flags.tamper)
      },
      quality: {
        status: "unknown",
        score: 100,
        flags: []
      }
    });
  }
}
