import assert from "node:assert/strict";
import test from "node:test";
import acmeFixture from "./fixtures/acme-three-phase-v1.json";
import gatewayFixture from "./fixtures/gateway-forwarded-acme-v1.json";
import satecFixture from "./fixtures/satec-pm130-v2.json";
import { createDefaultDecoderRegistry } from "../modules/decoders/create-default-decoder-registry.js";
import { InMemoryRawEventArchiveRepository } from "../modules/raw-events/in-memory-raw-event-archive.repository.js";
import { RawEventArchiveService } from "../modules/raw-events/raw-event-archive.service.js";
import { TelemetryDecodeService } from "../modules/telemetry/telemetry-decode.service.js";

const createService = () =>
  new TelemetryDecodeService(
    createDefaultDecoderRegistry(),
    new RawEventArchiveService(new InMemoryRawEventArchiveRepository())
  );

test("decoder registry supports the three seeded adapters", () => {
  const registry = createDefaultDecoderRegistry();
  assert.equal(registry.listSupportedDecoders().length, 3);
});

test("Acme decoder resolves via explicit hint and returns canonical telemetry", () => {
  const service = createService();
  const result = service.decodePreview({
    protocol: "mqtt",
    topic: "tenant/t_123/site/s_002/device/d_meter_01/telemetry",
    decoderHint: {
      vendor: "AcmePower",
      model: "MTR-3P",
      version: "1.0.0"
    },
    context: {
      tenantId: "t_123",
      branchId: "b_009",
      siteId: "s_002",
      deviceId: "d_meter_01"
    },
    payload: acmeFixture
  });

  assert.equal(result.canonicalEvent.decoderId, "acme-three-phase-v1");
  assert.equal(result.canonicalEvent.metrics.kw, 42.7);
  assert.equal(result.rawEvent.parseStatus, "success");
});

test("Satec decoder resolves via payload match and converts units", () => {
  const service = createService();
  const result = service.decodePreview({
    protocol: "mqtt",
    topic: "tenant/t_123/site/s_003/device/d_meter_02/telemetry",
    context: {
      tenantId: "t_123",
      branchId: "b_010",
      siteId: "s_003",
      deviceId: "d_meter_02"
    },
    payload: satecFixture
  });

  assert.equal(result.canonicalEvent.decoderId, "satec-pm130-v2");
  assert.equal(result.canonicalEvent.metrics.kw, 27.45);
  assert.equal(result.canonicalEvent.metrics.kwhTotal, 198765.4);
});

test("Gateway decoder unwraps forwarded meter payloads", () => {
  const service = createService();
  const result = service.decodePreview({
    protocol: "mqtt",
    topic: "tenant/t_123/site/s_002/device/gw_01/telemetry",
    context: {
      tenantId: "t_123",
      branchId: "b_009",
      siteId: "s_002",
      deviceId: "gw_01"
    },
    payload: gatewayFixture
  });

  assert.equal(result.canonicalEvent.decoderId, "gateway-forwarded-acme-v1");
  assert.equal(result.canonicalEvent.status.generatorRunning, true);
  assert.equal(result.canonicalEvent.sourceProtocol, "gateway");
});
