import type { AlertPolicyRecord } from "./telemetry-infra.types.js";

export const defaultAlertPolicies: Omit<AlertPolicyRecord, "createdAt" | "updatedAt">[] = [
  {
    policyId: "gateway_offline_count_high",
    name: "Gateway offline count high",
    description: "Triggers when one or more gateways are offline.",
    signalKey: "offlineGatewayCount",
    comparator: ">=",
    threshold: 1,
    severity: "high",
    enabled: true
  },
  {
    policyId: "dead_letter_count_high",
    name: "Dead letter count high",
    description: "Triggers when any dispatch has been dead-lettered.",
    signalKey: "deadLetterCount",
    comparator: ">=",
    threshold: 1,
    severity: "critical",
    enabled: true
  },
  {
    policyId: "broker_pending_count_medium",
    name: "Broker pending backlog high",
    description: "Triggers when broker backlog grows too large.",
    signalKey: "brokerPendingCount",
    comparator: ">=",
    threshold: 25,
    severity: "medium",
    enabled: true
  },
  {
    policyId: "open_incident_count_medium",
    name: "Open incident count high",
    description: "Triggers when open operational incident load becomes too high.",
    signalKey: "openIncidentCount",
    comparator: ">=",
    threshold: 5,
    severity: "medium",
    enabled: true
  },
  {
    policyId: "retry_scheduled_count_medium",
    name: "Retry scheduled count high",
    description: "Triggers when too many dispatches are waiting for retry.",
    signalKey: "retryScheduledCount",
    comparator: ">=",
    threshold: 10,
    severity: "medium",
    enabled: true
  }
];
