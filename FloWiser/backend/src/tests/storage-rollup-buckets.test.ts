import assert from "node:assert/strict";
import test from "node:test";
import { getBucketStart } from "../modules/storage/rollup-buckets.js";

test("floors timestamps into 5-minute buckets", () => {
  assert.equal(getBucketStart("2026-04-07T12:14:59Z", "5m"), "2026-04-07T12:10:00.000Z");
});

test("floors timestamps into daily buckets", () => {
  assert.equal(getBucketStart("2026-04-07T12:14:59Z", "1d"), "2026-04-07T00:00:00.000Z");
});
