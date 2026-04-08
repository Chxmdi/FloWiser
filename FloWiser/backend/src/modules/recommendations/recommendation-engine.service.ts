import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { RuleExecutionTrace } from "../rules/rule.types.js";
import { RootCauseService } from "./root-cause.service.js";
import { PostgresRecommendationRepository } from "./postgres-recommendation.repository.js";
import type { RecommendationDecisionInput } from "./recommendation.types.js";

const calculatePriorityScore = (input: {
  savingsScore: number;
  dieselScore: number;
  uptimeImpactScore: number;
  failureRiskScore: number;
  confidenceScore: number;
  effortScore: number;
}) => {
  return Number(
    (
      input.savingsScore * 0.35 +
      input.dieselScore * 0.2 +
      input.failureRiskScore * 0.2 +
      input.uptimeImpactScore * 0.15 +
      input.confidenceScore * 0.1 -
      input.effortScore * 0.1
    ).toFixed(2)
  );
};

export class RecommendationEngineService {
  constructor(
    private readonly repository: PostgresRecommendationRepository,
    private readonly rootCauseService: RootCauseService
  ) {}

  async generateFromRuleTraces(event: CanonicalTelemetryEvent, matchedRules: RuleExecutionTrace[]) {
    const recommendations = [];

    for (const trace of matchedRules) {
      const classification = this.rootCauseService.classify(trace, event);
      const recommendation = await this.repository.upsertRecommendation({
        recommendationKey: `${trace.ruleId}:${event.siteId}:${event.deviceId}`,
        tenantId: event.tenantId,
        branchId: event.branchId,
        siteId: event.siteId,
        deviceId: event.deviceId,
        eventId: event.eventId,
        ruleId: trace.ruleId,
        rootCauseKey: classification.rootCauseKey,
        rootCauseLabel: classification.rootCauseLabel,
        likelyCause: classification.likelyCause,
        title: classification.title,
        summary: classification.summary,
        actionType: classification.actionType,
        recommendationMode: classification.recommendationMode,
        approvalStatus:
          classification.recommendationMode === "advisory" ? "not_required" : "pending",
        status: "open",
        automationPossible: classification.automationPossible,
        effortScore: classification.effortScore,
        confidenceScore: classification.confidenceScore,
        savingsScore: classification.savingsScore,
        dieselScore: classification.dieselScore,
        uptimeImpactScore: classification.uptimeImpactScore,
        failureRiskScore: classification.failureRiskScore,
        priorityScore: calculatePriorityScore(classification),
        expectedMonthlySavings: classification.expectedMonthlySavings,
        expectedDieselSavings: classification.expectedDieselSavings,
        evidence: {
          ...classification.evidence,
          ruleTitle: trace.title,
          ruleSummary: trace.summary
        },
        lastSeenAt: event.receivedAt
      });
      recommendations.push(recommendation);
    }

    recommendations.sort((left, right) => right.priorityScore - left.priorityScore);
    return recommendations;
  }

  async listRecommendations(filters: {
    siteId?: string;
    deviceId?: string;
    status?: string;
    approvalStatus?: string;
    ruleId?: string;
    limit?: number;
  }) {
    return this.repository.listRecommendations(filters);
  }

  async getRecommendation(actionId: string) {
    return this.repository.getRecommendation(actionId);
  }

  async approveRecommendation(actionId: string, input: RecommendationDecisionInput) {
    return this.repository.applyDecision(actionId, "approve", input);
  }

  async rejectRecommendation(actionId: string, input: RecommendationDecisionInput) {
    return this.repository.applyDecision(actionId, "reject", input);
  }

  async resolveRecommendation(actionId: string, input?: RecommendationDecisionInput) {
    return this.repository.applyDecision(actionId, "resolve", input);
  }
}
