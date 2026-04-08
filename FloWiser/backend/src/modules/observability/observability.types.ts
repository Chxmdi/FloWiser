import { z } from "zod";

export const observabilityCaptureSchema = z.object({
  actor: z.string().min(1),
  note: z.string().optional()
});
export type ObservabilityCaptureInput = z.infer<typeof observabilityCaptureSchema>;

export type ServiceHealthSnapshotRecord = {
  snapshotId: string;
  capturedBy: string;
  gatewayOnlineCount: number;
  gatewayStaleCount: number;
  gatewayOfflineCount: number;
  gatewayNeverSeenCount: number;
  pendingDispatchCount: number;
  retryScheduledCount: number;
  deadLetterCount: number;
  openIncidentCount: number;
  brokerPendingCount: number;
  brokerClaimedCount: number;
  brokerDeadLetteredCount: number;
  createdAt: string;
};
