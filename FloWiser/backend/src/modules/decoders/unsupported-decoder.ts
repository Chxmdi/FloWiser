import type { TelemetryDecodeJob, TelemetryDecoder } from "./decoder.types.js";
import { UnsupportedTelemetryPayloadError } from "./errors.js";

export class UnsupportedTelemetryDecoder implements TelemetryDecoder {
  readonly id = "unsupported-telemetry-payload";
  readonly vendor = "unsupported";
  readonly model = "unsupported";
  readonly version = "1.0.0";

  canHandle() {
    return true;
  }

  decode(_input: TelemetryDecodeJob) {
    throw new UnsupportedTelemetryPayloadError();
  }
}
