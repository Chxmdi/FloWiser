import { defaultGatewayAgents } from "./default-gateway-agents.js";
import type { GatewayDispatchResultInput, GatewayHeartbeatInput } from "./gateway.types.js";
import { PostgresGatewayRepository } from "./postgres-gateway.repository.js";
import type { ActionExecutionService } from "../controls/action-execution.service.js";
import type { PostgresCommandingRepository } from "../commands/postgres-commanding.repository.js";
import type { BrokerOutboxService } from "../broker/broker-outbox.service.js";

export class GatewayIntegrationService {
  private defaultsEnsured = false;

  constructor(
    private readonly repository: PostgresGatewayRepository,
    private readonly actionExecutionService: ActionExecutionService,
    private readonly commandingRepository?: PostgresCommandingRepository,
    private readonly brokerOutboxService?: BrokerOutboxService
  ) {}

  async listAgents(filters: { tenantId?: string; siteId?: string; limit?: number }) {
    await this.ensureDefaults();
    return this.repository.listAgents(filters);
  }

  async getAgent(agentId: string) {
    await this.ensureDefaults();
    return this.repository.getAgent(agentId);
  }

  async heartbeat(agentId: string, sharedKey: string, _input: GatewayHeartbeatInput) {
    await this.ensureDefaults();
    const agent = await this.repository.authenticateAgent(agentId, sharedKey);
    if (!agent) {
      return undefined;
    }

    const updated = await this.repository.heartbeat(agentId);
    return updated;
  }

  async pullDispatches(agentId: string, sharedKey: string, limit = 20) {
    await this.ensureDefaults();
    const agent = await this.repository.authenticateAgent(agentId, sharedKey);
    if (!agent) {
      return undefined;
    }

    const messages = this.brokerOutboxService
      ? await this.brokerOutboxService.claimMessagesForAgent(agent, limit)
      : [];

    const dispatches = messages.map((message) => message.payload);

    await Promise.all(
      messages.map((message) =>
        this.repository.createReceipt({
          dispatchId: message.dispatchId,
          agentId: agent.agentId,
          eventType: "claimed",
          status: "sent",
          detail: {
            messageId: message.messageId,
            claimCount: message.claimCount,
            topic: message.topic
          }
        })
      )
    );

    return {
      agent,
      messages,
      dispatches
    };
  }

  async submitDispatchResult(agentId: string, sharedKey: string, dispatchId: string, input: GatewayDispatchResultInput) {
    await this.ensureDefaults();
    const agent = await this.repository.authenticateAgent(agentId, sharedKey);
    if (!agent) {
      return undefined;
    }

    const dispatch = await this.repository.getDispatch(dispatchId);
    if (!dispatch) {
      return null;
    }

    if ((dispatch.site_id as string) !== agent.siteId) {
      throw new Error(`Dispatch ${dispatchId} does not belong to agent site ${agent.siteId}`);
    }

    const updatedDispatch = await this.repository.updateDispatchResult(
      dispatchId,
      input.success ? "succeeded" : "failed",
      input.resultSummary
    );

    await this.repository.createReceipt({
      dispatchId,
      agentId: agent.agentId,
      eventType: "result",
      status: input.success ? "succeeded" : "failed",
      detail: input.detail
    });

    if (this.brokerOutboxService) {
      await this.brokerOutboxService.ackDispatch(dispatchId);
    }

    let executionResult:
      | Awaited<ReturnType<ActionExecutionService["completeExecution"]>>
      | undefined;

    if (input.success) {
      const executionId = dispatch.execution_id as string | null;
      executionResult = executionId
        ? await this.actionExecutionService.completeExecution(executionId, {
            actor: `gateway:${agent.agentId}`,
            success: true,
            resultSummary: input.resultSummary
          }).catch(() => undefined)
        : undefined;

      if (this.commandingRepository) {
        await this.commandingRepository.resolveIncidentsForDispatch(dispatchId).catch(() => undefined);
      }
    }

    return {
      agent,
      dispatch: updatedDispatch,
      executionResult
    };
  }

  async listReceipts(dispatchId: string) {
    await this.ensureDefaults();
    return this.repository.listReceipts(dispatchId);
  }

  async getPendingDispatchCountsBySite(siteIds?: string[]) {
    await this.ensureDefaults();
    return this.repository.getPendingDispatchCountsBySite(siteIds);
  }

  private async ensureDefaults() {
    if (this.defaultsEnsured) {
      return;
    }

    await this.repository.ensureDefaults(defaultGatewayAgents);
    this.defaultsEnsured = true;
  }
}
