import assert from "node:assert/strict";
import test from "node:test";
import { ReportingService } from "../modules/reporting/reporting.service.js";

class FakeReportingRepository {
  context = {
    actionId: "11111111-1111-4111-8111-111111111111",
    tenantId: "tenant-1",
    branchId: "branch-1",
    siteId: "site-1",
    deviceId: "device-1",
    title: "Cut after-hours baseload",
    actionType: "schedule_adjustment",
    recommendationStatus: "resolved",
    approvalStatus: "approved",
    expectedMonthlySavings: 120000,
    expectedDieselSavings: 20000,
    confidenceScore: 86,
    effortScore: 18,
    lastSeenAt: new Date().toISOString(),
    executionId: "exec-1",
    executionMode: "automated",
    executionStatus: "executed",
    executionRequestedAt: new Date().toISOString(),
    executionCompletedAt: new Date().toISOString(),
    dispatchId: "dispatch-1",
    dispatchChannel: "simulated_gateway",
    dispatchStatus: "succeeded",
    dispatchRequestedAt: new Date().toISOString(),
    dispatchCompletedAt: new Date().toISOString(),
    simulationResult: {}
  };
  created: any[] = [];

  async getRecommendationVerificationContext(actionId: string) {
    return actionId === this.context.actionId ? this.context : undefined;
  }
  async createVerificationSnapshot(input: any) {
    const record = {
      snapshotId: `snapshot-${this.created.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input
    };
    this.created.push(record);
    return record;
  }
  async listVerificationSnapshots() { return this.created; }
  async getRecommendationVerification(actionId: string) {
    return { recommendation: { actionId }, snapshots: this.created.filter((item) => item.actionId === actionId) };
  }
  async getOverview() { return { summary: { verifiedActionCount: this.created.length } }; }
  async getExecutiveReport() { return { portfolio: { verifiedActionCount: this.created.length } }; }
  async getSiteReport(siteId: string) { return { siteId, summary: { verifiedActionCount: this.created.length } }; }
}

test("creates realized verification snapshot for successful executed dispatch", async () => {
  const service = new ReportingService(new FakeReportingRepository() as any);
  const result = await service.verifyRecommendation("11111111-1111-4111-8111-111111111111", {
    actor: "ops-manager",
    note: "Verified after simulated dispatch"
  });

  assert.equal(result?.snapshot.verificationStatus, "realized");
  assert.ok((result?.snapshot.realizedMonthlySavings ?? 0) > 0);
  assert.ok((result?.snapshot.roiScore ?? 0) > 0);
});

test("keeps recommendation unverified when no execution exists", async () => {
  const repository = new FakeReportingRepository();
  repository.context = { ...repository.context, executionId: undefined, executionStatus: undefined, dispatchId: undefined, dispatchStatus: undefined };
  const service = new ReportingService(repository as any);

  const result = await service.verifyRecommendation("11111111-1111-4111-8111-111111111111", {
    actor: "ops-manager"
  });

  assert.equal(result?.snapshot.verificationStatus, "unverified");
  assert.equal(result?.snapshot.realizedMonthlySavings, 0);
});
