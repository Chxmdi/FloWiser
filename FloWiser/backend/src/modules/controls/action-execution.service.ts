import type { RecommendationEngineService } from "../recommendations/recommendation-engine.service.js";
import type { ExecutionApprovalInput, ExecutionCompleteInput, ExecutionRequestInput } from "./control.types.js";
import { defaultControlPolicies } from "./default-policies.js";
import { ExecutionGuardrailService } from "./execution-guardrail.service.js";
import { PostgresControlsRepository } from "./postgres-controls.repository.js";

export class ActionExecutionService {
  private defaultsEnsured = false;

  constructor(
    private readonly repository: PostgresControlsRepository,
    private readonly recommendationEngineService: RecommendationEngineService,
    private readonly guardrailService: ExecutionGuardrailService
  ) {}

  async listPolicies() {
    await this.ensureDefaults();
    return this.repository.listPolicies();
  }

  async getPolicy(policyId: string) {
    await this.ensureDefaults();
    return this.repository.getPolicy(policyId);
  }

  async updatePolicy(policyId: string, patch: Parameters<PostgresControlsRepository["updatePolicy"]>[1]) {
    await this.ensureDefaults();
    return this.repository.updatePolicy(policyId, patch);
  }

  async listExecutions(filters: { siteId?: string; status?: string; actionId?: string; limit?: number }) {
    await this.ensureDefaults();
    return this.repository.listExecutionRequests(filters);
  }

  async getExecution(executionId: string) {
    await this.ensureDefaults();
    const execution = await this.repository.getExecutionRequest(executionId);
    if (!execution) {
      return undefined;
    }
    const approvals = await this.repository.listApprovals(executionId);
    return { execution, approvals };
  }

  async requestExecution(input: ExecutionRequestInput) {
    await this.ensureDefaults();
    const recommendation = await this.recommendationEngineService.getRecommendation(input.actionId);
    if (!recommendation) {
      return undefined;
    }

    const guardrailOutcome = await this.guardrailService.evaluate(recommendation, input.executionMode);
    const policy = guardrailOutcome.policyId ? await this.repository.getPolicy(guardrailOutcome.policyId) : undefined;

    let status: import("./control.types.js").ExecutionStatus;
    if (input.executionMode === "dry_run") {
      status = "dry_run_evaluated";
    } else if (!guardrailOutcome.ready) {
      status = "blocked";
    } else if ((policy?.minExecutionApprovals ?? 0) > 0) {
      status = "pending_approval";
    } else {
      status = "ready";
    }

    const execution = await this.repository.createExecutionRequest({
      actionId: recommendation.actionId,
      tenantId: recommendation.tenantId,
      branchId: recommendation.branchId,
      siteId: recommendation.siteId,
      deviceId: recommendation.deviceId,
      actionType: recommendation.actionType,
      recommendationMode: recommendation.recommendationMode,
      executionMode: input.executionMode,
      status,
      requestedBy: input.actor,
      note: input.note,
      policyId: policy?.policyId,
      guardrailOutcome,
      requestedAt: new Date().toISOString()
    });

    return { recommendation, execution, policy, guardrailOutcome };
  }

  async addApproval(executionId: string, input: ExecutionApprovalInput) {
    await this.ensureDefaults();
    const execution = await this.repository.getExecutionRequest(executionId);
    if (!execution) {
      return undefined;
    }

    if (!["pending_approval", "ready"].includes(execution.status)) {
      throw new Error(`Execution ${executionId} is not awaiting approvals`);
    }

    await this.repository.createApproval({
      executionId,
      approver: input.actor,
      role: input.role,
      note: input.note,
      approvedAt: new Date().toISOString()
    });

    const approvals = await this.repository.listApprovals(executionId);
    const policy = execution.policyId ? await this.repository.getPolicy(execution.policyId) : undefined;

    let nextExecution = execution;
    if (policy && approvals.length >= policy.minExecutionApprovals && execution.status !== "ready") {
      nextExecution = (await this.repository.updateExecutionRequest(executionId, { status: "ready" })) ?? execution;
    }

    return { execution: nextExecution, approvals, policy };
  }

  async completeExecution(executionId: string, input: ExecutionCompleteInput) {
    await this.ensureDefaults();
    const execution = await this.repository.getExecutionRequest(executionId);
    if (!execution) {
      return undefined;
    }

    if (execution.status !== "ready") {
      throw new Error(`Execution ${executionId} is not ready to complete`);
    }

    const timestamp = new Date().toISOString();
    const updated = await this.repository.updateExecutionRequest(executionId, {
      status: input.success ? "executed" : "failed",
      resultSummary: input.resultSummary,
      executedAt: timestamp,
      completedAt: timestamp
    });

    if (input.success) {
      await this.recommendationEngineService.resolveRecommendation(execution.actionId, {
        actor: input.actor,
        note: input.resultSummary
      });
    }

    const approvals = await this.repository.listApprovals(executionId);
    return updated ? { execution: updated, approvals } : undefined;
  }

  private async ensureDefaults() {
    if (this.defaultsEnsured) {
      return;
    }

    await this.repository.ensureDefaults(defaultControlPolicies);
    this.defaultsEnsured = true;
  }
}
