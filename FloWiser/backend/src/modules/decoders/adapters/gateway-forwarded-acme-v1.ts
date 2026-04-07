import { z } from "zod";
import { normalizeTimestampToUtc } from "../../normalization/timestamps.js";
import { decodeAcmeThreePhasePayload } from "./acme-three-phase-v1.js";
import type { TelemetryDecodeJob, TelemetryDecoder } from "../decoder.types.js";

const gatewayForwardedPayloadSchema = z.object({
  gatewayEnvelopeVersion: z.literal("1"),
  gateway: z.object({
    vendor: z.string().min(1),
    model: z.string().min(1),
    firmware: z.string().min(1)
  }),
  publishedAt: z.string(),
  targetDecoder: z.object({
    vendor: z.literal("AcmePower"),
    model: z.literal("MTR-3P"),
    version: z.string().min(1)
  }),
  payload: z.unknown()
});

export class GatewayForwardedAcmeV1Decoder implements TelemetryDecoder {
  readonly id = "gateway-forwarded-acme-v1";
  readonly vendor = "GatewayForwarder";
  readonly model = "AcmeEnvelope";
  readonly version = "1.0.0";

  canHandle(input: { payload: unknown }) {
    return gatewayForwardedPayloadSchema.safeParse(input.payload).success;
  }

  decode(input: TelemetryDecodeJob) {
    const parsed = gatewayForwardedPayloadSchema.parse(input.payload);

    return decodeAcmeThreePhasePayload(
      {
        ...input,
        protocol: "gateway",
        topic: `${input.topic}#gateway-forwarded`,
        receivedAt: normalizeTimestampToUtc(parsed.publishedAt)
      },
      parsed.payload,
      this.id,
      this.version
    );
  }
}
