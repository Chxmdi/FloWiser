import type {
  DecoderHint,
  DecoderResolutionSource,
  TelemetryDecoder
} from "./decoder.types.js";

const buildDecoderKey = (vendor: string, model: string, version: string) =>
  `${vendor.toLowerCase()}::${model.toLowerCase()}::${version.toLowerCase()}`;

export class DecoderRegistry {
  private readonly decoders = new Map<string, TelemetryDecoder>();

  constructor(private readonly fallbackDecoder: TelemetryDecoder) {}

  register(decoder: TelemetryDecoder) {
    this.decoders.set(buildDecoderKey(decoder.vendor, decoder.model, decoder.version), decoder);
  }

  resolve(input: { payload: unknown; decoderHint?: DecoderHint }): {
    decoder: TelemetryDecoder;
    selection: DecoderResolutionSource;
  } {
    if (input.decoderHint) {
      const byHint = this.decoders.get(
        buildDecoderKey(input.decoderHint.vendor, input.decoderHint.model, input.decoderHint.version)
      );

      if (byHint) {
        return { decoder: byHint, selection: "hint" };
      }
    }

    const byPayload = [...this.decoders.values()].find((decoder) => decoder.canHandle(input));

    if (byPayload) {
      return { decoder: byPayload, selection: "payload-match" };
    }

    return { decoder: this.fallbackDecoder, selection: "fallback" };
  }

  listSupportedDecoders() {
    return [...this.decoders.values()].map((decoder) => ({
      id: decoder.id,
      vendor: decoder.vendor,
      model: decoder.model,
      version: decoder.version
    }));
  }
}
