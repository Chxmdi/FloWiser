import assert from "node:assert/strict";
import test from "node:test";
import { AccessAuthorizationService } from "../modules/access/access-authorization.service.js";

class FakeAccessRepository {
  memberships = [
    {
      membershipId: "11111111-1111-4111-8111-111111111111",
      tenantId: "tenant-1",
      userId: "ops-manager",
      email: "ops-manager@flowiser.local",
      role: "operator",
      allowedBranchIds: ["branch-1"],
      allowedSiteIds: ["site-1"],
      globalAccess: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      membershipId: "22222222-2222-4222-8222-222222222222",
      tenantId: "tenant-1",
      userId: "tenant-admin",
      email: "tenant-admin@flowiser.local",
      role: "tenant_admin",
      allowedBranchIds: [],
      allowedSiteIds: [],
      globalAccess: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  async ensureDefaults() {}
  async findMembership(tenantId: string, userId: string) {
    return this.memberships.find((membership) => membership.tenantId === tenantId && membership.userId === userId && membership.isActive);
  }
  async listMemberships(filters: { tenantId?: string }) {
    return this.memberships.filter((membership) => !filters.tenantId || membership.tenantId === filters.tenantId);
  }
  async getMembership(membershipId: string) {
    return this.memberships.find((membership) => membership.membershipId === membershipId);
  }
  async createMembership(input: any) {
    const created = { membershipId: "33333333-3333-4333-8333-333333333333", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...input };
    this.memberships.push(created);
    return created;
  }
  async updateMembership(membershipId: string, patch: any) {
    const index = this.memberships.findIndex((membership) => membership.membershipId === membershipId);
    if (index === -1) return undefined;
    this.memberships[index] = { ...this.memberships[index], ...patch, updatedAt: new Date().toISOString() };
    return this.memberships[index];
  }
}

test("authorizes operator for allowed site scope and blocks outside scope", async () => {
  const service = new AccessAuthorizationService(new FakeAccessRepository() as any);
  const actor = await service.resolveActorContext("tenant-1", "ops-manager");

  const allowed = service.authorize(actor!, ["operator"], { siteId: "site-1" });
  const blocked = service.authorize(actor!, ["operator"], { siteId: "site-9" });

  assert.equal(allowed.allowed, true);
  assert.equal(blocked.allowed, false);
});

test("prevents tenant admin from granting platform-wide access", async () => {
  const service = new AccessAuthorizationService(new FakeAccessRepository() as any);
  const requester = await service.resolveActorContext("tenant-1", "tenant-admin");

  await assert.rejects(
    () => service.createMembership(requester!, {
      tenantId: "tenant-1",
      userId: "new-user",
      email: "new-user@flowiser.local",
      role: "platform_admin",
      allowedBranchIds: [],
      allowedSiteIds: [],
      globalAccess: true,
      isActive: true
    }),
    /cannot assign platform-wide access/
  );
});
