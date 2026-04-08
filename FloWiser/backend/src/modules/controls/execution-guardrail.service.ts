import type { RecommendationRecord } from "../recommendations/recommendation.types.js";
import type { GuardrailOutcome, ExecutionMode } from "./control.types.js";
import type { PostgresControlsRepository } from "./postgres-controls.repository.js";

const ageHoursBetween = (from: string, to: string) =>
  Math.max(0, (Date.parse(to) - Date.parse(from)) / (1000 * 60 * 60));

export class ExecutionGuardrailService {
  constructor(private readonly repository: PostgresControlsRepository) {}

  async evaluate(recommendation: RecommendationRecord, executionMode: ExecutionMode): Promise<GuardrailOutcome> {
    const policy = await this.repository.findPolicy(recommendation.actionType, recommendation.recommendationMode);
    const blocks: string[] = [];
    const warnings: string[] = [];
    const criticalAlertCount = await this.repository.countCriticalOpenAlerts(recommendation.siteId);
    const recommendationAgeHours = Math.round(ageHoursBetween(recommendation.lastSeenAt, new Date().toISOString()));

    if (!policy) {
      blocks.push(`No control policy exists for ${recommendation.actionType}/${recommendation.recommendationMode}`);
    } else {
      if (!policy.enabled) {
        blocks.push(`Control policy ${policy.policyId} is disabled`);
      }

      if (!policy.allowedExecutionModes.includes(executionMode)) {
        blocks.push(`Execution mode ${executionMode} is not allowed by policy ${policy.policyId}`);
      }

      if (recommendationAgeHours > policy.maxRecommendationAgeHours && executionMode !== "dry_run") {
        blocks.push(`Recommendation is older than ${policy.maxRecommendationAgeHours} hours`);
      }

      if (recommendation.confidenceScore < policy.minConfidenceScore && executionMode !== "dry_run") {
        blocks.push(`Confidence score ${recommendation.confidenceScore} is below policy minimum ${policy.minConfidenceScore}`);
      }

      if (criticalAlertCount > policy.maxOpenCriticalAlerts && executionMode !== "dry_run") {
        blocks.push(`Site has ${criticalAlertCount} critical open alerts, above policy maximum ${policy.maxOpenCriticalAlerts}`);
      }

      if (policy.requiresTwoPerson && executionMode === "manual") {
        warnings.push("This action requires two distinct execution approvals before completion.");
      }
    }

    if (recommendation.status === "rejected" || recommendation.status === "resolved") {
      blocks.push(`Recommendation is already ${recommendation.status}`);
    }

    if (recommendation.approvalStatus === "rejected") {
      blocks.push("Recommendation approval was rejected");
    }

    if (recommendation.recommendationMode === "approval_required" && recommendation.approvalStatus !== "approved" && executionMode !== "dry_run") {
      blocks.push("Recommendation still needs business approval before execution");
    }

    if (executionMode === "automated" && !recommendation.automationPossible) {
      blocks.push("Recommendation is not marked as automation-safe");
    }

    if (executionMode === "automated" && recommendation.failureRiskScore >= 60) {
      blocks.push("Failure risk is too high for automated execution");
    }

    return {
      ready: blocks.length === 0,
      blocks,
      warnings,
      policyId: policy?.policyId,
      policyName: policy?.name,
      snapshot: {
        criticalAlertCount,
        recommendationAgeHours,
        confidenceScore: recommendation.confidenceScore,
        recommendationStatus: recommendation.status,
        approvalStatus: recommendation.approvalStatus
      }
    };
  }
}
