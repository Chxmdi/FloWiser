import assert from "node:assert/strict";
import test from "node:test";
import acmeFixture from "./fixtures/acme-three-phase-v1.json";
import { InMemoryDeadLetterRepository } from "../modules/ingestion/in-memory-dead-letter.repository.js";
import { DeadLetterService } from "../modules/ingestion/dead-letter.service.js";
import { InMemoryIdempotencyRepository } from "../modules/ingestion/in-memory-idempotency.repository.js";
import { IdempotencyService } from "../modules/ingestion/idempotency.service.js";
import { InMemoryOrderingStateRepository } from "../modules/ingestion/in-memory-ordering-state.repository.js";
import { OrderingService } from "../modules/ingestion/ordering.service.js";
import { IngestionConsumerService } from "../modules/ingestion/consumer.service.js";
import { createDefaultDecoderRegistry } from "../modules/decoders/create-default-decoder-registry.js";
import { InMemoryRawEventArchiveRepository } from "../modules/raw-events/in-memory-raw-event-archive.repository.js";
import { RawEventArchiveService } from "../modules/raw-events/raw-event-archive.service.js";
import { TelemetryDecodeService } from "../modules/telemetry/telemetry-decode.service.js";

const buildService = () => {
  const telemetryDecodeService = new TelemetryDecodeService(
    createDefaultDecoderRegistry(),
    new RawEventArchiveService(new InMemoryRawEventArchiveRepository())
  );

  return new IngestionConsumerService(
    telemetryDecodeService,
    new IdempotencyService(new InMemoryIdempotencyRepository()),
    new OrderingService(new InMemoryOrderingStateRepository()),
    new DeadLetterService(new InMemoryDeadLetterRepository())
  );
};

const baseEnvelope = {
  protocol: "mqtt" as const,
  topic: "tenant/t_123/site/s_002/device/d_meter_01/telemetry",
  context: {
    tenantId: "t_123",
    branchId: "b_009",
    siteId: "s_002",
    deviceId: "d_meter_01"
  },
  sourceAuth: {
    transportMessageId: "msg-001",
    connectionId: "conn-001",
    principalId: "iot-cert-001",
    authenticated: true,
    signatureVerified: true,
    qos: 1
  },
  payload: acmeFixture
};

test("processes a valid envelope end-to-end", () => {
  const service = buildService();
  const result = service.process(baseEnvelope);

  assert.equal(result.status, "processed");
  assert.ok(result.rawEventId);
  assert.ok(result.canonicalEventId);
  assert.equal(result.findings.length, 0);
});

test("drops duplicate transport messages", () => {
  const service = buildService();
  const first = service.process(baseEnvelope);
  const second = service.process(baseEnvelope);

  assert.equal(first.status, "processed");
  assert.equal(second.status, "duplicate_transport");
});

test("detects duplicate canonical messages when transport ids differ", () => {
  const service = buildService();
  const first = service.process(baseEnvelope);
  const second = service.process({
    ...baseEnvelope,
    sourceAuth: {
      ...baseEnvelope.sourceAuth,
      transportMessageId: "msg-002"
    }
  });

  assert.equal(first.status, "processed");
  assert.equal(second.status, "duplicate_canonical");
});

test("sends unauthenticated sources to dead letter", () => {
  const service = buildService();
  const result = service.process({
    ...baseEnvelope,
    sourceAuth: {
      ...baseEnvelope.sourceAuth,
      transportMessageId: "msg-003",
      authenticated: false
    }
  });

  assert.equal(result.status, "dead_letter");
  assert.ok(result.deadLetterEntryId);
});

test("detects sequence gaps and out-of-order telemetry", () => {
  const service = buildService();

  const baseline = service.process({
    ...baseEnvelope,
    sourceAuth: {
      ...baseEnvelope.sourceAuth,
      transportMessageId: "msg-004"
    },
    payload: {
      ...acmeFixture,
      seq: 10,
      timestamp: "2026-04-07T11:57:00Z"
    }
  });

  const gap = service.process({
    ...baseEnvelope,
    sourceAuth: {
      ...baseEnvelope.sourceAuth,
      transportMessageId: "msg-005"
    },
    payload: {
      ...acmeFixture,
      seq: 12,
      timestamp: "2026-04-07T11:58:00Z"
    }
  });

  const outOfOrder = service.process({
    ...baseEnvelope,
    sourceAuth: {
      ...baseEnvelope.sourceAuth,
      transportMessageId: "msg-006"
    },
    payload: {
      ...acmeFixture,
      seq: 11,
      timestamp: "2026-04-07T11:57:30Z"
    }
  });

  assert.equal(baseline.status, "processed");
  assert.ok(gap.findings.includes("sequence_gap"));
  assert.ok(outOfOrder.findings.includes("out_of_order"));
  assert.ok(outOfOrder.findings.includes("late_arrival"));
});
