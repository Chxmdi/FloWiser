import type { AlertRecord, AlertSeverity, IssueRecord } from "./alert-workflow.types.js";
import type { PostgresAlertWorkflowRepository } from "./postgres-alert-workflow.repository.js";

const alertRecipientsBySeverity: Record<AlertSeverity, string[]> = {
  low: ["ops@flowiser.local"],
  medium: ["ops@flowiser.local", "facilities@flowiser.local"],
  high: ["ops@flowiser.local", "facilities@flowiser.local"],
  critical: ["ops@flowiser.local", "facilities@flowiser.local", "leadership@flowiser.local"]
};

export class NotificationService {
  constructor(private readonly repository: PostgresAlertWorkflowRepository) {}

  async notifyAlert(alert: AlertRecord) {
    for (const recipient of alertRecipientsBySeverity[alert.severity]) {
      await this.repository.createNotification({
        targetType: "alert",
        targetId: alert.alertId,
        recipient,
        templateKey: `alert_${alert.alertType.toLowerCase()}`,
        payload: {
          title: alert.title,
          severity: alert.severity,
          siteId: alert.siteId,
          deviceId: alert.deviceId
        }
      });

      await this.repository.createNotification({
        targetType: "alert",
        targetId: alert.alertId,
        channel: "in_app",
        recipient,
        templateKey: `alert_${alert.alertType.toLowerCase()}_in_app`,
        payload: {
          title: alert.title,
          severity: alert.severity,
          siteId: alert.siteId,
          deviceId: alert.deviceId
        }
      });
    }
  }

  async notifyIssue(issue: IssueRecord, templateKey: string) {
    const recipients = issue.assignee ? [issue.assignee] : alertRecipientsBySeverity[issue.severity];

    for (const recipient of recipients) {
      await this.repository.createNotification({
        targetType: "issue",
        targetId: issue.issueId,
        recipient,
        templateKey,
        payload: {
          title: issue.title,
          status: issue.status,
          severity: issue.severity,
          siteId: issue.siteId,
          deviceId: issue.deviceId
        }
      });

      await this.repository.createNotification({
        targetType: "issue",
        targetId: issue.issueId,
        channel: "in_app",
        recipient,
        templateKey: `${templateKey}_in_app`,
        payload: {
          title: issue.title,
          status: issue.status,
          severity: issue.severity,
          siteId: issue.siteId,
          deviceId: issue.deviceId
        }
      });
    }
  }
}
