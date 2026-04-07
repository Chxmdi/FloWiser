import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type {
  AlertRecord,
  AlertSeverity,
  FieldChecklistRecord,
  FieldTaskRecord,
  IssueCommentRecord,
  IssueRecord,
  IssueStatus,
  NotificationChannel,
  NotificationRecord,
  SiteVisitRecord
} from "./alert-workflow.types.js";

type CreateAlertInput = Omit<AlertRecord, "alertId" | "createdAt" | "updatedAt" | "dedupeCount"> & {
  dedupeCount?: number;
};

type CreateIssueInput = Omit<IssueRecord, "issueId" | "createdAt" | "updatedAt">;
type CreateNotificationInput = {
  targetType: "alert" | "issue";
  targetId: string;
  channel?: NotificationChannel;
  recipient: string;
  templateKey: string;
  payload: Record<string, unknown>;
  status?: "queued" | "sent" | "suppressed";
};

const mapAlert = (row: Record<string, unknown>): AlertRecord => ({
  alertId: row.alert_id as string,
  alertKey: row.alert_key as string,
  alertType: row.alert_type as string,
  severity: row.severity as AlertSeverity,
  state: row.state as AlertRecord["state"],
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  deviceId: (row.device_id as string | null) ?? undefined,
  eventId: (row.event_id as string | null) ?? undefined,
  title: row.title as string,
  description: row.description as string,
  correlationKey: row.correlation_key as string,
  dedupeCount: row.dedupe_count as number,
  firstSeenAt: row.first_seen_at as string,
  lastSeenAt: row.last_seen_at as string,
  suppressedUntil: (row.suppressed_until as string | null) ?? undefined,
  issueId: (row.issue_id as string | null) ?? undefined,
  metadata: (row.metadata as Record<string, unknown>) ?? {},
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapIssue = (row: Record<string, unknown>): IssueRecord => ({
  issueId: row.issue_id as string,
  sourceAlertId: (row.source_alert_id as string | null) ?? undefined,
  sourceAlertKey: row.source_alert_key as string,
  severity: row.severity as AlertSeverity,
  status: row.status as IssueStatus,
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  deviceId: (row.device_id as string | null) ?? undefined,
  title: row.title as string,
  summary: row.summary as string,
  assignee: (row.assignee as string | null) ?? undefined,
  autoResolvable: row.auto_resolvable as boolean,
  slaDueAt: (row.sla_due_at as string | null) ?? undefined,
  openedAt: row.opened_at as string,
  acknowledgedAt: (row.acknowledged_at as string | null) ?? undefined,
  resolvedAt: (row.resolved_at as string | null) ?? undefined,
  closedAt: (row.closed_at as string | null) ?? undefined,
  resolutionNote: (row.resolution_note as string | null) ?? undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapComment = (row: Record<string, unknown>): IssueCommentRecord => ({
  commentId: row.comment_id as string,
  issueId: row.issue_id as string,
  author: row.author as string,
  commentType: row.comment_type as string,
  body: row.body as string,
  createdAt: row.created_at as string
});

const mapChecklist = (row: Record<string, unknown>): FieldChecklistRecord => ({
  checklistId: row.checklist_id as string,
  issueId: (row.issue_id as string | null) ?? undefined,
  siteId: row.site_id as string,
  title: row.title as string,
  status: row.status as FieldChecklistRecord["status"],
  items: (row.items as Array<{ label: string; done: boolean }>) ?? [],
  completedBy: (row.completed_by as string | null) ?? undefined,
  completedAt: (row.completed_at as string | null) ?? undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapTask = (row: Record<string, unknown>): FieldTaskRecord => ({
  taskId: row.task_id as string,
  issueId: (row.issue_id as string | null) ?? undefined,
  siteId: row.site_id as string,
  taskType: row.task_type as FieldTaskRecord["taskType"],
  title: row.title as string,
  status: row.status as FieldTaskRecord["status"],
  assignee: (row.assignee as string | null) ?? undefined,
  evidenceUrls: (row.evidence_urls as string[]) ?? [],
  rollbackNote: (row.rollback_note as string | null) ?? undefined,
  completionNote: (row.completion_note as string | null) ?? undefined,
  dueAt: (row.due_at as string | null) ?? undefined,
  completedAt: (row.completed_at as string | null) ?? undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapVisit = (row: Record<string, unknown>): SiteVisitRecord => ({
  visitId: row.visit_id as string,
  siteId: row.site_id as string,
  issueId: (row.issue_id as string | null) ?? undefined,
  engineer: row.engineer as string,
  startedAt: row.started_at as string,
  endedAt: (row.ended_at as string | null) ?? undefined,
  summary: row.summary as string,
  evidenceUrls: (row.evidence_urls as string[]) ?? [],
  createdAt: row.created_at as string
});

export class PostgresAlertWorkflowRepository {
  constructor(private readonly pool: Pool) {}

  async findActiveAlertByKey(alertKey: string) {
    const result = await this.pool.query(
      "SELECT * FROM alerts WHERE alert_key = $1 AND state IN ('open', 'suppressed') LIMIT 1",
      [alertKey]
    );
    return result.rowCount ? mapAlert(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async listActiveAlertsByDevice(deviceId: string) {
    const result = await this.pool.query(
      "SELECT * FROM alerts WHERE device_id = $1 AND state IN ('open', 'suppressed') ORDER BY updated_at DESC",
      [deviceId]
    );
    return result.rows.map((row) => mapAlert(row as Record<string, unknown>));
  }

  async createAlert(input: CreateAlertInput) {
    const alertId = randomUUID();
    const result = await this.pool.query(
      `
        INSERT INTO alerts (
          alert_id, alert_key, alert_type, severity, state, tenant_id, branch_id, site_id, device_id, event_id,
          title, description, correlation_key, dedupe_count, first_seen_at, last_seen_at, suppressed_until,
          issue_id, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17,
          $18, $19::jsonb, NOW(), NOW()
        ) RETURNING *;
      `,
      [
        alertId,
        input.alertKey,
        input.alertType,
        input.severity,
        input.state,
        input.tenantId,
        input.branchId,
        input.siteId,
        input.deviceId ?? null,
        input.eventId ?? null,
        input.title,
        input.description,
        input.correlationKey,
        input.dedupeCount ?? 1,
        input.firstSeenAt,
        input.lastSeenAt,
        input.suppressedUntil ?? null,
        input.issueId ?? null,
        JSON.stringify(input.metadata)
      ]
    );
    return mapAlert(result.rows[0] as Record<string, unknown>);
  }

  async updateAlert(alertId: string, patch: Partial<AlertRecord>) {
    const current = await this.getAlert(alertId);
    if (!current) {
      return undefined;
    }

    const merged = { ...current, ...patch };
    const result = await this.pool.query(
      `
        UPDATE alerts
        SET severity = $2,
            state = $3,
            event_id = $4,
            title = $5,
            description = $6,
            dedupe_count = $7,
            last_seen_at = $8,
            suppressed_until = $9,
            issue_id = $10,
            metadata = $11::jsonb,
            updated_at = NOW()
        WHERE alert_id = $1
        RETURNING *;
      `,
      [
        alertId,
        merged.severity,
        merged.state,
        merged.eventId ?? null,
        merged.title,
        merged.description,
        merged.dedupeCount,
        merged.lastSeenAt,
        merged.suppressedUntil ?? null,
        merged.issueId ?? null,
        JSON.stringify(merged.metadata)
      ]
    );
    return mapAlert(result.rows[0] as Record<string, unknown>);
  }

  async getAlert(alertId: string) {
    const result = await this.pool.query("SELECT * FROM alerts WHERE alert_id = $1 LIMIT 1", [alertId]);
    return result.rowCount ? mapAlert(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async listAlerts(filters: { siteId?: string; deviceId?: string; state?: string; severity?: string }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.siteId) {
      values.push(filters.siteId);
      conditions.push(`site_id = $${values.length}`);
    }
    if (filters.deviceId) {
      values.push(filters.deviceId);
      conditions.push(`device_id = $${values.length}`);
    }
    if (filters.state) {
      values.push(filters.state);
      conditions.push(`state = $${values.length}`);
    }
    if (filters.severity) {
      values.push(filters.severity);
      conditions.push(`severity = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(`SELECT * FROM alerts ${whereClause} ORDER BY last_seen_at DESC`, values);
    return result.rows.map((row) => mapAlert(row as Record<string, unknown>));
  }

  async findOpenIssueBySourceAlertKey(sourceAlertKey: string) {
    const result = await this.pool.query(
      "SELECT * FROM issues WHERE source_alert_key = $1 AND status IN ('open','acknowledged','investigating') LIMIT 1",
      [sourceAlertKey]
    );
    return result.rowCount ? mapIssue(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async createIssue(input: CreateIssueInput) {
    const issueId = randomUUID();
    const result = await this.pool.query(
      `
        INSERT INTO issues (
          issue_id, source_alert_id, source_alert_key, severity, status, tenant_id, branch_id, site_id, device_id,
          title, summary, assignee, auto_resolvable, sla_due_at, opened_at, acknowledged_at, resolved_at, closed_at,
          resolution_note, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, NOW(), NOW()
        ) RETURNING *;
      `,
      [
        issueId,
        input.sourceAlertId ?? null,
        input.sourceAlertKey,
        input.severity,
        input.status,
        input.tenantId,
        input.branchId,
        input.siteId,
        input.deviceId ?? null,
        input.title,
        input.summary,
        input.assignee ?? null,
        input.autoResolvable,
        input.slaDueAt ?? null,
        input.openedAt,
        input.acknowledgedAt ?? null,
        input.resolvedAt ?? null,
        input.closedAt ?? null,
        input.resolutionNote ?? null
      ]
    );
    const issue = mapIssue(result.rows[0] as Record<string, unknown>);
    await this.syncOpenIssueCounts(issue.deviceId, issue.siteId, issue.branchId);
    return issue;
  }

  async listIssues(filters: { siteId?: string; deviceId?: string; status?: string; assignee?: string }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.siteId) {
      values.push(filters.siteId);
      conditions.push(`site_id = $${values.length}`);
    }
    if (filters.deviceId) {
      values.push(filters.deviceId);
      conditions.push(`device_id = $${values.length}`);
    }
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }
    if (filters.assignee) {
      values.push(filters.assignee);
      conditions.push(`assignee = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(`SELECT * FROM issues ${whereClause} ORDER BY updated_at DESC`, values);
    return result.rows.map((row) => mapIssue(row as Record<string, unknown>));
  }

  async getIssue(issueId: string) {
    const result = await this.pool.query("SELECT * FROM issues WHERE issue_id = $1 LIMIT 1", [issueId]);
    return result.rowCount ? mapIssue(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async updateIssue(issueId: string, patch: Partial<IssueRecord>) {
    const current = await this.getIssue(issueId);
    if (!current) {
      return undefined;
    }

    const merged = { ...current, ...patch };
    const result = await this.pool.query(
      `
        UPDATE issues
        SET severity = $2,
            status = $3,
            title = $4,
            summary = $5,
            assignee = $6,
            auto_resolvable = $7,
            sla_due_at = $8,
            acknowledged_at = $9,
            resolved_at = $10,
            closed_at = $11,
            resolution_note = $12,
            updated_at = NOW()
        WHERE issue_id = $1
        RETURNING *;
      `,
      [
        issueId,
        merged.severity,
        merged.status,
        merged.title,
        merged.summary,
        merged.assignee ?? null,
        merged.autoResolvable,
        merged.slaDueAt ?? null,
        merged.acknowledgedAt ?? null,
        merged.resolvedAt ?? null,
        merged.closedAt ?? null,
        merged.resolutionNote ?? null
      ]
    );
    const issue = mapIssue(result.rows[0] as Record<string, unknown>);
    await this.syncOpenIssueCounts(issue.deviceId, issue.siteId, issue.branchId);
    return issue;
  }

  async addIssueComment(issueId: string, author: string, body: string, commentType: string) {
    const result = await this.pool.query(
      `
        INSERT INTO issue_comments (comment_id, issue_id, author, comment_type, body, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *;
      `,
      [randomUUID(), issueId, author, commentType, body]
    );
    return mapComment(result.rows[0] as Record<string, unknown>);
  }

  async listIssueComments(issueId: string) {
    const result = await this.pool.query(
      "SELECT * FROM issue_comments WHERE issue_id = $1 ORDER BY created_at ASC",
      [issueId]
    );
    return result.rows.map((row) => mapComment(row as Record<string, unknown>));
  }

  async createNotification(input: CreateNotificationInput) {
    const result = await this.pool.query(
      `
        INSERT INTO notification_log (
          notification_id, target_type, target_id, channel, recipient, template_key, status, payload, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW()
        ) RETURNING *;
      `,
      [
        randomUUID(),
        input.targetType,
        input.targetId,
        input.channel ?? "email",
        input.recipient,
        input.templateKey,
        input.status ?? "queued",
        JSON.stringify(input.payload)
      ]
    );
    const row = result.rows[0] as Record<string, unknown>;
    return {
      notificationId: row.notification_id as string,
      targetType: row.target_type as NotificationRecord["targetType"],
      targetId: row.target_id as string,
      channel: row.channel as NotificationRecord["channel"],
      recipient: row.recipient as string,
      templateKey: row.template_key as string,
      status: row.status as NotificationRecord["status"],
      payload: (row.payload as Record<string, unknown>) ?? {},
      createdAt: row.created_at as string
    } satisfies NotificationRecord;
  }

  async createChecklist(input: { issueId?: string; siteId: string; title: string; items: Array<{ label: string; done: boolean }> }) {
    const result = await this.pool.query(
      `
        INSERT INTO field_checklists (
          checklist_id, issue_id, site_id, title, status, items, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 'open', $5::jsonb, NOW(), NOW()
        ) RETURNING *;
      `,
      [randomUUID(), input.issueId ?? null, input.siteId, input.title, JSON.stringify(input.items)]
    );
    return mapChecklist(result.rows[0] as Record<string, unknown>);
  }

  async completeChecklist(checklistId: string, completedBy: string) {
    const result = await this.pool.query(
      `
        UPDATE field_checklists
        SET status = 'completed', completed_by = $2, completed_at = NOW(), updated_at = NOW()
        WHERE checklist_id = $1
        RETURNING *;
      `,
      [checklistId, completedBy]
    );
    return result.rowCount ? mapChecklist(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async listChecklists(siteId?: string) {
    const result = siteId
      ? await this.pool.query("SELECT * FROM field_checklists WHERE site_id = $1 ORDER BY updated_at DESC", [siteId])
      : await this.pool.query("SELECT * FROM field_checklists ORDER BY updated_at DESC");
    return result.rows.map((row) => mapChecklist(row as Record<string, unknown>));
  }

  async createFieldTask(input: {
    issueId?: string;
    siteId: string;
    taskType: FieldTaskRecord["taskType"];
    title: string;
    assignee?: string;
    dueAt?: string;
  }) {
    const result = await this.pool.query(
      `
        INSERT INTO field_tasks (
          task_id, issue_id, site_id, task_type, title, status, assignee, due_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'open', $6, $7, NOW(), NOW()
        ) RETURNING *;
      `,
      [randomUUID(), input.issueId ?? null, input.siteId, input.taskType, input.title, input.assignee ?? null, input.dueAt ?? null]
    );
    return mapTask(result.rows[0] as Record<string, unknown>);
  }

  async completeFieldTask(taskId: string, completionNote: string, evidenceUrls: string[]) {
    const result = await this.pool.query(
      `
        UPDATE field_tasks
        SET status = 'completed',
            completion_note = $2,
            evidence_urls = $3::jsonb,
            completed_at = NOW(),
            updated_at = NOW()
        WHERE task_id = $1
        RETURNING *;
      `,
      [taskId, completionNote, JSON.stringify(evidenceUrls)]
    );
    return result.rowCount ? mapTask(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async addRollbackNote(taskId: string, rollbackNote: string) {
    const result = await this.pool.query(
      `
        UPDATE field_tasks
        SET rollback_note = $2, updated_at = NOW()
        WHERE task_id = $1
        RETURNING *;
      `,
      [taskId, rollbackNote]
    );
    return result.rowCount ? mapTask(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async listFieldTasks(siteId?: string) {
    const result = siteId
      ? await this.pool.query("SELECT * FROM field_tasks WHERE site_id = $1 ORDER BY updated_at DESC", [siteId])
      : await this.pool.query("SELECT * FROM field_tasks ORDER BY updated_at DESC");
    return result.rows.map((row) => mapTask(row as Record<string, unknown>));
  }

  async createSiteVisit(input: {
    siteId: string;
    issueId?: string;
    engineer: string;
    startedAt: string;
    endedAt?: string;
    summary: string;
    evidenceUrls: string[];
  }) {
    const result = await this.pool.query(
      `
        INSERT INTO site_visits (
          visit_id, site_id, issue_id, engineer, started_at, ended_at, summary, evidence_urls, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW()
        ) RETURNING *;
      `,
      [randomUUID(), input.siteId, input.issueId ?? null, input.engineer, input.startedAt, input.endedAt ?? null, input.summary, JSON.stringify(input.evidenceUrls)]
    );
    return mapVisit(result.rows[0] as Record<string, unknown>);
  }

  async listSiteVisits(siteId?: string) {
    const result = siteId
      ? await this.pool.query("SELECT * FROM site_visits WHERE site_id = $1 ORDER BY started_at DESC", [siteId])
      : await this.pool.query("SELECT * FROM site_visits ORDER BY started_at DESC");
    return result.rows.map((row) => mapVisit(row as Record<string, unknown>));
  }

  private async syncOpenIssueCounts(deviceId: string | undefined, siteId: string, branchId: string) {
    if (deviceId) {
      await this.pool.query(
        `
          UPDATE device_state
          SET open_issue_count = (
            SELECT COUNT(*)::INTEGER
            FROM issues
            WHERE device_id = $1 AND status IN ('open', 'acknowledged', 'investigating')
          ), updated_at = NOW()
          WHERE device_id = $1;
        `,
        [deviceId]
      );
    }

    await this.pool.query(
      `
        UPDATE site_state
        SET open_issue_count = (
          SELECT COUNT(*)::INTEGER
          FROM issues
          WHERE site_id = $1 AND status IN ('open', 'acknowledged', 'investigating')
        ), updated_at = NOW()
        WHERE site_id = $1;
      `,
      [siteId]
    );

    await this.pool.query(
      `
        UPDATE branch_state
        SET open_issue_count = (
          SELECT COUNT(*)::INTEGER
          FROM issues
          WHERE branch_id = $1 AND status IN ('open', 'acknowledged', 'investigating')
        ), updated_at = NOW()
        WHERE branch_id = $1;
      `,
      [branchId]
    );
  }
}
