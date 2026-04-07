import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryRegistryStore } from "../modules/registry/in-memory-registry.store.js";
import { RegistryError } from "../modules/registry/errors.js";
import { RegistryService } from "../modules/registry/registry.service.js";

const buildService = () => new RegistryService(new InMemoryRegistryStore());

test("creates a valid tenant, branch, site, asset, and device hierarchy", () => {
  const service = buildService();
  const tenant = service.createTenant({ name: "GridSight Demo", country: "Nigeria", timezone: "Africa/Lagos" });
  const branch = service.createBranch({ tenantId: tenant.id, name: "Lagos HQ", region: "South West", branchType: "hq" });
  const site = service.createSite({ tenantId: tenant.id, branchId: branch.id, name: "Lagos Campus", location: "Victoria Island" });
  const asset = service.createAsset({ tenantId: tenant.id, branchId: branch.id, siteId: site.id, name: "Main incomer", assetCategory: "meter" });
  const device = service.createDevice({ tenantId: tenant.id, branchId: branch.id, siteId: site.id, name: "meter-lag-001", deviceType: "meter", vendor: "AcmePower" });

  assert.equal(service.listTenants().length, 1);
  assert.equal(service.listBranches({ tenantId: tenant.id }).length, 1);
  assert.equal(service.listSites({ branchId: branch.id }).length, 1);
  assert.equal(asset.siteId, site.id);
  assert.equal(device.siteId, site.id);
});

test("rejects a site when its tenant and branch hierarchy are inconsistent", () => {
  const service = buildService();
  const tenantOne = service.createTenant({ name: "Tenant One" });
  const tenantTwo = service.createTenant({ name: "Tenant Two" });
  const branch = service.createBranch({ tenantId: tenantOne.id, name: "Branch One" });

  assert.throws(
    () => service.createSite({ tenantId: tenantTwo.id, branchId: branch.id, name: "Broken Site" }),
    (error: unknown) => error instanceof RegistryError && error.statusCode === 409
  );
});

test("binds, remaps, and unbinds devices while preserving history", () => {
  const service = buildService();
  const tenant = service.createTenant({ name: "Tenant" });
  const branch = service.createBranch({ tenantId: tenant.id, name: "Branch" });
  const site = service.createSite({ tenantId: tenant.id, branchId: branch.id, name: "Site" });
  const assetOne = service.createAsset({ tenantId: tenant.id, branchId: branch.id, siteId: site.id, name: "Asset One", assetCategory: "meter" });
  const assetTwo = service.createAsset({ tenantId: tenant.id, branchId: branch.id, siteId: site.id, name: "Asset Two", assetCategory: "feeder" });
  const device = service.createDevice({ tenantId: tenant.id, branchId: branch.id, siteId: site.id, name: "Gateway", deviceType: "gateway" });

  const binding = service.bindDeviceToAsset({ deviceId: device.id, assetId: assetOne.id });
  const remapped = service.remapBinding(binding.id, { assetId: assetTwo.id });
  const unbound = service.unbindBinding(remapped.id);
  const bindings = service.listBindings({ deviceId: device.id });

  assert.equal(bindings.length, 2);
  assert.equal(bindings.filter((entry) => entry.status === "active").length, 0);
  assert.equal(unbound.status, "inactive");
  assert.ok(bindings.some((entry) => entry.assetId === assetOne.id && entry.endedAt));
  assert.ok(bindings.some((entry) => entry.assetId === assetTwo.id && entry.endedAt));
});

test("imports hierarchy payloads in sequence", () => {
  const service = buildService();
  const tenantId = "11111111-1111-4111-8111-111111111111";
  const branchId = "22222222-2222-4222-8222-222222222222";
  const siteId = "33333333-3333-4333-8333-333333333333";

  const result = service.importHierarchy({
    tenants: [{ id: tenantId, name: "Imported Tenant" }],
    branches: [{ id: branchId, tenantId, name: "Imported Branch" }],
    sites: [{ id: siteId, tenantId, branchId, name: "Imported Site" }],
    assets: [],
    devices: []
  });

  assert.equal(result.tenants.length, 1);
  assert.equal(result.branches[0]?.tenantId, tenantId);
  assert.equal(result.sites[0]?.branchId, branchId);
});
