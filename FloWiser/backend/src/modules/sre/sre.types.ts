import { z } from "zod";

export const sreRunbookRequestSchema = z.object({
  actor: z.string().min(1),
  note: z.string().optional(),
  input: z.record(z.string(), z.any()).optional().default({})
});
export type SreRunbookRequestInput = z.infer<typeof sreRunbookRequestSchema>;

export type SreRunbookExecutionRecord = {
  runbookExecutionId: string;
  runbookKey: string;
  actor: string;
  status: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
};
