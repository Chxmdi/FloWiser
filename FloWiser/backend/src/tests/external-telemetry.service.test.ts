import assert from "node:assert/strict";
import test from "node:test";
import { ExternalTelemetryService } from "../modules/telemetry-infra/external-telemetry.service.js";

class FakeTelemetryInfraRepository {
  profiles: any[] = [];
  metrics: any[] = [];
  logs: any[] = [];
  spans: any[] = [];
  async ensureProfiles(defaults: any[]) { this.profiles = defaults.map((item) => ({ ...item })); }
  async ensureAlertPolicies() {}
  async listProfiles() { return this.profiles; }
  async getProfile(profileId: string) { return this.profiles.find((item) => item.profileId === profileId); }
  async updateProfile(profileId: string, patch: any) {
    const profile = await this.getProfile(profileId);
    if (!profile) return undefined;
    Object.assign(profile, patch);
    return profile;
  }
  async createMetricPoint(input: any) {
    const point = { metricId: `metric-${this.metrics.length + 1}`, createdAt: new Date().toISOString(), ...input };
    this.metrics.push(point);
    return point;
  }
  async listMetricPoints() { return this.metrics; }
  async createLogEntry(input: any) {
    const log = { logId: `log-${this.logs.length + 1}`, createdAt: new Date().toISOString(), ...input };
    this.logs.push(log);
    return log;
  }
  async listLogEntries() { return this.logs; }
  async createTraceSpan(input: any) {
    const span = { spanId: `span-${this.spans.length + 1}`, createdAt: new Date().toISOString(), ...input };
    this.spans.push(span);
    return span;
  }
  async listTraceSpans() { return this.spans; }
}

class FakeObservabilityService {
  async getOverview() {
    return {
      current: {
        onlineGatewayCount: 2,
        staleGatewayCount: 1,
        offlineGatewayCount: 0,
        pendingDispatchCount: 4,
        openIncidentCount: 1,
        deadLetterCount: 0,
        brokerPendingCount: 3,
        brokerClaimedCount: 2,
        brokerDeadLetteredCount: 0
      }
    };
  }
}

test("captures metrics from current observability overview", async () => {
  const service = new ExternalTelemetryService(new FakeTelemetryInfraRepository() as any, new FakeObservabilityService() as any);
  const result = await service.captureMetrics({ actor: "platform-admin" });

  assert.ok(result.points.length >= 5);
  assert.equal(result.points[0].source, "observability-overview");
});

test("records log and trace spans", async () => {
  const service = new ExternalTelemetryService(new FakeTelemetryInfraRepository() as any, new FakeObservabilityService() as any);
  const log = await service.recordLog({ actor: "platform-admin", severity: "info", source: "test", message: "hello" });
  const span = await service.recordTraceSpan({ actor: "platform-admin", traceId: "trace-1", spanName: "test-span", source: "test", status: "ok", durationMs: 150 });

  assert.equal(log.source, "test");
  assert.equal(span.traceId, "trace-1");
});
