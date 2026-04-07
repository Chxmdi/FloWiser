import { z } from "zod";

export const ruleSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export type RuleSeverity = z.infer<typeof ruleSeveritySchema>;

export const ruleCategorySchema = z.enum([
  "energy_waste",
  "schedule",
  "generator",
  "equipment",
  "telemetry"
]);
export type RuleCategory = z.infer<typeof ruleCategorySchema>;

export const ruleConfigSchema = z.object({
  ruleId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: ruleCategorySchema,
  severity: ruleSeveritySchema,
  enabled: z.boolean(),
  scope: z.string().min(1).default("site"),
  version: z.string().min(1),
  thresholdConfig: z.record(z.string(), z.any()).default({}),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional()
});
export type RuleConfig = z.infer<typeof ruleConfigSchema>;

export const ruleExecutionTraceSchema = z.object({
  traceId: z.string().uuid(),
  ruleId: z.string().min(1),
  ruleVersion: z.string().min(1),
  matched: z.boolean(),
  severity: ruleSeveritySchema,
  tenantId: z.string().min(1),
  branchId: z.string().min(1),
  siteId: z.string().min(1),
  deviceId: z.string().min(1),
  eventId: z.string().uuid(),
  title: z.string().min(1),
  summary: z.string().min(1),
  evidence: z.record(z.string(), z.any()).default({}),
  executedAt: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }).optional()
});
export type RuleExecutionTrace = z.infer<typeof ruleExecutionTraceSchema>;

export const ruleUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  severity: ruleSeveritySchema.optional(),
  thresholdConfig: z.record(z.string(), z.any()).optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one updatable field is required"
});
export type RuleUpdateInput = z.infer<typeof ruleUpdateSchema>;
