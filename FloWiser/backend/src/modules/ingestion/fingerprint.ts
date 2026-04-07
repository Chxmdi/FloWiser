import { createHash } from "node:crypto";
import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { IngestionEnvelope } from "./ingestion.types.js";

const stableSerialize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => stableSerialize(entry));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = stableSerialize((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }

  return value;
};

const sha256 = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(stableSerialize(value))).digest("hex");

export const buildTransportIdempotencyKey = (envelope: IngestionEnvelope) =>
  `transport:${envelope.sourceAuth.transportMessageId}:${sha256({
    topic: envelope.topic,
    deviceId: envelope.context.deviceId,
    payload: envelope.payload
  })}`;

export const buildCanonicalIdempotencyKey = (event: CanonicalTelemetryEvent) =>
  `canonical:${event.deviceId}:${event.meterTimestamp}:${event.sequenceNo ?? "na"}`;
