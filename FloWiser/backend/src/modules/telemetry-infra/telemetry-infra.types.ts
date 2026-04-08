import { z } from "zod";

export const infraProfileSchema = z.object({
  profileId: z.string().min(1),
  profileType: z.string().min(1),
  displayName: z.string().min(1),
  connectionMode: z.string().min(1),
  config: z.record(z.string(), z.any()).default({}),
  healthStatus: z.string().min(1),
  enabled: z.boolean().default(true),
  lastCheckedAt: z.string().datetime({ offset: true }).optional(),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional()
});
export type InfraProfile = z.infer<typeof infraProfileSchema>;

export const infraProfileUpdateSchema = z.object({
  displayName: z.string().min(1).optional(),
  connectionMode: z.string().min(1).optional(),
  config: z.record(z.string(), z.any()).optional(),
  enabled: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one infra profile field must be updated"
});
export type InfraProfileUpdateInput = z.infer<typeof infraProfileUpdateSchema>;

export const metricsCaptureSchema = z.object({
  actor: z.string().min(1),
  note: z.string().optional()
});
export type MetricsCaptureInput = z.infer<typeof metricsCaptureSchema>;

export const logEntryInputSchema = z.object({
  actor: z.string().min(1),
  severity: z.enum(["debug", "info", "warning", "error", "critical"]),
  source: z.string().min(1),
  message: z.string().min(1),
  context: z.record(z.string(), z.any()).optional().default({})
});
export type LogEntryInput = z.infer<typeof logEntryInputSchema>;

export const traceSpanInputSchema = z.object({
  actor: z.string().min(1),
  traceId: z.string().min(1),
  parentSpanId: z.string().optional(),
  spanName: z.string().min(1),
  source: z.string().min(1),
  status: z.string().min(1),
  durationMs: z.number().positive(),
  attributes: z.record(z.string(), z.any()).optional().default({})
});
export type TraceSpanInput = z.infer<typeof traceSpanInputSchema>;

export type MetricPointRecord = {
  metricId: string;
  metricKey: string;
  labels: Record<string, unknown>;
  value: number;
  unit: string;
  source: string;
  capturedAt: string;
  createdAt: string;
};

export type LogEntryRecord = {
  logId: string;
  severity: string;
  source: string;
  message: string;
  context: Record<string, unknown>;
  capturedAt: string;
  createdAt: string;
};

export type TraceSpanRecord = {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  spanName: string;
  source: string;
  status: string;
  attributes: Record<string, unknown>;
  startedAt: string;
  endedAt: string;
  createdAt: string;
};

export const alertPolicyUpdateSchema = z.object({
  threshold: z.number().min(0).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  enabled: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one alert policy field must be updated"
});
export type AlertPolicyUpdateInput = z.infer<typeof alertPolicyUpdateSchema>;

export const alertEvaluationSchema = z.object({
  actor: z.string().min(1),
  note: z.string().optional()
});
export type AlertEvaluationInput = z.infer<typeof alertEvaluationSchema>;

export type AlertPolicyRecord = {
  policyId: string;
  name: string;
  description: string;
  signalKey: string;
  comparator: string;
  threshold: number;
  severity: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AlertEventRecord = {
  alertEventId: string;
  policyId: string;
  severity: string;
  status: string;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
};
