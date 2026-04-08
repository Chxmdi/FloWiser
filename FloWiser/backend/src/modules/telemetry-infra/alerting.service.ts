import { defaultAlertPolicies } from "./default-alert-policies.js";
import type { AlertEvaluationInput, AlertPolicyUpdateInput } from "./telemetry-infra.types.js";
import { PostgresTelemetryInfraRepository } from "./postgres-telemetry-infra.repository.js";
import type { ObservabilityService } from "../observability/observability.service.js";

const compare = (value: number, comparator: string, threshold: number) => {
  switch (comparator) {
    case ">=":
      return value >= threshold;
    case ">":
      return value > threshold;
    case "<=":
      return value <= threshold;
    case "<":
      return value < threshold;
    case "=":
      return value === threshold;
    default:
      return false;
  }
};

export class AlertingService {
  private defaultsEnsured = false;

  constructor(
    private readonly repository: PostgresTelemetryInfraRepository,
    private readonly observabilityService: ObservabilityService
  ) {}

  async listPolicies() {
    await this.ensureDefaults();
    return this.repository.listAlertPolicies();
  }

  async getPolicy(policyId: string) {
    await this.ensureDefaults();
    return this.repository.getAlertPolicy(policyId);
  }

  async updatePolicy(policyId: string, patch: AlertPolicyUpdateInput) {
    await this.ensureDefaults();
    return this.repository.updateAlertPolicy(policyId, patch);
  }

  async listEvents(filters: { status?: string; severity?: string; policyId?: string; limit?: number }) {
    await this.ensureDefaults();
    return this.repository.listAlertEvents(filters);
  }

  async evaluate(input: AlertEvaluationInput) {
    await this.ensureDefaults();
    const overview = await this.observabilityService.getOverview();
    const current = overview.current;
    const policies = await this.repository.listAlertPolicies();

    const triggered = [];
    const resolved = [];

    for (const policy of policies.filter((item) => item.enabled)) {
      const signalValue = Number((current as Record<string, unknown>)[policy.signalKey] ?? 0);
      const breached = compare(signalValue, policy.comparator, policy.threshold);
      const openEvent = await this.repository.getOpenEventByPolicy(policy.policyId);

      if (breached && !openEvent) {
        const event = await this.repository.createAlertEvent({
          policyId: policy.policyId,
          severity: policy.severity,
          status: "open",
          title: `${policy.name} triggered`,
          summary: `${policy.signalKey} is ${signalValue} and breached ${policy.comparator} ${policy.threshold}`,
          payload: {
            actor: input.actor,
            note: input.note,
            signalKey: policy.signalKey,
            signalValue,
            comparator: policy.comparator,
            threshold: policy.threshold
          }
        });
        triggered.push(event);
      }

      if (!breached && openEvent) {
        const events = await this.repository.resolveOpenEventsByPolicy(policy.policyId, {
          resolvedBy: input.actor,
          note: input.note,
          resolvedSignalValue: signalValue
        });
        resolved.push(...events);
      }
    }

    return {
      triggeredCount: triggered.length,
      resolvedCount: resolved.length,
      triggered,
      resolved,
      current
    };
  }

  private async ensureDefaults() {
    if (this.defaultsEnsured) {
      return;
    }

    await this.repository.ensureAlertPolicies(defaultAlertPolicies);
    this.defaultsEnsured = true;
  }
}
