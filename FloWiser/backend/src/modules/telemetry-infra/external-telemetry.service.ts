import { defaultAlertPolicies } from "./default-alert-policies.js";
import { defaultInfraProfiles } from "./default-infra-profiles.js";
import type {
  InfraProfileUpdateInput,
  LogEntryInput,
  MetricsCaptureInput,
  TraceSpanInput
} from "./telemetry-infra.types.js";
import { PostgresTelemetryInfraRepository } from "./postgres-telemetry-infra.repository.js";
import type { ObservabilityService } from "../observability/observability.service.js";

export class ExternalTelemetryService {
  private defaultsEnsured = false;

  constructor(
    private readonly repository: PostgresTelemetryInfraRepository,
    private readonly observabilityService: ObservabilityService
  ) {}

  async listProfiles() {
    await this.ensureDefaults();
    return this.repository.listProfiles();
  }

  async getProfile(profileId: string) {
    await this.ensureDefaults();
    return this.repository.getProfile(profileId);
  }

  async updateProfile(profileId: string, patch: InfraProfileUpdateInput) {
    await this.ensureDefaults();
    return this.repository.updateProfile(profileId, patch);
  }

  async checkProfile(profileId: string, actor: string) {
    await this.ensureDefaults();
    const profile = await this.repository.getProfile(profileId);
    if (!profile) {
      return undefined;
    }

    const healthStatus = profile.enabled ? "healthy" : "disabled";
    const updated = await this.repository.updateProfile(profileId, {
      healthStatus,
      lastCheckedAt: new Date().toISOString()
    });

    await this.repository.createLogEntry({
      severity: "info",
      source: "external-telemetry-service",
      message: `Infra profile ${profileId} health check completed by ${actor}`,
      context: { profileId, healthStatus },
      capturedAt: new Date().toISOString()
    });

    return updated;
  }

  async captureMetrics(input: MetricsCaptureInput) {
    await this.ensureDefaults();
    const overview = await this.observabilityService.getOverview();
    const current = overview.current;
    const capturedAt = new Date().toISOString();

    const metricDefinitions = [
      { metricKey: "gateway.online.count", value: current.onlineGatewayCount, unit: "count" },
      { metricKey: "gateway.stale.count", value: current.staleGatewayCount, unit: "count" },
      { metricKey: "gateway.offline.count", value: current.offlineGatewayCount, unit: "count" },
      { metricKey: "dispatch.pending.count", value: current.pendingDispatchCount, unit: "count" },
      { metricKey: "incident.open.count", value: current.openIncidentCount, unit: "count" },
      { metricKey: "dispatch.dead_letter.count", value: current.deadLetterCount, unit: "count" },
      { metricKey: "broker.pending.count", value: current.brokerPendingCount, unit: "count" },
      { metricKey: "broker.claimed.count", value: current.brokerClaimedCount, unit: "count" },
      { metricKey: "broker.dead_lettered.count", value: current.brokerDeadLetteredCount, unit: "count" }
    ];

    const points = await Promise.all(
      metricDefinitions.map((metric) =>
        this.repository.createMetricPoint({
          metricKey: metric.metricKey,
          labels: { actor: input.actor },
          value: metric.value,
          unit: metric.unit,
          source: "observability-overview",
          capturedAt
        })
      )
    );

    await this.repository.createLogEntry({
      severity: "info",
      source: "external-telemetry-service",
      message: `Captured ${points.length} telemetry metrics`,
      context: { actor: input.actor, note: input.note },
      capturedAt
    });

    return { capturedAt, points };
  }

  async listMetrics(filters: { metricKey?: string; source?: string; limit?: number }) {
    await this.ensureDefaults();
    return this.repository.listMetricPoints(filters);
  }

  async recordLog(input: LogEntryInput) {
    await this.ensureDefaults();
    return this.repository.createLogEntry({
      severity: input.severity,
      source: input.source,
      message: input.message,
      context: { actor: input.actor, ...input.context },
      capturedAt: new Date().toISOString()
    });
  }

  async listLogs(filters: { severity?: string; source?: string; limit?: number }) {
    await this.ensureDefaults();
    return this.repository.listLogEntries(filters);
  }

  async recordTraceSpan(input: TraceSpanInput) {
    await this.ensureDefaults();
    const endedAt = new Date().toISOString();
    const startedAt = new Date(Date.now() - input.durationMs).toISOString();
    return this.repository.createTraceSpan({
      traceId: input.traceId,
      parentSpanId: input.parentSpanId,
      spanName: input.spanName,
      source: input.source,
      status: input.status,
      attributes: { actor: input.actor, ...input.attributes },
      startedAt,
      endedAt
    });
  }

  async listTraceSpans(filters: { traceId?: string; source?: string; limit?: number }) {
    await this.ensureDefaults();
    return this.repository.listTraceSpans(filters);
  }

  private async ensureDefaults() {
    if (this.defaultsEnsured) {
      return;
    }

    await this.repository.ensureProfiles(defaultInfraProfiles);
    await this.repository.ensureAlertPolicies(defaultAlertPolicies);
    this.defaultsEnsured = true;
  }
}
