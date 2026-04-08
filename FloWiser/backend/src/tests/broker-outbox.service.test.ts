import assert from "node:assert/strict";
import test from "node:test";
import { BrokerOutboxService } from "../modules/broker/broker-outbox.service.js";

class FakeBrokerRepository {
  messages: any[] = [];
  async createMessage(input: any) {
    const message = {
      messageId: `msg-${this.messages.length + 1}`,
      claimCount: 0,
      publishedAt: new Date().toISOString(),
      ...input
    };
    this.messages.push(message);
    return message;
  }
  async listMessages() { return this.messages; }
  async getMessage(messageId: string) { return this.messages.find((message) => message.messageId === messageId); }
  async claimMessagesForAgent(_agent: any, _topic: string, limit: number) {
    const selected = this.messages.filter((message) => message.status === "pending").slice(0, limit).map((message) => {
      message.status = "claimed";
      message.claimCount += 1;
      return message;
    });
    return selected;
  }
  async ackByDispatch(dispatchId: string) {
    return this.messages.filter((message) => message.dispatchId === dispatchId).map((message) => {
      message.status = "acked";
      return message;
    });
  }
  async deadLetterByDispatch(dispatchId: string, reason: string) {
    return this.messages.filter((message) => message.dispatchId === dispatchId).map((message) => {
      message.status = "dead_lettered";
      message.lastError = reason;
      return message;
    });
  }
  async countByStatus() {
    return this.messages.reduce<Record<string, number>>((acc, message) => {
      acc[message.status] = (acc[message.status] ?? 0) + 1;
      return acc;
    }, {});
  }
}

test("publishes and claims broker messages for gateway dispatch delivery", async () => {
  const service = new BrokerOutboxService(new FakeBrokerRepository() as any);
  await service.publishDispatch({
    dispatchId: "dispatch-1",
    executionId: "exec-1",
    templateId: "template-1",
    tenantId: "tenant-1",
    branchId: "branch-1",
    siteId: "site-1",
    deviceId: "device-1",
    dispatchChannel: "simulated_gateway",
    executionMode: "automated",
    dispatchStatus: "sent",
    requestedBy: "ops-manager",
    commandPayload: { templateId: "template-1", actionType: "schedule_adjustment", dispatchChannel: "simulated_gateway", commands: [] },
    simulationResult: { success: true, warnings: [], estimatedImpact: { monthlySavings: 100, dieselSavings: 0 }, summary: "ok" },
    requestedAt: new Date().toISOString(),
    attemptCount: 0,
    maxAttempts: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any);

  const claimed = await service.claimMessagesForAgent({ siteId: "site-1" } as any, 10);
  assert.equal(claimed.length, 1);
  assert.equal(claimed[0].status, "claimed");
});
