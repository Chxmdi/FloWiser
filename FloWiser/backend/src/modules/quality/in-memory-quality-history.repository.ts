import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { QualityHistoryRepository } from "./quality-history.repository.js";

export class InMemoryQualityHistoryRepository implements QualityHistoryRepository {
  private readonly latestByDevice = new Map<string, CanonicalTelemetryEvent>();

  getLatestForDevice(deviceId: string) {
    return this.latestByDevice.get(deviceId);
  }

  setLatestForDevice(event: CanonicalTelemetryEvent) {
    this.latestByDevice.set(event.deviceId, event);
  }
}
