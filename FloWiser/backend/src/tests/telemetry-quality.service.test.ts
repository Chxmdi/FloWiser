import assert from "node:assert/strict";
import test from "node:test";
import { canonicalSchemaVersion, type CanonicalTelemetryEvent } from "@flowiser/schemas";
import { InMemoryQualityHistoryRepository } from "../modules/quality/in-memory-quality-history.repository.js";
import { QualityMetricsService } from "../modules/quality/quality-metrics.service.js";
import { TelemetryQualityService } from "../modules/quality/telemetry-quality.service.js";

const buildEvent = (overrides: Partial<CanonicalTelemetryEvent> = {}): CanonicalTelemetryEvent => ({
  eventId: "11111111-1111-4111-8111-111111111111",
  rawEventId: "22222222-2222-4222-8222-222222222222",
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
  decoderAuditId: "33333333-3333-4333-8333-333333333333",
  metrics: {
    kw: 12,
    kwhTotal: 100,
    voltageL1: 230,
    voltageL2: 229,
    voltageL3: 231,
    currentL1: 11,
    currentL2: 11,
    currentL3: 10,
    frequency: 50,
    powerFactor: 0.93
  },
  status: {
    meterOnline: true,
    tamperFlag: false
  },
  quality: {
    status: "unknown",
    score: 100,
    flags: []
  },
  ...overrides
});

test("marks large timestamp drift as bad quality", () => {
  const service = new TelemetryQualityService(
    new InMemoryQualityHistoryRepository(),
    new QualityMetricsService()
  );

  const result = service.evaluate(
    buildEvent({
      receivedAt: "2026-04-07T12:30:00.000Z"
    })
  );

  assert.equal(result.quality.status, "bad");
  assert.ok(result.quality.flags.includes("timestamp_drift_critical"));
});

test("marks counter rollover when cumulative energy drops", () => {
  const history = new InMemoryQualityHistoryRepository();
  const service = new TelemetryQualityService(history, new QualityMetricsService());

  service.evaluate(buildEvent());

  const result = service.evaluate(
    buildEvent({
      eventId: "44444444-4444-4444-8444-444444444444",
      rawEventId: "55555555-5555-4555-8555-555555555555",
      meterTimestamp: "2026-04-07T12:05:00.000Z",
      metrics: {
        kw: 10,
        kwhTotal: 95,
        voltageL1: 230,
        voltageL2: 230,
        voltageL3: 230,
        currentL1: 8,
        currentL2: 8,
        currentL3: 8,
        frequency: 50,
        powerFactor: 0.95
      }
    })
  );

  assert.equal(result.quality.status, "bad");
  assert.ok(result.quality.flags.includes("counter_reset_or_rollover"));
});
