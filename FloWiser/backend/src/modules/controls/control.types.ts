import { z } from "zod";

export const executionModeSchema = z.enum(["dry_run", "manual", "automated"]);
export type ExecutionMode = z.infer<typeof executionModeSchema>;

export const executionStatusSchema = z.enum([
  "dry_run_evaluated",
  "blocked",
  "pending_approval",
  "ready",
  "executed",
  "failed",
  "cancelled"
]);
export type ExecutionStatus = z.infer<typeof executionStatusSchema>;

export const controlApprovalPolicySchema = z.object({
  policyId: z.string().min(1),
  name: z.string().min(1),
  actionType: z.string().min(1),
  recommendationMode: z.string().min(1),
  allowedExecutionModes: z.array(executionModeSchema),
  minExecutionApprovals: z.number().int().min(0),
  requiresTwoPerson: z.boolean(),
  enabled: z.boolean(),
  maxOpenCriticalAlerts: z.number().int().min(0),
  minConfidenceScore: z.number().int().min(0).max(100),
  maxRecommendationAgeHours: z.number().int().min(1),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional()
});
export type ControlApprovalPolicy = z.infer<typeof controlApprovalPolicySchema>;

export type GuardrailOutcome = {
  ready: boolean;
  blocks: string[];
  warnings: string[];
  policyId?: string;
  policyName?: string;
  snapshot: {
    criticalAlertCount: number;
    recommendationAgeHours: number;
    confidenceScore: number;
    recommendationStatus: string;
    approvalStatus: string;
  };
};

export type ActionExecutionRecord = {
  executionId: string;
  actionId: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  deviceId?: string;
  actionType: string;
  recommendationMode: string;
  executionMode: ExecutionMode;
  status: ExecutionStatus;
  requestedBy: string;
  note?: string;
  policyId?: string;
  guardrailOutcome: GuardrailOutcome;
  approvalCount: number;
  resultSummary?: string;
  requestedAt: string;
  executedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ActionExecutionApprovalRecord = {
  approvalId: string;
  executionId: string;
  approver: string;
  role?: string;
  note?: string;
  approvedAt: string;
  createdAt: string;
};

export const executionRequestSchema = z.object({
  actionId: z.string().uuid(),
  actor: z.string().min(1),
  executionMode: executionModeSchema,
  note: z.string().optional()
});
export type ExecutionRequestInput = z.infer<typeof executionRequestSchema>;

export const executionApprovalSchema = z.object({
  actor: z.string().min(1),
  role: z.string().optional(),
  note: z.string().optional()
});
export type ExecutionApprovalInput = z.infer<typeof executionApprovalSchema>;

export const executionCompleteSchema = z.object({
  actor: z.string().min(1),
  success: z.boolean(),
  resultSummary: z.string().min(1)
});
export type ExecutionCompleteInput = z.infer<typeof executionCompleteSchema>;

export const controlPolicyUpdateSchema = z.object({
  allowedExecutionModes: z.array(executionModeSchema).optional(),
  minExecutionApprovals: z.number().int().min(0).optional(),
  requiresTwoPerson: z.boolean().optional(),
  enabled: z.boolean().optional(),
  maxOpenCriticalAlerts: z.number().int().min(0).optional(),
  minConfidenceScore: z.number().int().min(0).max(100).optional(),
  maxRecommendationAgeHours: z.number().int().min(1).optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one updatable field is required"
});
export type ControlPolicyUpdateInput = z.infer<typeof controlPolicyUpdateSchema>;
