import assert from "node:assert/strict";
import test from "node:test";
import { ActionExecutionService } from "../modules/controls/action-execution.service.js";
import { ExecutionGuardrailService } from "../modules/controls/execution-guardrail.service.js";
import { defaultControlPolicies } from "../modules/controls/default-policies.js";

class FakeControlsRepository {
  policies = [...defaultControlPolicies];
  executions: any[] = [];
  approvals: any[] = [];
  criticalAlerts = 0;

  async ensureDefaults() {}
  async listPolicies() { return this.policies; }
  async getPolicy(policyId: string) { return this.policies.find((policy) => policy.policyId === policyId); }
  async findPolicy(actionType: string, recommendationMode: string) {
    return this.policies.find((policy) => policy.actionType === actionType && policy.recommendationMode === recommendationMode);
  }
  async updatePolicy(policyId: string, patch: any) {
    const index = this.policies.findIndex((policy) => policy.policyId === policyId);
    if (index === -1) return undefined;
    this.policies[index] = { ...this.policies[index], ...patch };
    return this.policies[index];
  }
  async countCriticalOpenAlerts() { return this.criticalAlerts; }
  async createExecutionRequest(input: any) {
    const record = {
      executionId: `exec-${this.executions.length + 1}`,
      approvalCount: 0,
      createdAt: input.requestedAt,
      updatedAt: input.requestedAt,
      ...input
    };
    this.executions.push(record);
    return record;
  }
  async listExecutionRequests() { return this.executions; }
  async getExecutionRequest(executionId: string) { return this.executions.find((item) => item.executionId === executionId); }
  async updateExecutionRequest(executionId: string, patch: any) {
    const index = this.executions.findIndex((item) => item.executionId === executionId);
    if (index === -1) return undefined;
    this.executions[index] = { ...this.executions[index], ...patch, approvalCount: this.approvals.filter((approval) => approval.executionId === executionId).length };
    return this.executions[index];
  }
  async createApproval(input: any) {
    const exists = this.approvals.find((approval) => approval.executionId === input.executionId && approval.approver === input.approver);
    if (exists) return undefined;
    const approval = { approvalId: `approval-${this.approvals.length + 1}`, createdAt: input.approvedAt, ...input };
    this.approvals.push(approval);
    return approval;
  }
  async listApprovals(executionId: string) {
    return this.approvals.filter((approval) => approval.executionId === executionId);
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
    return this.recommendation.actionId === actionId ? this.recommendation : undefined;
  }
  async resolveRecommendation() {
    this.recommendation.status = "resolved";
    return this.recommendation;
  }
}

test("creates pending approval execution for approved guarded action", async () => {
  const repository = new FakeControlsRepository();
  const recommendationService = new FakeRecommendationEngineService();
  const service = new ActionExecutionService(
    repository as any,
    recommendationService as any,
    new ExecutionGuardrailService(repository as any)
  );

  const result = await service.requestExecution({
    actionId: recommendationService.recommendation.actionId,
    actor: "ops-manager",
    executionMode: "automated",
    note: "Request automated schedule update"
  });

  assert.equal(result?.execution.status, "pending_approval");
  assert.equal(result?.guardrailOutcome.ready, true);
});

test("moves execution to ready after approval threshold is met", async () => {
  const repository = new FakeControlsRepository();
  const recommendationService = new FakeRecommendationEngineService();
  const service = new ActionExecutionService(
    repository as any,
    recommendationService as any,
    new ExecutionGuardrailService(repository as any)
  );

  const created = await service.requestExecution({
    actionId: recommendationService.recommendation.actionId,
    actor: "ops-manager",
    executionMode: "manual"
  });

  const approved = await service.addApproval(created!.execution.executionId, {
    actor: "director-1",
    role: "director"
  });

  assert.equal(approved?.execution.status, "ready");
});

test("blocks execution when critical alerts exceed guardrail threshold", async () => {
  const repository = new FakeControlsRepository();
  repository.criticalAlerts = 2;
  const recommendationService = new FakeRecommendationEngineService();
  const service = new ActionExecutionService(
    repository as any,
    recommendationService as any,
    new ExecutionGuardrailService(repository as any)
  );

  const result = await service.requestExecution({
    actionId: recommendationService.recommendation.actionId,
    actor: "ops-manager",
    executionMode: "manual"
  });

  assert.equal(result?.execution.status, "blocked");
  assert.ok(result?.guardrailOutcome.blocks[0].includes("critical"));
});
