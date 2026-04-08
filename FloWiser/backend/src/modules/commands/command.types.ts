import { z } from "zod";

export const dispatchChannelSchema = z.enum(["simulated_gateway", "manual_playbook", "simulator"]);
export type DispatchChannel = z.infer<typeof dispatchChannelSchema>;

export const dispatchStatusSchema = z.enum([
  "planned",
  "simulated",
  "blocked",
  "sent",
  "succeeded",
  "failed"
]);
export type DispatchStatus = z.infer<typeof dispatchStatusSchema>;

export const commandTemplateSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  actionType: z.string().min(1),
  dispatchChannel: dispatchChannelSchema,
  allowedExecutionModes: z.array(z.enum(["dry_run", "manual", "automated"])),
  enabled: z.boolean(),
  requiresConfirmation: z.boolean(),
  commandBlueprint: z.record(z.string(), z.any()),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional()
});
export type CommandTemplate = z.infer<typeof commandTemplateSchema>;

export type CommandPlan = {
  templateId: string;
  actionType: string;
  dispatchChannel: DispatchChannel;
  commands: Array<{
    step: string;
    command: string;
    target: string;
    params: Record<string, unknown>;
  }>;
};

export type SimulationResult = {
  success: boolean;
  warnings: string[];
  estimatedImpact: {
    monthlySavings: number;
    dieselSavings: number;
  };
  summary: string;
};

export type CommandDispatchRecord = {
  dispatchId: string;
  executionId: string;
  actionId: string;
  templateId: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  deviceId?: string;
  dispatchChannel: DispatchChannel;
  executionMode: "dry_run" | "manual" | "automated";
  dispatchStatus: DispatchStatus;
  requestedBy: string;
  note?: string;
  commandPayload: CommandPlan;
  simulationResult: SimulationResult;
  resultSummary?: string;
  requestedAt: string;
  dispatchedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export const commandRequestSchema = z.object({
  actor: z.string().min(1),
  note: z.string().optional()
});
export type CommandRequestInput = z.infer<typeof commandRequestSchema>;
