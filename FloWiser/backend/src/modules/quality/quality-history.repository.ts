import type { CanonicalTelemetryEvent } from "@flowiser/schemas";

export interface QualityHistoryRepository {
  getLatestForDevice(deviceId: string): CanonicalTelemetryEvent | undefined;
  setLatestForDevice(event: CanonicalTelemetryEvent): void;
}
