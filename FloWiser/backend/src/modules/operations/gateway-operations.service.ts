import type { GatewayIntegrationService } from "../gateway/gateway-integration.service.js";
import type { PostgresCommandingRepository } from "../commands/postgres-commanding.repository.js";
import type { ActionExecutionService } from "../controls/action-execution.service.js";
import type { OperationsRequestInput } from "./operations.types.js";

const isoInMinutes = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000).toISOString();
const minutesSince = (timestamp?: string) =>
  !timestamp ? Number.POSITIVE_INFINITY : (Date.now() - Date.parse(timestamp)) / (1000 * 60);

export class GatewayOperationsService {
  constructor(
    private readonly commandingRepository: PostgresCommandingRepository,
    private readonly gatewayIntegrationService: GatewayIntegrationService,
    private readonly actionExecutionService: ActionExecutionService
  ) {}

  async getGatewayHealth(filters: { tenantId?: string; siteId?: string; limit?: number }) {
    const agents = await this.gatewayIntegrationService.listAgents(filters);
    const pendingCounts = await this.gatewayIntegrationService.getPendingDispatchCountsBySite(
      agents.map((agent) => agent.siteId)
    );

    return {
      agents: agents.map((agent) => {
        const ageMinutes = minutesSince(agent.lastSeenAt);
        const health = !agent.lastSeenAt
          ? "never_seen"
          : ageMinutes > 15
            ? "offline"
            : ageMinutes > 5
              ? "stale"
              : "online";
        return {
          agentId: agent.agentId,
          siteId: agent.siteId,
          displayName: agent.displayName,
          lastSeenAt: agent.lastSeenAt,
          health,
          pendingDispatchCount: pendingCounts[agent.siteId] ?? 0,
          supportedActionTypes: agent.supportedActionTypes
        };
      })
    };
  }

  async listIncidents(filters: { status?: string; incidentType?: string; limit?: number }) {
    return this.commandingRepository.listIncidents(filters);
  }

  async listDeadLetters(limit?: number) {
    return this.commandingRepository.listDeadLetters(limit ?? 100);
  }

  async retryDispatch(dispatchId: string, input: OperationsRequestInput) {
    const dispatch = await this.commandingRepository.getDispatch(dispatchId);
    if (!dispatch) {
      return undefined;
    }

    if (["succeeded", "dead_lettered"].includes(dispatch.dispatchStatus)) {
      throw new Error(`Dispatch ${dispatchId} cannot be retried from status ${dispatch.dispatchStatus}`);
    }

    const nextAttemptAt = isoInMinutes(0);
    const updated = await this.commandingRepository.scheduleRetry(
      dispatchId,
      nextAttemptAt,
      `manual retry by ${input.actor}${input.note ? `: ${input.note}` : ""}`
    );

    const incident = await this.commandingRepository.createIncident({
      dispatchId,
      incidentType: "manual_retry",
      severity: "medium",
      status: "open",
      summary: `Manual retry scheduled for dispatch ${dispatchId}`,
      detail: {
        actor: input.actor,
        note: input.note,
        attemptCount: dispatch.attemptCount,
        maxAttempts: dispatch.maxAttempts
      }
    });

    return { dispatch: updated, incident };
  }

  async runRetrySweep(input: OperationsRequestInput) {
    const staleBefore = isoInMinutes(-5);
    const candidates = await this.commandingRepository.listRetryCandidates(staleBefore, 100);
    const results: Array<Record<string, unknown>> = [];
    let retryScheduledCount = 0;
    let deadLetteredCount = 0;

    for (const dispatch of candidates) {
      const exhausted = dispatch.attemptCount >= dispatch.maxAttempts;
      const reason =
        dispatch.dispatchStatus === "sent"
          ? `dispatch timeout after attempt ${dispatch.attemptCount}`
          : dispatch.lastError ?? `retry required from status ${dispatch.dispatchStatus}`;

      if (exhausted) {
        const updated = await this.commandingRepository.markDeadLetter(dispatch.dispatchId, reason);
        const deadLetter = await this.commandingRepository.createDeadLetter({
          dispatchId: dispatch.dispatchId,
          reason,
          detail: {
            actor: input.actor,
            note: input.note,
            attemptCount: dispatch.attemptCount,
            maxAttempts: dispatch.maxAttempts
          }
        });
        const incident = await this.commandingRepository.createIncident({
          dispatchId: dispatch.dispatchId,
          incidentType: "dead_lettered",
          severity: "high",
          status: "open",
          summary: `Dispatch ${dispatch.dispatchId} was dead-lettered after ${dispatch.attemptCount} attempts`,
          detail: {
            reason,
            actor: input.actor,
            note: input.note
          }
        });

        if (dispatch.executionId) {
          await this.actionExecutionService.completeExecution(dispatch.executionId, {
            actor: `operations:${input.actor}`,
            success: false,
            resultSummary: `Dispatch dead-lettered: ${reason}`
          }).catch(() => undefined);
        }

        deadLetteredCount += 1;
        results.push({
          dispatchId: dispatch.dispatchId,
          outcome: "dead_lettered",
          deadLetter,
          incident,
          dispatch: updated
        });
        continue;
      }

      const backoffMinutes = Math.min(60, 2 ** Math.max(1, dispatch.attemptCount));
      const nextAttemptAt = isoInMinutes(backoffMinutes);
      const updated = await this.commandingRepository.scheduleRetry(dispatch.dispatchId, nextAttemptAt, reason);
      const incident = await this.commandingRepository.createIncident({
        dispatchId: dispatch.dispatchId,
        incidentType: dispatch.dispatchStatus === "sent" ? "dispatch_timeout" : "dispatch_retry",
        severity: "medium",
        status: "open",
        summary: `Retry scheduled for dispatch ${dispatch.dispatchId}`,
        detail: {
          reason,
          nextAttemptAt,
          actor: input.actor,
          note: input.note,
          attemptCount: dispatch.attemptCount,
          maxAttempts: dispatch.maxAttempts
        }
      });

      retryScheduledCount += 1;
      results.push({
        dispatchId: dispatch.dispatchId,
        outcome: "retry_scheduled",
        nextAttemptAt,
        incident,
        dispatch: updated
      });
    }

    return {
      processed: results.length,
      retryScheduledCount,
      deadLetteredCount,
      results
    };
  }
}
