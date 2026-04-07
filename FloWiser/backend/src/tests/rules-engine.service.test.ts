import assert from "node:assert/strict";
import test from "node:test";
import { canonicalSchemaVersion, type CanonicalTelemetryEvent } from "@flowiser/schemas";
import { defaultRules } from "../modules/rules/default-rules.js";
import { RulesEngineService } from "../modules/rules/rules-engine.service.js";

class FakeRulesRepository {
  rules = [...defaultRules];
  traces: any[] = [];

  async ensureDefaults() {}
  async listRules() { return this.rules; }
  async getRule(ruleId: string) { return this.rules.find((rule) => rule.ruleId === ruleId); }
  async updateRule(ruleId: string, patch: any) {
    const index = this.rules.findIndex((rule) => rule.ruleId === ruleId);
    if (index === -1) return undefined;
    this.rules[index] = { ...this.rules[index], ...patch };
    return this.rules[index];
  }
  async saveTrace(trace: any) {
    const saved = { traceId: `trace-${this.traces.length + 1}`, createdAt: trace.executedAt, ...trace };
    this.traces.push(saved);
    return saved;
  }
  async listTraces() { return this.traces; }
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
  metrics: {
    kw: 12,
    kwhTotal: 100,
    voltageL1: 230,
    currentL1: 10,
    frequency: 50,
    powerFactor: 0.95
  },
  status: {
    meterOnline: true,
    tamperFlag: false,
    generatorRunning: false,
    gridAvailable: true
  },
  quality: {
    status: "good",
    score: 100,
    flags: []
  },
  ...overrides
});

test("matches after-hours baseload waste during late-night load", async () => {
  const service = new RulesEngineService(new FakeRulesRepository() as any);
  const result = await service.evaluateTelemetry(buildEvent());

  assert.ok(result.matchedRules.some((trace) => trace.ruleId === "after_hours_baseload_waste"));
});

test("matches excessive generator cycling after repeated starts", async () => {
  const service = new RulesEngineService(new FakeRulesRepository() as any);

  await service.evaluateTelemetry(buildEvent({
    eventId: "11111111-1111-4111-8111-111111111111",
    rawEventId: "22222222-2222-4222-8222-222222222222",
    meterTimestamp: "2026-04-07T10:00:00.000Z",
    receivedAt: "2026-04-07T10:00:00.000Z",
    status: { meterOnline: true, tamperFlag: false, generatorRunning: false, gridAvailable: false }
  }));

  await service.evaluateTelemetry(buildEvent({
    eventId: "33333333-3333-4333-8333-333333333333",
    rawEventId: "44444444-4444-4444-8444-444444444444",
    meterTimestamp: "2026-04-07T10:05:00.000Z",
    receivedAt: "2026-04-07T10:05:00.000Z",
    status: { meterOnline: true, tamperFlag: false, generatorRunning: true, gridAvailable: false }
  }));

  await service.evaluateTelemetry(buildEvent({
    eventId: "55555555-5555-4555-8555-555555555555",
    rawEventId: "66666666-6666-4666-8666-666666666666",
    meterTimestamp: "2026-04-07T11:00:00.000Z",
    receivedAt: "2026-04-07T11:00:00.000Z",
    status: { meterOnline: true, tamperFlag: false, generatorRunning: false, gridAvailable: false }
  }));

  const result = await service.evaluateTelemetry(buildEvent({
    eventId: "77777777-7777-4777-8777-777777777777",
    rawEventId: "88888888-8888-4888-8888-888888888888",
    meterTimestamp: "2026-04-07T11:05:00.000Z",
    receivedAt: "2026-04-07T11:05:00.000Z",
    status: { meterOnline: true, tamperFlag: false, generatorRunning: true, gridAvailable: false }
  }));

  await service.evaluateTelemetry(buildEvent({
    eventId: "99999999-9999-4999-8999-999999999999",
    rawEventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab",
    meterTimestamp: "2026-04-07T12:00:00.000Z",
    receivedAt: "2026-04-07T12:00:00.000Z",
    status: { meterOnline: true, tamperFlag: false, generatorRunning: false, gridAvailable: false }
  }));

  const finalResult = await service.evaluateTelemetry(buildEvent({
    eventId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc",
    rawEventId: "cccccccc-cccc-4ccc-8ccc-cccccccccccd",
    meterTimestamp: "2026-04-07T12:05:00.000Z",
    receivedAt: "2026-04-07T12:05:00.000Z",
    status: { meterOnline: true, tamperFlag: false, generatorRunning: true, gridAvailable: false }
  }));

  assert.ok(finalResult.matchedRules.some((trace) => trace.ruleId === "excessive_start_stop_cycling"));
});
