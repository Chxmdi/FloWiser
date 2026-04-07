import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { CurrentStateRepository } from "./current-state.repository.js";

const calculateHealthScore = (event: CanonicalTelemetryEvent) => {
  if (!event.status.meterOnline) {
    return 60;
  }

  if (event.quality.status === "bad") {
    return 45;
  }

  if (event.quality.status === "suspicious") {
    return 75;
  }

  return 100;
};

export class CurrentStateProjectionService {
  constructor(private readonly repository: CurrentStateRepository) {}

  async project(event: CanonicalTelemetryEvent) {
    const healthScore = calculateHealthScore(event);

    await this.repository.upsertDeviceState({
      deviceId: event.deviceId,
      tenantId: event.tenantId,
      branchId: event.branchId,
      siteId: event.siteId,
      latestEventId: event.eventId,
      latestRawEventId: event.rawEventId,
      latestTelemetryAt: event.meterTimestamp,
      lastReceivedAt: event.receivedAt,
      isOnline: event.status.meterOnline,
      generatorRunning: event.status.generatorRunning,
      gridAvailable: event.status.gridAvailable,
      healthScore
    });

    await this.repository.upsertSiteState({
      siteId: event.siteId,
      tenantId: event.tenantId,
      branchId: event.branchId,
      latestEventId: event.eventId,
      latestTelemetryAt: event.meterTimestamp,
      lastReceivedAt: event.receivedAt,
      isOnline: event.status.meterOnline,
      generatorRunning: event.status.generatorRunning,
      gridAvailable: event.status.gridAvailable,
      healthScore
    });

    await this.repository.upsertBranchState({
      branchId: event.branchId,
      tenantId: event.tenantId,
      latestEventId: event.eventId,
      latestTelemetryAt: event.meterTimestamp,
      lastReceivedAt: event.receivedAt,
      isOnline: event.status.meterOnline,
      generatorRunning: event.status.generatorRunning,
      gridAvailable: event.status.gridAvailable,
      healthScore
    });
  }
}
