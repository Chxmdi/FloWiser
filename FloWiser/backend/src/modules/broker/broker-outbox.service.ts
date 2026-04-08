import type { BrokerMessageRecord } from "./broker.types.js";
import { PostgresBrokerRepository } from "./postgres-broker.repository.js";
import type { GatewayAgent } from "../gateway/gateway.types.js";
import type { CommandDispatchRecord } from "../commands/command.types.js";

const DISPATCH_TOPIC = "gateway.dispatch.commands";

export class BrokerOutboxService {
  constructor(private readonly repository: PostgresBrokerRepository) {}

  async publishDispatch(dispatch: CommandDispatchRecord) {
    return this.repository.createMessage({
      topic: DISPATCH_TOPIC,
      routingKey: `${dispatch.tenantId}.${dispatch.siteId}`,
      dispatchId: dispatch.dispatchId,
      siteId: dispatch.siteId,
      deviceId: dispatch.deviceId,
      payload: {
        dispatchId: dispatch.dispatchId,
        executionId: dispatch.executionId,
        templateId: dispatch.templateId,
        siteId: dispatch.siteId,
        deviceId: dispatch.deviceId,
        dispatchChannel: dispatch.dispatchChannel,
        attemptCount: dispatch.attemptCount,
        maxAttempts: dispatch.maxAttempts,
        commandPayload: dispatch.commandPayload
      },
      status: "pending"
    });
  }

  async republishDispatch(dispatch: CommandDispatchRecord) {
    return this.publishDispatch(dispatch);
  }

  async listMessages(filters: { topic?: string; status?: string; siteId?: string; dispatchId?: string; limit?: number }) {
    return this.repository.listMessages(filters);
  }

  async getMessage(messageId: string) {
    return this.repository.getMessage(messageId);
  }

  async claimMessagesForAgent(agent: GatewayAgent, limit = 20) {
    return this.repository.claimMessagesForAgent(agent, DISPATCH_TOPIC, limit);
  }

  async ackDispatch(dispatchId: string) {
    return this.repository.ackByDispatch(dispatchId);
  }

  async deadLetterDispatch(dispatchId: string, reason: string) {
    return this.repository.deadLetterByDispatch(dispatchId, reason);
  }

  async getStatusCounts() {
    return this.repository.countByStatus();
  }
}
