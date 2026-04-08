import { z } from "zod";

export const brokerMessageStatusSchema = z.enum(["pending", "claimed", "acked", "dead_lettered"]);
export type BrokerMessageStatus = z.infer<typeof brokerMessageStatusSchema>;

export type BrokerMessageRecord = {
  messageId: string;
  topic: string;
  routingKey: string;
  dispatchId: string;
  siteId: string;
  deviceId?: string;
  payload: Record<string, unknown>;
  status: BrokerMessageStatus;
  claimCount: number;
  publishedAt: string;
  claimedAt?: string;
  ackedAt?: string;
  deadLetteredAt?: string;
  lastError?: string;
};
