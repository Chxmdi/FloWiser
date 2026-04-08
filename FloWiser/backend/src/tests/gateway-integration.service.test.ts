import assert from "node:assert/strict";
import test from "node:test";
import { GatewayIntegrationService } from "../modules/gateway/gateway-integration.service.js";

class FakeGatewayRepository {
  agent = {
    agentId: "gateway-agent-lagos-hq",
    tenantId: "tenant-1",
    branchId: "branch-1",
    siteId: "site-1",
    displayName: "Lagos HQ Gateway",
    sharedKey: "secret",
    supportedActionTypes: ["schedule_adjustment"],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  dispatch = {
    dispatch_id: "dispatch-1",
    execution_id: "exec-1",
    site_id: "site-1",
    command_payload: { commands: [] },
    dispatch_channel: "simulated_gateway"
  };
  receipts: any[] = [];
  async ensureDefaults() {}
  async listAgents() { return [this.agent]; }
  async getAgent() { return this.agent; }
  async authenticateAgent(agentId: string, sharedKey: string) {
    return agentId === this.agent.agentId && sharedKey === this.agent.sharedKey ? this.agent : undefined;
  }
  async heartbeat() { return this.agent; }
  async listPendingDispatchesForAgent() { return [this.dispatch]; }
  async getDispatch(dispatchId: string) { return dispatchId === this.dispatch.dispatch_id ? this.dispatch : undefined; }
  async updateDispatchResult(dispatchId: string, status: string, resultSummary: string) {
    return { ...this.dispatch, dispatch_id: dispatchId, dispatch_status: status, result_summary: resultSummary };
  }
  async createReceipt(input: any) {
    const receipt = { receiptId: `receipt-${this.receipts.length + 1}`, createdAt: new Date().toISOString(), ...input };
    this.receipts.push(receipt);
    return receipt;
  }
  async listReceipts() { return this.receipts; }
}

class FakeActionExecutionService {
  execution = { executionId: "exec-1", status: "ready" };
  async completeExecution(_executionId: string, input: { success: boolean; resultSummary: string }) {
    this.execution.status = input.success ? "executed" : "failed";
    return { execution: this.execution, approvals: [] };
  }
}

test("allows gateway agent to pull queued dispatches", async () => {
  const service = new GatewayIntegrationService(new FakeGatewayRepository() as any, new FakeActionExecutionService() as any);
  const result = await service.pullDispatches("gateway-agent-lagos-hq", "secret", 10);

  assert.equal(result?.dispatches.length, 1);
});

test("accepts gateway result and completes execution", async () => {
  const executionService = new FakeActionExecutionService();
  const service = new GatewayIntegrationService(new FakeGatewayRepository() as any, executionService as any);
  const result = await service.submitDispatchResult("gateway-agent-lagos-hq", "secret", "dispatch-1", {
    success: true,
    resultSummary: "Gateway applied schedule patch",
    detail: { ack: true }
  });

  assert.equal(result?.dispatch?.dispatch_status, "succeeded");
  assert.equal(executionService.execution.status, "executed");
});
