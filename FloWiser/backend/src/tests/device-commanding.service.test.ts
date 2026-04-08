import assert from "node:assert/strict";
import test from "node:test";
import { defaultCommandTemplates } from "../modules/commands/default-command-templates.js";
import { DeviceCommandingService } from "../modules/commands/device-commanding.service.js";
import { SimulatedCommandExecutorService } from "../modules/commands/simulated-command-executor.service.js";

class FakeCommandingRepository {
  templates = [...defaultCommandTemplates];
  dispatches: any[] = [];

  async ensureDefaults() {}
  async listTemplates() { return this.templates; }
  async getTemplate(templateId: string) { return this.templates.find((item) => item.templateId === templateId); }
  async findTemplateByActionType(actionType: string) { return this.templates.find((item) => item.actionType === actionType); }
  async createDispatch(input: any) {
    const record = {
      dispatchId: `dispatch-${this.dispatches.length + 1}`,
      createdAt: input.requestedAt,
      updatedAt: input.requestedAt,
      ...input
    };
    this.dispatches.push(record);
    return record;
  }
  async updateDispatch() { throw new Error("unused"); }
  async listDispatches() { return this.dispatches; }
  async getDispatch(dispatchId: string) { return this.dispatches.find((item) => item.dispatchId === dispatchId); }
}

class FakeActionExecutionService {
  execution = {
    executionId: "exec-1",
    actionId: "11111111-1111-4111-8111-111111111111",
    tenantId: "tenant-1",
    branchId: "branch-1",
    siteId: "site-1",
    deviceId: "device-1",
    actionType: "schedule_adjustment",
    recommendationMode: "approval_required",
    executionMode: "automated",
    status: "ready",
    requestedBy: "ops-manager",
    guardrailOutcome: {
      ready: true,
      blocks: [],
      warnings: [],
      policyId: "schedule_adjustment_approval_required",
      policyName: "Schedule adjustment guardrail",
      snapshot: {
        criticalAlertCount: 0,
        recommendationAgeHours: 1,
        confidenceScore: 86,
        recommendationStatus: "open",
        approvalStatus: "approved"
      }
    },
    approvalCount: 1,
    requestedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  approvals = [{ approvalId: "approval-1", executionId: "exec-1", approver: "director-1", approvedAt: new Date().toISOString(), createdAt: new Date().toISOString() }];
  async getExecution(executionId: string) {
    return executionId === this.execution.executionId ? { execution: this.execution, approvals: this.approvals } : undefined;
  }
  async completeExecution(_executionId: string, input: { success: boolean; resultSummary: string }) {
    this.execution.status = input.success ? "executed" : "failed";
    return { execution: this.execution, approvals: this.approvals };
  }
}

class FakeRecommendationEngineService {
  recommendation = {
    actionId: "11111111-1111-4111-8111-111111111111",
    recommendationKey: "schedule_adjustment:site-1:device-1",
    tenantId: "tenant-1",
    branchId: "branch-1",
    siteId: "site-1",
    deviceId: "device-1",
    eventId: "22222222-2222-4222-8222-222222222222",
    ruleId: "after_hours_baseload_waste",
    rootCauseKey: "always_on_loads_after_hours",
    rootCauseLabel: "Always-on loads after hours",
    likelyCause: "Loads remain on after hours",
    title: "Cut after-hours baseload",
    summary: "Reduce overnight load",
    actionType: "schedule_adjustment",
    recommendationMode: "approval_required",
    approvalStatus: "approved",
    status: "open",
    automationPossible: true,
    effortScore: 18,
    confidenceScore: 86,
    savingsScore: 72,
    dieselScore: 20,
    uptimeImpactScore: 25,
    failureRiskScore: 20,
    priorityScore: 68,
    expectedMonthlySavings: 120000,
    expectedDieselSavings: 0,
    evidence: {},
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  async getRecommendation(actionId: string) {
    return actionId === this.recommendation.actionId ? this.recommendation : undefined;
  }
}

test("creates a command plan and planned dispatch", async () => {
  const service = new DeviceCommandingService(
    new FakeCommandingRepository() as any,
    new FakeActionExecutionService() as any,
    new FakeRecommendationEngineService() as any,
    new SimulatedCommandExecutorService()
  );

  const result = await service.planExecution("exec-1", { actor: "ops-manager" });

  assert.equal(result?.dispatch.dispatchStatus, "planned");
  assert.ok(result?.commandPlan.commands.length);
});

test("queues a ready simulated gateway execution for agent pickup", async () => {
  const actionExecutionService = new FakeActionExecutionService();
  const service = new DeviceCommandingService(
    new FakeCommandingRepository() as any,
    actionExecutionService as any,
    new FakeRecommendationEngineService() as any,
    new SimulatedCommandExecutorService()
  );

  const result = await service.dispatchExecution("exec-1", { actor: "ops-manager" });

  assert.equal(result?.dispatch.dispatchStatus, "sent");
  assert.equal(actionExecutionService.execution.status, "ready");
});
