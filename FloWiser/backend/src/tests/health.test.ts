import assert from "node:assert/strict";
import test from "node:test";
import { buildHealthPayload } from "../routes/health.js";

test("buildHealthPayload returns ok status", () => {
  const payload = buildHealthPayload();

  assert.equal(payload.status, "ok");
  assert.equal(payload.service, "flowiser-backend");
  assert.ok(payload.timestamp);
});
