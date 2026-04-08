import { z } from "zod";

export const verificationStatusSchema = z.enum([
  "unverified",
  "partially_realized",
  "realized",
  "not_realized"
]);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const verificationRequestSchema = z.object({
  actor: z.string().min(1),
  note: z.string().optional()
});
export type VerificationRequestInput = z.infer<typeof verificationRequestSchema>;

export type VerificationSnapshotRecord = {
  snapshotId: string;
  actionId: string;
  executionId?: string;
  dispatchId?: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  deviceId?: string;
  verificationStatus: VerificationStatus;
  verificationBasis: string;
  expectedMonthlySavings: number;
  expectedDieselSavings: number;
  realizedMonthlySavings: number;
  realizedDieselSavings: number;
  realizationRate: number;
  implementationCostProxy: number;
  roiScore: number;
  paybackMonths?: number;
  verificationNote?: string;
  verifiedBy: string;
  measuredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RecommendationVerificationContext = {
  actionId: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  deviceId?: string;
  title: string;
  actionType: string;
  recommendationStatus: string;
  approvalStatus: string;
  expectedMonthlySavings: number;
  expectedDieselSavings: number;
  confidenceScore: number;
  effortScore: number;
  lastSeenAt: string;
  executionId?: string;
  executionMode?: string;
  executionStatus?: string;
  executionRequestedAt?: string;
  executionCompletedAt?: string;
  dispatchId?: string;
  dispatchChannel?: string;
  dispatchStatus?: string;
  dispatchRequestedAt?: string;
  dispatchCompletedAt?: string;
  simulationResult?: Record<string, unknown>;
};
