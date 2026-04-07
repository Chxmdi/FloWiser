import { DecoderRegistry } from "./registry.js";
import { AcmeThreePhaseV1Decoder } from "./adapters/acme-three-phase-v1.js";
import { GatewayForwardedAcmeV1Decoder } from "./adapters/gateway-forwarded-acme-v1.js";
import { SatecPm130V2Decoder } from "./adapters/satec-pm130-v2.js";
import { UnsupportedTelemetryDecoder } from "./unsupported-decoder.js";

export const createDefaultDecoderRegistry = () => {
  const registry = new DecoderRegistry(new UnsupportedTelemetryDecoder());

  registry.register(new AcmeThreePhaseV1Decoder());
  registry.register(new SatecPm130V2Decoder());
  registry.register(new GatewayForwardedAcmeV1Decoder());

  return registry;
};
