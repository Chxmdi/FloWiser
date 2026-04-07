import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { AlertRecord, AlertSeverity, IssueRecord, IssueStatus } from "./alert-workflow.types.js";
import { NotificationService } from "./notification.service.js";
import { PostgresAlertWorkflowRepository } from "./postgres-alert-workflow.repository.js";

const suppressionWindowMs = 15 * 60 * 1000;

const addHours = (timestamp: string, hours: number) =>
  new Date(new Date(timestamp).getTime() + hours * 60 * 60 * 1000).toISOString();

const buildSla = (severity: AlertSeverity, openedAt: string) => {
  if (severity === "critical") {
    return addHours(openedAt, 1);
  }

  if (severity === "high") {
    return addHours(openedAt, 4);
  }

  if (severity === "medium") {
    return addHours(openedAt, 24);
  }

  return addHours(openedAt, 72);
};

type AlertCandidate = {
  alertKey: string;
  alertType: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  correlationKey: string;
  metadata: Record<string, unknown>;
  autoResolvable: boolean;
};

export class AlertWorkflowService {
  constructor(
    private readonly repository: PostgresAlertWorkflowRepository,
    private readonly notificationService: NotificationService
  ) {}

  async generateFromTelemetry(event: CanonicalTelemetryEvent) {
    if (Date.parse(event.receivedAt) - Date.parse(event.meterTimestamp) > 60 * 60 * 1000) {
      return {
        alerts: [],
        issues: [],
        skippedReason: "stale_replay_protection"
      };
    }

    const candidates = this.buildCandidates(event);
    const alerts: AlertRecord[] = [];
    const issues: IssueRecord[] = [];

    for (const candidate of candidates) {
      const existingAlert = await this.repository.findActiveAlertByKey(candidate.alertKey);
      const now = event.receivedAt;
      let issue = await this.repository.findOpenIssueBySourceAlertKey(candidate.alertKey);

      if (!issue) {
        issue = await this.repository.createIssue({
          sourceAlertKey: candidate.alertKey,
          severity: candidate.severity,
          status: "open",
          tenantId: event.tenantId,
          branchId: event.branchId,
          siteId: event.siteId,
          deviceId: event.deviceId,
          title: candidate.title,
          summary: candidate.description,
          autoResolvable: candidate.autoResolvable,
          slaDueAt: buildSla(candidate.severity, now),
          openedAt: now,
          sourceAlertId: undefined,
          assignee: undefined,
          acknowledgedAt: undefined,
          resolvedAt: undefined,
          closedAt: undefined,
          resolutionNote: undefined
        });
        issues.push(issue);
        await this.notificationService.notifyIssue(issue, "issue_opened");
      }

      if (existingAlert) {
        const suppressed = existingAlert.suppressedUntil && Date.parse(existingAlert.suppressedUntil) > Date.parse(now);
        const updated = await this.repository.updateAlert(existingAlert.alertId, {
          severity: candidate.severity,
          state: suppressed ? "suppressed" : "open",
          eventId: event.eventId,
          title: candidate.title,
          description: candidate.description,
          dedupeCount: existingAlert.dedupeCount + 1,
          lastSeenAt: now,
          suppressedUntil: new Date(Date.parse(now) + suppressionWindowMs).toISOString(),
          issueId: issue.issueId,
          metadata: {
            ...candidate.metadata,
            qualityStatus: event.quality.status
          }
        });

        if (updated) {
          alerts.push(updated);
          if (!suppressed) {
            await this.notificationService.notifyAlert(updated);
          }
        }
      } else {
        const alert = await this.repository.createAlert({
          alertKey: candidate.alertKey,
          alertType: candidate.alertType,
          severity: candidate.severity,
          state: "open",
          tenantId: event.tenantId,
          branchId: event.branchId,
          siteId: event.siteId,
          deviceId: event.deviceId,
          eventId: event.eventId,
          title: candidate.title,
          description: candidate.description,
          correlationKey: candidate.correlationKey,
          firstSeenAt: now,
          lastSeenAt: now,
          suppressedUntil: new Date(Date.parse(now) + suppressionWindowMs).toISOString(),
          issueId: issue.issueId,
          metadata: {
            ...candidate.metadata,
            qualityStatus: event.quality.status
          }
        });
        alerts.push(alert);
        await this.notificationService.notifyAlert(alert);
      }
    }

    await this.autoResolveDeviceAlerts(event, candidates.map((candidate) => candidate.alertType));

    return { alerts, issues };
  }

  async listAlerts(filters: { siteId?: string; deviceId?: string; state?: string; severity?: string }) {
    return this.repository.listAlerts(filters);
  }

  async getAlert(alertId: string) {
    return this.repository.getAlert(alertId);
  }

  async listIssues(filters: { siteId?: string; deviceId?: string; status?: string; assignee?: string }) {
    return this.repository.listIssues(filters);
  }

  async getIssue(issueId: string) {
    return this.repository.getIssue(issueId);
  }

  async transitionIssue(issueId: string, status: IssueStatus, actor?: string, resolutionNote?: string) {
    const issue = await this.repository.getIssue(issueId);

    if (!issue) {
      return undefined;
    }

    const now = new Date().toISOString();
    const patch: Partial<IssueRecord> = { status };

    if (status === "acknowledged") {
      patch.acknowledgedAt = now;
    } else if (status === "resolved") {
      patch.resolvedAt = now;
      patch.resolutionNote = resolutionNote ?? `Resolved by ${actor ?? "system"}`;
    } else if (status === "closed") {
      patch.closedAt = now;
      patch.resolutionNote = resolutionNote ?? issue.resolutionNote;
    }

    const updated = await this.repository.updateIssue(issueId, patch);

    if (updated) {
      await this.notificationService.notifyIssue(updated, `issue_${status}`);
    }

    return updated;
  }

  async assignIssue(issueId: string, assignee: string) {
    const updated = await this.repository.updateIssue(issueId, { assignee });

    if (updated) {
      await this.notificationService.notifyIssue(updated, "issue_assigned");
    }

    return updated;
  }

  async addIssueComment(issueId: string, author: string, body: string, commentType: string) {
    return this.repository.addIssueComment(issueId, author, body, commentType);
  }

  async listIssueComments(issueId: string) {
    return this.repository.listIssueComments(issueId);
  }

  async createChecklist(input: { issueId?: string; siteId: string; title: string; items: Array<{ label: string; done: boolean }> }) {
    return this.repository.createChecklist(input);
  }

  async completeChecklist(checklistId: string, completedBy: string) {
    return this.repository.completeChecklist(checklistId, completedBy);
  }

  async listChecklists(siteId?: string) {
    return this.repository.listChecklists(siteId);
  }

  async createFieldTask(input: {
    issueId?: string;
    siteId: string;
    taskType: "maintenance" | "follow_up" | "commissioning";
    title: string;
    assignee?: string;
    dueAt?: string;
  }) {
    return this.repository.createFieldTask(input);
  }

  async completeFieldTask(taskId: string, completionNote: string, evidenceUrls: string[]) {
    return this.repository.completeFieldTask(taskId, completionNote, evidenceUrls);
  }

  async addRollbackNote(taskId: string, rollbackNote: string) {
    return this.repository.addRollbackNote(taskId, rollbackNote);
  }

  async listFieldTasks(siteId?: string) {
    return this.repository.listFieldTasks(siteId);
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
    return this.repository.createSiteVisit(input);
  }

  async listSiteVisits(siteId?: string) {
    return this.repository.listSiteVisits(siteId);
  }

  private buildCandidates(event: CanonicalTelemetryEvent): AlertCandidate[] {
    const candidates: AlertCandidate[] = [];

    if (!event.status.meterOnline) {
      candidates.push({
        alertKey: `DEVICE_OFFLINE:${event.deviceId}`,
        alertType: "DEVICE_OFFLINE",
        severity: "critical",
        title: "Device offline",
        description: `Device ${event.deviceId} is reporting offline state.`,
        correlationKey: `DEVICE_OFFLINE:${event.deviceId}`,
        metadata: { freshnessAnchor: event.receivedAt },
        autoResolvable: true
      });
    }

    if (event.quality.status === "bad") {
      candidates.push({
        alertKey: `TELEMETRY_QUALITY_BAD:${event.deviceId}`,
        alertType: "TELEMETRY_QUALITY_BAD",
        severity: "high",
        title: "Telemetry quality is bad",
        description: `Telemetry for ${event.deviceId} failed quality evaluation.`,
        correlationKey: `QUALITY:${event.deviceId}`,
        metadata: { qualityFlags: event.quality.flags },
        autoResolvable: true
      });
    }

    if (event.quality.status === "suspicious") {
      candidates.push({
        alertKey: `TELEMETRY_QUALITY_SUSPICIOUS:${event.deviceId}`,
        alertType: "TELEMETRY_QUALITY_SUSPICIOUS",
        severity: "medium",
        title: "Telemetry quality is suspicious",
        description: `Telemetry for ${event.deviceId} requires review.`,
        correlationKey: `QUALITY:${event.deviceId}`,
        metadata: { qualityFlags: event.quality.flags },
        autoResolvable: true
      });
    }

    if (event.status.generatorRunning && event.status.gridAvailable === true) {
      candidates.push({
        alertKey: `GENERATOR_WHILE_GRID_AVAILABLE:${event.siteId}`,
        alertType: "GENERATOR_WHILE_GRID_AVAILABLE",
        severity: "medium",
        title: "Generator running while grid is available",
        description: `Site ${event.siteId} has generator runtime while grid appears available.`,
        correlationKey: `GENERATOR_RUNTIME:${event.siteId}`,
        metadata: { gridAvailable: true, generatorRunning: true },
        autoResolvable: false
      });
    }

    if (event.quality.flags.includes("flatline_candidate")) {
      candidates.push({
        alertKey: `METER_FLATLINE:${event.deviceId}`,
        alertType: "METER_FLATLINE",
        severity: "medium",
        title: "Meter flatline candidate",
        description: `Device ${event.deviceId} appears to be flatlining.`,
        correlationKey: `METER_FLATLINE:${event.deviceId}`,
        metadata: { qualityFlags: event.quality.flags },
        autoResolvable: true
      });
    }

    return candidates;
  }

  private async autoResolveDeviceAlerts(event: CanonicalTelemetryEvent, currentAlertTypes: string[]) {
    const activeAlerts = await this.repository.listActiveAlertsByDevice(event.deviceId);
    const now = event.receivedAt;

    for (const alert of activeAlerts) {
      const autoResolvable = [
        "DEVICE_OFFLINE",
        "TELEMETRY_QUALITY_BAD",
        "TELEMETRY_QUALITY_SUSPICIOUS",
        "METER_FLATLINE"
      ].includes(alert.alertType);

      if (!autoResolvable || currentAlertTypes.includes(alert.alertType)) {
        continue;
      }

      const resolved = await this.repository.updateAlert(alert.alertId, {
        state: "resolved",
        lastSeenAt: now,
        suppressedUntil: undefined
      });

      if (resolved?.issueId) {
        const issue = await this.repository.getIssue(resolved.issueId);

        if (issue && issue.autoResolvable && ["open", "acknowledged", "investigating"].includes(issue.status)) {
          const updatedIssue = await this.repository.updateIssue(issue.issueId, {
            status: "resolved",
            resolvedAt: now,
            resolutionNote: `Auto-resolved from healthy telemetry at ${now}`
          });

          if (updatedIssue) {
            await this.notificationService.notifyIssue(updatedIssue, "issue_auto_resolved");
          }
        }
      }
    }
  }
}
