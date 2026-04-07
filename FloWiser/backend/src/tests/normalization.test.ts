import assert from "node:assert/strict";
import test from "node:test";
import { mapSatecMetricCode } from "../modules/normalization/metric-map.js";
import { normalizeTimestampToUtc } from "../modules/normalization/timestamps.js";
import { wattsToKw, whToKwh } from "../modules/normalization/units.js";

test("unit helpers normalize watts and watt hours", () => {
  assert.equal(wattsToKw(27500), 27.5);
  assert.equal(whToKwh(198765400), 198765.4);
});

test("timestamp normalizer returns UTC ISO strings", () => {
  assert.equal(normalizeTimestampToUtc("2026-04-07T12:00:00+01:00"), "2026-04-07T11:00:00.000Z");
});

test("satec metric map resolves known channel codes", () => {
  assert.equal(mapSatecMetricCode("P_TOTAL_W"), "kw");
  assert.equal(mapSatecMetricCode("UNKNOWN"), undefined);
});
