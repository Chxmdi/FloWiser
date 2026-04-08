import assert from "node:assert/strict";
import test from "node:test";
import { canonicalSchemaVersion, type CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { RuleExecutionTrace } from "../modules/rules/rule.types.js";
import { RecommendationEngineService } from "../modules/recommendations/recommendation-engine.service.js";
import { RootCauseService } from "../modules/recommendations/root-cause.service.js";

class FakeRecommendationRepository {
  recommendations: any[] = [];

  async upsertRecommendation(input: any) {
    const existingIndex = this.recommendations.findIndex(
      (item) => item.recommendationKey === input.recommendationKey
    );
    const record = {
      actionId: existingIndex >= 0 ? this.recommendations[existingIndex].actionId : `rec-${this.recommendations.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input
    };
    if (existingIndex >= 0) {
      this.recommendations[existingIndex] = record;
    } else {
      this.recommendations.push(record);
    }
    return record;
  }

  async listRecommendations() {
    return this.recommendations.sort((left, right) => right.priorityScore - left.priorityScore);
  }

  async getRecommendation(actionId: string) {
    return this.recommendations.find((item) => item.actionId === actionId);
  }

  async applyDecision(actionId: string, decision: string, input: { actor: string; note?: string }) {
    const item = await this.getRecommendation(actionId);
    if (!item) return undefined;
    if (decision === "approve") {
      item.approvalStatus = "approved";
      item.status = "approved";
      item.approvedBy = input.actor;
    } else if (decision === "reject") {
      item.approvalStatus = "rejected";
      item.status = "rejected";
      item.rejectedBy = input.actor;
    } else {
      item.status = "resolved";
    }
    item.approvalNote = input.note;
    return item;
  }
}

const buildEvent = (overrides: Partial<CanonicalTelemetryEvent> = {}): CanonicalTelemetryEvent => ({
  eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  rawEventId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  schemaVersion: canonicalSchemaVersion,
  receivedAt: "2026-04-07T23:00:00.000Z",
  meterTimestamp: "2026-04-07T23:00:00.000Z",
  tenantId: "tenant-1",
  branchId: "branch-1",
  siteId: "site-1",
  deviceId: "device-1",
  sourceProtocol: "mqtt",
  sourceTopic: "tenant/tenant-1/site/site-1/device/device-1/telemetry",
  decoderId: "acme-three-phase-v1",
  decoderVersion: "1.0.0",
  decoderAuditId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  metrics: { kw: 15, kwhTotal: 100, voltageL1: 230 },
  status: { meterOnline: true, tamperFlag: false, generatorRunning: false, gridAvailable: true },
  quality: { status: "good", score: 100, flags: [] },
  ...overrides
});

const buildTrace = (overrides: Partial<RuleExecutionTrace> = {}): RuleExecutionTrace => ({
  traceId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  ruleId: "after_hours_baseload_waste",
  ruleVersion: "1.0.0",
  matched: true,
  severity: "medium",
  tenantId: "tenant-1",
  branchId: "branch-1",
  siteId: "site-1",
  deviceId: "device-1",
  eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  title: "After-hours baseload waste",
  summary: "Site site-1 is drawing 15 kW during after-hours windows.",
  evidence: { kw: 15 },
  executedAt: "2026-04-07T23:00:00.000Z",
  createdAt: "2026-04-07T23:00:00.000Z",
  ...overrides
});

test("generates ranked recommendations from matched rules", async () => {
  const service = new RecommendationEngineService(
    new FakeRecommendationRepository() as any,
    new RootCauseService()
  );

  const recommendations = await service.generateFromRuleTraces(buildEvent(), [
    buildTrace(),
    buildTrace({
      traceId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      ruleId: "generator_inefficient_runtime",
      title: "Generator inefficient runtime",
      summary: "Generator is running while grid appears available.",
      evidence: { generatorRunning: true, gridAvailable: true }
    })
  ]);

  assert.equal(recommendations.length, 2);
  assert.ok(recommendations[0].priorityScore >= recommendations[1].priorityScore);
});

test("approves recommendation decisions", async () => {
  const repository = new FakeRecommendationRepository();
  const service = new RecommendationEngineService(repository as any, new RootCauseService());
  const [recommendation] = await service.generateFromRuleTraces(buildEvent(), [buildTrace()]);

  const approved = await service.approveRecommendation(recommendation.actionId, {
    actor: "ops-manager",
    note: "Approved for rollout"
  });

  assert.equal(approved?.approvalStatus, "approved");
  assert.equal(approved?.status, "approved");
});
