import { z } from "zod";

export const operationsRequestSchema = z.object({
  actor: z.string().min(1),
  note: z.string().optional()
});
export type OperationsRequestInput = z.infer<typeof operationsRequestSchema>;

export type DispatchOperationIncidentRecord = {
  incidentId: string;
  dispatchId?: string;
  agentId?: string;
  incidentType: string;
  severity: string;
  status: string;
  summary: string;
  detail: Record<string, unknown>;
  createdAt: string;
  resolvedAt?: string;
};

export type DispatchDeadLetterRecord = {
  deadLetterId: string;
  dispatchId: string;
  reason: string;
  detail: Record<string, unknown>;
  createdAt: string;
};
