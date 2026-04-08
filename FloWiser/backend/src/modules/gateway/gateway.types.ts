import { z } from "zod";

export const gatewayAgentSchema = z.object({
  agentId: z.string().min(1),
  tenantId: z.string().min(1),
  branchId: z.string().min(1),
  siteId: z.string().min(1),
  deviceId: z.string().optional(),
  displayName: z.string().min(1),
  sharedKey: z.string().min(1),
  supportedActionTypes: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  lastSeenAt: z.string().datetime({ offset: true }).optional(),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional()
});
export type GatewayAgent = z.infer<typeof gatewayAgentSchema>;

export const gatewayHeartbeatSchema = z.object({
  status: z.string().min(1).default("online")
});
export type GatewayHeartbeatInput = z.infer<typeof gatewayHeartbeatSchema>;

export const gatewayPullSchema = z.object({
  limit: z.number().int().positive().max(50).optional()
});
export type GatewayPullInput = z.infer<typeof gatewayPullSchema>;

export const gatewayDispatchResultSchema = z.object({
  success: z.boolean(),
  resultSummary: z.string().min(1),
  detail: z.record(z.string(), z.any()).default({})
});
export type GatewayDispatchResultInput = z.infer<typeof gatewayDispatchResultSchema>;

export type GatewayDispatchReceipt = {
  receiptId: string;
  dispatchId: string;
  agentId: string;
  eventType: string;
  status: string;
  detail: Record<string, unknown>;
  createdAt: string;
};
