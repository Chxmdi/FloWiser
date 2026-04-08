import { defaultGatewayAgents } from "./default-gateway-agents.js";
import type { GatewayDispatchResultInput, GatewayHeartbeatInput } from "./gateway.types.js";
import { PostgresGatewayRepository } from "./postgres-gateway.repository.js";
import type { ActionExecutionService } from "../controls/action-execution.service.js";

export class GatewayIntegrationService {
  private defaultsEnsured = false;

  constructor(
    private readonly repository: PostgresGatewayRepository,
    private readonly actionExecutionService: ActionExecutionService
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

    const dispatches = await this.repository.listPendingDispatchesForAgent(agent, limit);
    await Promise.all(
      dispatches.map((dispatch) =>
        this.repository.createReceipt({
          dispatchId: dispatch.dispatch_id as string,
          agentId: agent.agentId,
          eventType: "claimed",
          status: "sent",
          detail: {
            commandPayload: dispatch.command_payload,
            dispatchChannel: dispatch.dispatch_channel
          }
        })
      )
    );

    return {
      agent,
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

    const executionId = dispatch.execution_id as string | null;
    const executionResult = executionId
      ? await this.actionExecutionService.completeExecution(executionId, {
          actor: `gateway:${agent.agentId}`,
          success: input.success,
          resultSummary: input.resultSummary
        }).catch(() => undefined)
      : undefined;

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

  private async ensureDefaults() {
    if (this.defaultsEnsured) {
      return;
    }

    await this.repository.ensureDefaults(defaultGatewayAgents);
    this.defaultsEnsured = true;
  }
}
