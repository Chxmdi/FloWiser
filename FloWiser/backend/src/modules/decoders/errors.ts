export class UnsupportedTelemetryPayloadError extends Error {
  constructor(message = "No supported decoder was able to handle the telemetry payload.") {
    super(message);
    this.name = "UnsupportedTelemetryPayloadError";
  }
}

export class DecodePreviewError extends Error {
  rawEventId: string;
  decoderAudit: unknown;

  constructor(rawEventId: string, decoderAudit: unknown, message: string) {
    super(message);
    this.name = "DecodePreviewError";
    this.rawEventId = rawEventId;
    this.decoderAudit = decoderAudit;
  }
}
