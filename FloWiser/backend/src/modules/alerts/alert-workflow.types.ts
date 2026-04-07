import { z } from "zod";

export const alertSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;

export const alertStateSchema = z.enum(["open", "suppressed", "resolved", "closed"]);
export type AlertState = z.infer<typeof alertStateSchema>;

export const issueStatusSchema = z.enum(["open", "acknowledged", "investigating", "resolved", "closed"]);
export type IssueStatus = z.infer<typeof issueStatusSchema>;

export const notificationChannelSchema = z.enum(["email", "in_app"]);
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

export const checklistStatusSchema = z.enum(["open", "completed", "cancelled"]);
export type ChecklistStatus = z.infer<typeof checklistStatusSchema>;

export const fieldTaskStatusSchema = z.enum(["open", "in_progress", "completed", "cancelled"]);
export type FieldTaskStatus = z.infer<typeof fieldTaskStatusSchema>;

export const fieldTaskTypeSchema = z.enum(["maintenance", "follow_up", "commissioning"]);
export type FieldTaskType = z.infer<typeof fieldTaskTypeSchema>;

export type AlertRecord = {
  alertId: string;
  alertKey: string;
  alertType: string;
  severity: AlertSeverity;
  state: AlertState;
  tenantId: string;
  branchId: string;
  siteId: string;
  deviceId?: string;
  eventId?: string;
  title: string;
  description: string;
  correlationKey: string;
  dedupeCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  suppressedUntil?: string;
  issueId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type IssueRecord = {
  issueId: string;
  sourceAlertId?: string;
  sourceAlertKey: string;
  severity: AlertSeverity;
  status: IssueStatus;
  tenantId: string;
  branchId: string;
  siteId: string;
  deviceId?: string;
  title: string;
  summary: string;
  assignee?: string;
  autoResolvable: boolean;
  slaDueAt?: string;
  openedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type IssueCommentRecord = {
  commentId: string;
  issueId: string;
  author: string;
  commentType: string;
  body: string;
  createdAt: string;
};

export type NotificationRecord = {
  notificationId: string;
  targetType: "alert" | "issue";
  targetId: string;
  channel: NotificationChannel;
  recipient: string;
  templateKey: string;
  status: "queued" | "sent" | "suppressed";
  payload: Record<string, unknown>;
  createdAt: string;
};

export type FieldChecklistRecord = {
  checklistId: string;
  issueId?: string;
  siteId: string;
  title: string;
  status: ChecklistStatus;
  items: Array<{ label: string; done: boolean }>;
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type FieldTaskRecord = {
  taskId: string;
  issueId?: string;
  siteId: string;
  taskType: FieldTaskType;
  title: string;
  status: FieldTaskStatus;
  assignee?: string;
  evidenceUrls: string[];
  rollbackNote?: string;
  completionNote?: string;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SiteVisitRecord = {
  visitId: string;
  siteId: string;
  issueId?: string;
  engineer: string;
  startedAt: string;
  endedAt?: string;
  summary: string;
  evidenceUrls: string[];
  createdAt: string;
};

export const issueAssignSchema = z.object({
  assignee: z.string().min(1),
  actor: z.string().min(1).optional()
});

export const issueCommentSchema = z.object({
  author: z.string().min(1),
  body: z.string().min(1),
  commentType: z.string().min(1).default("note")
});

export const issueResolveSchema = z.object({
  actor: z.string().min(1).optional(),
  resolutionNote: z.string().min(1).default("Resolved by operator")
});

export const issueTransitionSchema = z.object({
  actor: z.string().min(1).optional()
});

export const checklistCreateSchema = z.object({
  issueId: z.string().uuid().optional(),
  siteId: z.string().min(1),
  title: z.string().min(1),
  items: z.array(z.object({ label: z.string().min(1), done: z.boolean().default(false) })).default([])
});

export const checklistCompleteSchema = z.object({
  completedBy: z.string().min(1)
});

export const fieldTaskCreateSchema = z.object({
  issueId: z.string().uuid().optional(),
  siteId: z.string().min(1),
  taskType: fieldTaskTypeSchema,
  title: z.string().min(1),
  assignee: z.string().optional(),
  dueAt: z.string().datetime({ offset: true }).optional()
});

export const fieldTaskCompleteSchema = z.object({
  completedBy: z.string().min(1),
  completionNote: z.string().default("Completed"),
  evidenceUrls: z.array(z.string().url()).default([])
});

export const rollbackNoteSchema = z.object({
  rollbackNote: z.string().min(1)
});

export const siteVisitCreateSchema = z.object({
  siteId: z.string().min(1),
  issueId: z.string().uuid().optional(),
  engineer: z.string().min(1),
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }).optional(),
  summary: z.string().min(1),
  evidenceUrls: z.array(z.string().url()).default([])
});
