import type { BrokerOutboxService } from "../broker/broker-outbox.service.js";
import type { GatewayOperationsService } from "../operations/gateway-operations.service.js";
import type { PostgresCommandingRepository } from "../commands/postgres-commanding.repository.js";
import { PostgresObservabilityRepository } from "./postgres-observability.repository.js";
import type { ObservabilityCaptureInput } from "./observability.types.js";

export class ObservabilityService {
  constructor(
    private readonly repository: PostgresObservabilityRepository,
    private readonly gatewayOperationsService: GatewayOperationsService,
    private readonly commandingRepository: PostgresCommandingRepository,
    private readonly brokerOutboxService: BrokerOutboxService
  ) {}

  async captureSnapshot(input: ObservabilityCaptureInput) {
    const health = await this.gatewayOperationsService.getGatewayHealth({});
    const incidents = await this.commandingRepository.listIncidents({ status: "open", limit: 500 });
    const deadLetters = await this.commandingRepository.listDeadLetters(500);
    const brokerStatusCounts = await this.brokerOutboxService.getStatusCounts();

    const counts = {
      gatewayOnlineCount: health.agents.filter((agent) => agent.health === "online").length,
      gatewayStaleCount: health.agents.filter((agent) => agent.health === "stale").length,
      gatewayOfflineCount: health.agents.filter((agent) => agent.health === "offline").length,
      gatewayNeverSeenCount: health.agents.filter((agent) => agent.health === "never_seen").length,
      pendingDispatchCount: health.agents.reduce((sum, agent) => sum + agent.pendingDispatchCount, 0),
      retryScheduledCount: (await this.commandingRepository.listDispatches({ dispatchStatus: "retry_scheduled", limit: 500 })).length,
      deadLetterCount: deadLetters.length,
      openIncidentCount: incidents.length,
      brokerPendingCount: Number(brokerStatusCounts.pending ?? 0),
      brokerClaimedCount: Number(brokerStatusCounts.claimed ?? 0),
      brokerDeadLetteredCount: Number(brokerStatusCounts.dead_lettered ?? 0)
    };

    const snapshot = await this.repository.createSnapshot({
      capturedBy: input.actor,
      ...counts
    });

    return { snapshot, health, counts };
  }

  async listSnapshots(limit?: number) {
    return this.repository.listSnapshots(limit ?? 100);
  }

  async getOverview() {
    const latestSnapshot = await this.repository.getLatestSnapshot();
    const health = await this.gatewayOperationsService.getGatewayHealth({});
    const incidents = await this.commandingRepository.listIncidents({ status: "open", limit: 100 });
    const deadLetters = await this.commandingRepository.listDeadLetters(100);
    const brokerStatusCounts = await this.brokerOutboxService.getStatusCounts();

    return {
      latestSnapshot,
      current: {
        agentCount: health.agents.length,
        onlineGatewayCount: health.agents.filter((agent) => agent.health === "online").length,
        staleGatewayCount: health.agents.filter((agent) => agent.health === "stale").length,
        offlineGatewayCount: health.agents.filter((agent) => agent.health === "offline").length,
        pendingDispatchCount: health.agents.reduce((sum, agent) => sum + agent.pendingDispatchCount, 0),
        openIncidentCount: incidents.length,
        deadLetterCount: deadLetters.length,
        brokerPendingCount: Number(brokerStatusCounts.pending ?? 0),
        brokerClaimedCount: Number(brokerStatusCounts.claimed ?? 0),
        brokerDeadLetteredCount: Number(brokerStatusCounts.dead_lettered ?? 0)
      }
    };
  }
}
