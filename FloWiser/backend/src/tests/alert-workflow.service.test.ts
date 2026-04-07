import assert from "node:assert/strict";
import test from "node:test";
import { canonicalSchemaVersion, type CanonicalTelemetryEvent } from "@flowiser/schemas";
import { AlertWorkflowService } from "../modules/alerts/alert-workflow.service.js";

class FakeRepository {
  alerts: any[] = [];
  issues: any[] = [];
  comments: any[] = [];
  notifications: any[] = [];
  checklists: any[] = [];
  tasks: any[] = [];
  visits: any[] = [];

  async findActiveAlertByKey(alertKey: string) {
    return this.alerts.find((alert) => alert.alertKey === alertKey && ["open", "suppressed"].includes(alert.state));
  }
  async listActiveAlertsByDevice(deviceId: string) {
    return this.alerts.filter((alert) => alert.deviceId === deviceId && ["open", "suppressed"].includes(alert.state));
  }
  async createAlert(input: any) {
    const alert = { alertId: `alert-${this.alerts.length + 1}`, dedupeCount: 1, createdAt: input.firstSeenAt, updatedAt: input.lastSeenAt, ...input };
    this.alerts.push(alert);
    return alert;
  }
  async updateAlert(alertId: string, patch: any) {
    const index = this.alerts.findIndex((alert) => alert.alertId === alertId);
    if (index === -1) return undefined;
    this.alerts[index] = { ...this.alerts[index], ...patch, updatedAt: new Date().toISOString() };
    return this.alerts[index];
  }
  async getAlert(alertId: string) {
    return this.alerts.find((alert) => alert.alertId === alertId);
  }
  async listAlerts() { return this.alerts; }
  async findOpenIssueBySourceAlertKey(sourceAlertKey: string) {
    return this.issues.find((issue) => issue.sourceAlertKey === sourceAlertKey && ["open","acknowledged","investigating"].includes(issue.status));
  }
  async createIssue(input: any) {
    const issue = { issueId: `issue-${this.issues.length + 1}`, createdAt: input.openedAt, updatedAt: input.openedAt, ...input };
    this.issues.push(issue);
    return issue;
  }
  async listIssues() { return this.issues; }
  async getIssue(issueId: string) { return this.issues.find((issue) => issue.issueId === issueId); }
  async updateIssue(issueId: string, patch: any) {
    const index = this.issues.findIndex((issue) => issue.issueId === issueId);
    if (index === -1) return undefined;
    this.issues[index] = { ...this.issues[index], ...patch, updatedAt: new Date().toISOString() };
    return this.issues[index];
  }
  async addIssueComment() { throw new Error("unused"); }
  async listIssueComments() { return []; }
  async createNotification(input: any) { this.notifications.push(input); return input; }
  async createChecklist() { throw new Error("unused"); }
  async completeChecklist() { throw new Error("unused"); }
  async listChecklists() { return []; }
  async createFieldTask() { throw new Error("unused"); }
  async completeFieldTask() { throw new Error("unused"); }
  async addRollbackNote() { throw new Error("unused"); }
  async listFieldTasks() { return []; }
  async createSiteVisit() { throw new Error("unused"); }
  async listSiteVisits() { return []; }
}

class FakeNotificationService {
  sentAlerts: any[] = [];
  sentIssues: any[] = [];
  async notifyAlert(alert: any) { this.sentAlerts.push(alert); }
  async notifyIssue(issue: any, template: string) { this.sentIssues.push({ issue, template }); }
}

const buildEvent = (overrides: Partial<CanonicalTelemetryEvent> = {}): CanonicalTelemetryEvent => ({
  eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  rawEventId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  schemaVersion: canonicalSchemaVersion,
  receivedAt: "2026-04-07T12:00:00.000Z",
  meterTimestamp: "2026-04-07T12:00:00.000Z",
  tenantId: "tenant-1",
  branchId: "branch-1",
  siteId: "site-1",
  deviceId: "device-1",
  sourceProtocol: "mqtt",
  sourceTopic: "tenant/tenant-1/site/site-1/device/device-1/telemetry",
  decoderId: "acme-three-phase-v1",
  decoderVersion: "1.0.0",
  decoderAuditId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  metrics: { kw: 12, kwhTotal: 100, voltageL1: 230 },
  status: { meterOnline: true, tamperFlag: false },
  quality: { status: "good", score: 100, flags: [] },
  ...overrides
});

test("creates alert and issue for bad quality telemetry", async () => {
  const repository = new FakeRepository();
  const notifications = new FakeNotificationService();
  const service = new AlertWorkflowService(repository as any, notifications as any);

  const result = await service.generateFromTelemetry(
    buildEvent({
      quality: { status: "bad", score: 40, flags: ["timestamp_drift_critical"] }
    })
  );

  assert.equal(result.alerts.length, 1);
  assert.equal(result.issues.length, 1);
  assert.equal(result.alerts[0].alertType, "TELEMETRY_QUALITY_BAD");
  assert.equal(notifications.sentAlerts.length, 1);
});

test("auto resolves device offline alert when telemetry recovers", async () => {
  const repository = new FakeRepository();
  const notifications = new FakeNotificationService();
  const service = new AlertWorkflowService(repository as any, notifications as any);

  await service.generateFromTelemetry(
    buildEvent({
      status: { meterOnline: false, tamperFlag: false },
      quality: { status: "good", score: 100, flags: [] }
    })
  );

  await service.generateFromTelemetry(
    buildEvent({
      eventId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      rawEventId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      receivedAt: "2026-04-07T12:10:00.000Z",
      meterTimestamp: "2026-04-07T12:10:00.000Z"
    })
  );

  assert.equal(repository.alerts[0].state, "resolved");
});
