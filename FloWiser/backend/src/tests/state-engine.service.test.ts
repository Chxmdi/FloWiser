import assert from "node:assert/strict";
import test from "node:test";
import type {
  BranchStateProjection,
  CurrentStateRepository,
  DeviceStateProjection,
  SiteStateProjection
} from "../modules/storage/current-state.repository.js";
import { StateEngineService } from "../modules/state/state-engine.service.js";

class InMemoryCurrentStateRepository implements CurrentStateRepository {
  private device?: DeviceStateProjection & { updatedAt: string };
  private site?: SiteStateProjection & { updatedAt: string };
  private branch?: BranchStateProjection & { updatedAt: string };

  async upsertDeviceState(projection: DeviceStateProjection) {
    this.device = { ...projection, updatedAt: new Date().toISOString() };
  }

  async upsertSiteState(projection: SiteStateProjection) {
    this.site = { ...projection, updatedAt: new Date().toISOString() };
  }

  async upsertBranchState(projection: BranchStateProjection) {
    this.branch = { ...projection, updatedAt: new Date().toISOString() };
  }

  async getDeviceState(_deviceId: string) {
    return this.device;
  }

  async getSiteState(_siteId: string) {
    return this.site;
  }

  async getBranchState(_branchId: string) {
    return this.branch;
  }
}

const buildProjection = (): DeviceStateProjection => ({
  deviceId: "device-1",
  tenantId: "tenant-1",
  branchId: "branch-1",
  siteId: "site-1",
  latestEventId: "event-1",
  latestRawEventId: "raw-1",
  latestTelemetryAt: new Date(Date.now() - 60_000).toISOString(),
  lastReceivedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
  isOnline: true,
  generatorRunning: false,
  gridAvailable: true,
  healthScore: 82,
  qualityStatus: "suspicious",
  qualityScore: 78,
  qualityFlagsCount: 2,
  openIssueCount: 0
});

test("returns delayed freshness for recent but lagging online devices", async () => {
  const repository = new InMemoryCurrentStateRepository();
  await repository.upsertDeviceState(buildProjection());
  const service = new StateEngineService(repository);

  const result = await service.getDeviceState("device-1");

  assert.equal(result?.freshnessStatus, "delayed");
});

test("returns offline freshness for offline branches", async () => {
  const repository = new InMemoryCurrentStateRepository();
  await repository.upsertBranchState({
    branchId: "branch-1",
    tenantId: "tenant-1",
    latestEventId: "event-1",
    latestTelemetryAt: new Date(Date.now() - 60_000).toISOString(),
    lastReceivedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
    isOnline: false,
    generatorRunning: false,
    gridAvailable: true,
    healthScore: 55,
    qualityStatus: "bad",
    qualityScore: 40,
    qualityFlagsCount: 3,
    openIssueCount: 0
  });
  const service = new StateEngineService(repository);

  const result = await service.getBranchState("branch-1");

  assert.equal(result?.freshnessStatus, "offline");
});
