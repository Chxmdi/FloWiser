import assert from "node:assert/strict";
import test from "node:test";
import { GatewayOperationsService } from "../modules/operations/gateway-operations.service.js";

class FakeCommandingRepository {
  dispatches = [
    {
      dispatchId: "dispatch-1",
      executionId: "exec-1",
      actionId: "action-1",
      templateId: "template-1",
      tenantId: "tenant-1",
      branchId: "branch-1",
      siteId: "site-1",
      dispatchChannel: "simulated_gateway",
      executionMode: "automated",
      dispatchStatus: "failed",
      requestedBy: "ops-manager",
      commandPayload: { templateId: "template-1", actionType: "schedule_adjustment", dispatchChannel: "simulated_gateway", commands: [] },
      simulationResult: { success: true, warnings: [], estimatedImpact: { monthlySavings: 1, dieselSavings: 0 }, summary: "ok" },
      requestedAt: new Date().toISOString(),
      dispatchedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      attemptCount: 1,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      dispatchId: "dispatch-2",
      executionId: "exec-2",
      actionId: "action-2",
      templateId: "template-1",
      tenantId: "tenant-1",
      branchId: "branch-1",
      siteId: "site-1",
      dispatchChannel: "simulated_gateway",
      executionMode: "automated",
      dispatchStatus: "failed",
      requestedBy: "ops-manager",
      commandPayload: { templateId: "template-1", actionType: "schedule_adjustment", dispatchChannel: "simulated_gateway", commands: [] },
      simulationResult: { success: true, warnings: [], estimatedImpact: { monthlySavings: 1, dieselSavings: 0 }, summary: "ok" },
      requestedAt: new Date().toISOString(),
      dispatchedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      attemptCount: 3,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  incidents: any[] = [];
  deadLetters: any[] = [];
  async getDispatch(dispatchId: string) { return this.dispatches.find((item) => item.dispatchId === dispatchId); }
  async scheduleRetry(dispatchId: string, nextAttemptAt: string, reason: string) {
    const dispatch = await this.getDispatch(dispatchId);
    if (!dispatch) return undefined;
    dispatch.dispatchStatus = "retry_scheduled";
    dispatch.nextAttemptAt = nextAttemptAt;
    dispatch.lastError = reason;
    return dispatch;
  }
  async markDeadLetter(dispatchId: string, reason: string) {
    const dispatch = await this.getDispatch(dispatchId);
    if (!dispatch) return undefined;
    dispatch.dispatchStatus = "dead_lettered";
    dispatch.deadLetterReason = reason;
    return dispatch;
  }
  async listRetryCandidates() { return this.dispatches; }
  async createIncident(input: any) {
    const incident = { incidentId: `incident-${this.incidents.length + 1}`, createdAt: new Date().toISOString(), ...input };
    this.incidents.push(incident);
    return incident;
  }
  async listIncidents() { return this.incidents; }
  async createDeadLetter(input: any) {
    const deadLetter = { deadLetterId: `dead-${this.deadLetters.length + 1}`, createdAt: new Date().toISOString(), ...input };
    this.deadLetters.push(deadLetter);
    return deadLetter;
  }
  async listDeadLetters() { return this.deadLetters; }
}

class FakeGatewayIntegrationService {
  async listAgents() {
    return [{ agentId: "gateway-agent-1", siteId: "site-1", displayName: "Gateway 1", lastSeenAt: new Date().toISOString(), supportedActionTypes: ["schedule_adjustment"] }];
  }
  async getPendingDispatchCountsBySite() {
    return { "site-1": 2 };
  }
}

class FakeActionExecutionService {
  completions: any[] = [];
  async completeExecution(executionId: string, input: any) {
    this.completions.push({ executionId, ...input });
    return { execution: { executionId, status: input.success ? "executed" : "failed" }, approvals: [] };
  }
}

test("retry sweep schedules retry and dead-letters exhausted dispatches", async () => {
  const commandingRepository = new FakeCommandingRepository();
  const actionExecutionService = new FakeActionExecutionService();
  const service = new GatewayOperationsService(
    commandingRepository as any,
    new FakeGatewayIntegrationService() as any,
    actionExecutionService as any
  );

  const result = await service.runRetrySweep({ actor: "platform-admin" });

  assert.equal(result.retryScheduledCount, 1);
  assert.equal(result.deadLetteredCount, 1);
  assert.equal(actionExecutionService.completions.length, 1);
});

