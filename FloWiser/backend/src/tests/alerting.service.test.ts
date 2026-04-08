import assert from "node:assert/strict";
import test from "node:test";
import { AlertingService } from "../modules/telemetry-infra/alerting.service.js";

class FakeAlertingRepository {
  policies: any[] = [];
  events: any[] = [];
  async ensureAlertPolicies(defaults: any[]) { this.policies = defaults.map((item) => ({ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })); }
  async listAlertPolicies() { return this.policies; }
  async getAlertPolicy(policyId: string) { return this.policies.find((item) => item.policyId === policyId); }
  async updateAlertPolicy(policyId: string, patch: any) { const policy = await this.getAlertPolicy(policyId); if (!policy) return undefined; Object.assign(policy, patch); return policy; }
  async getOpenEventByPolicy(policyId: string) { return this.events.find((item) => item.policyId === policyId && item.status === "open"); }
  async createAlertEvent(input: any) { const event = { alertEventId: `alert-${this.events.length + 1}`, triggeredAt: new Date().toISOString(), ...input }; this.events.push(event); return event; }
  async resolveOpenEventsByPolicy(policyId: string) { const resolved = this.events.filter((item) => item.policyId === policyId && item.status === "open"); resolved.forEach((item) => { item.status = "resolved"; item.resolvedAt = new Date().toISOString(); }); return resolved; }
  async listAlertEvents() { return this.events; }
}

class FakeObservabilityService {
  current: any = { offlineGatewayCount: 2, deadLetterCount: 0, brokerPendingCount: 1, openIncidentCount: 0, retryScheduledCount: 0 };
  async getOverview() { return { current: this.current }; }
}

test("triggers an alert when observability signal breaches threshold", async () => {
  const service = new AlertingService(new FakeAlertingRepository() as any, new FakeObservabilityService() as any);
  const result = await service.evaluate({ actor: "platform-admin" });

  assert.ok(result.triggeredCount >= 1);
});

test("resolves alert when signal returns below threshold", async () => {
  const repository = new FakeAlertingRepository();
  const observability = new FakeObservabilityService();
  const service = new AlertingService(repository as any, observability as any);
  await service.evaluate({ actor: "platform-admin" });
  observability.current.offlineGatewayCount = 0;
  const result = await service.evaluate({ actor: "platform-admin" });

  assert.ok(result.resolvedCount >= 1);
});
