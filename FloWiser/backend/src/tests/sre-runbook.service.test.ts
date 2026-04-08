import assert from "node:assert/strict";
import test from "node:test";
import { SreRunbookService } from "../modules/sre/sre-runbook.service.js";

class FakeSreRepository {
  executions: any[] = [];
  async createExecution(input: any) {
    const execution = { runbookExecutionId: `run-${this.executions.length + 1}`, createdAt: new Date().toISOString(), ...input };
    this.executions.push(execution);
    return execution;
  }
  async completeExecution(runbookExecutionId: string, status: string, output: any) {
    const execution = this.executions.find((item) => item.runbookExecutionId === runbookExecutionId);
    Object.assign(execution, { status, output, completedAt: new Date().toISOString() });
    return execution;
  }
  async listExecutions() { return this.executions; }
}

class FakeGatewayOperationsService {
  async runRetrySweep() {
    return { processed: 2, retryScheduledCount: 1, deadLetteredCount: 1 };
  }
}

class FakeObservabilityService {
  async captureSnapshot() {
    return { snapshot: { snapshotId: "snapshot-1" }, counts: { openIncidentCount: 1 } };
  }
}

test("executes retry and capture runbook", async () => {
  const service = new SreRunbookService(
    new FakeSreRepository() as any,
    new FakeGatewayOperationsService() as any,
    new FakeObservabilityService() as any
  );

  const result = await service.executeRunbook("retry-and-capture", {
    actor: "platform-admin",
    input: {}
  });

  assert.equal(result?.execution.status, "completed");
  assert.ok(result?.execution.output.retry);
  assert.ok(result?.execution.output.snapshot);
});
