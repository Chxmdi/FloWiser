import { z } from "zod";

export const recommendationModeSchema = z.enum(["advisory", "approval_required", "automatable"]);
export type RecommendationMode = z.infer<typeof recommendationModeSchema>;

export const recommendationApprovalStatusSchema = z.enum([
  "not_required",
  "pending",
  "approved",
  "rejected"
]);
export type RecommendationApprovalStatus = z.infer<typeof recommendationApprovalStatusSchema>;

export const recommendationStatusSchema = z.enum(["open", "approved", "rejected", "resolved"]);
export type RecommendationStatus = z.infer<typeof recommendationStatusSchema>;

export const recommendationDecisionSchema = z.object({
  actor: z.string().min(1),
  note: z.string().min(1).optional()
});
export type RecommendationDecisionInput = z.infer<typeof recommendationDecisionSchema>;

export type RecommendationRecord = {
  actionId: string;
  recommendationKey: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  deviceId?: string;
  eventId: string;
  ruleId: string;
  rootCauseKey: string;
  rootCauseLabel: string;
  likelyCause: string;
  title: string;
  summary: string;
  actionType: string;
  recommendationMode: RecommendationMode;
  approvalStatus: RecommendationApprovalStatus;
  status: RecommendationStatus;
  automationPossible: boolean;
  effortScore: number;
  confidenceScore: number;
  savingsScore: number;
  dieselScore: number;
  uptimeImpactScore: number;
  failureRiskScore: number;
  priorityScore: number;
  expectedMonthlySavings: number;
  expectedDieselSavings: number;
  evidence: Record<string, unknown>;
  lastSeenAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  approvalNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type RootCauseClassification = {
  rootCauseKey: string;
  rootCauseLabel: string;
  likelyCause: string;
  actionType: string;
  recommendationMode: RecommendationMode;
  automationPossible: boolean;
  effortScore: number;
  confidenceScore: number;
  savingsScore: number;
  dieselScore: number;
  uptimeImpactScore: number;
  failureRiskScore: number;
  expectedMonthlySavings: number;
  expectedDieselSavings: number;
  title: string;
  summary: string;
  evidence: Record<string, unknown>;
};
