import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { CurrentStateRepository } from "./current-state.repository.js";

const calculateHealthScore = (event: CanonicalTelemetryEvent) => {
  let score = event.quality.score;

  if (!event.status.meterOnline) {
    score -= 20;
  }

  if (event.quality.status === "bad") {
    score -= 20;
  }

  if (event.quality.flags.includes("timestamp_drift_critical")) {
    score -= 10;
  }

  if (event.quality.flags.includes("counter_reset_or_rollover")) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
};

export class CurrentStateProjectionService {
  constructor(private readonly repository: CurrentStateRepository) {}

  async project(event: CanonicalTelemetryEvent) {
    const healthScore = calculateHealthScore(event);
    const sharedQuality = {
      qualityStatus: event.quality.status,
      qualityScore: event.quality.score,
      qualityFlagsCount: event.quality.flags.length,
      openIssueCount: 0
    };

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
      healthScore,
      ...sharedQuality
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
      healthScore,
      ...sharedQuality
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
      healthScore,
      ...sharedQuality
    });
  }
}
