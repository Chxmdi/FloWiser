import type { MembershipCreateInput } from "./access.types.js";

export const defaultMemberships: MembershipCreateInput[] = [
  {
    tenantId: "tenant-1",
    userId: "platform-admin",
    email: "platform-admin@flowiser.local",
    role: "platform_admin",
    allowedBranchIds: [],
    allowedSiteIds: [],
    globalAccess: true,
    isActive: true
  },
  {
    tenantId: "tenant-1",
    userId: "tenant-admin",
    email: "tenant-admin@flowiser.local",
    role: "tenant_admin",
    allowedBranchIds: [],
    allowedSiteIds: [],
    globalAccess: false,
    isActive: true
  },
  {
    tenantId: "tenant-1",
    userId: "ops-manager",
    email: "ops-manager@flowiser.local",
    role: "operator",
    allowedBranchIds: [],
    allowedSiteIds: [],
    globalAccess: false,
    isActive: true
  },
  {
    tenantId: "tenant-1",
    userId: "field-tech",
    email: "field-tech@flowiser.local",
    role: "operator",
    allowedBranchIds: [],
    allowedSiteIds: [],
    globalAccess: false,
    isActive: true
  },
  {
    tenantId: "tenant-1",
    userId: "exec-viewer",
    email: "exec-viewer@flowiser.local",
    role: "viewer",
    allowedBranchIds: [],
    allowedSiteIds: [],
    globalAccess: false,
    isActive: true
  },
  {
    tenantId: "tenant-1",
    userId: "director-1",
    email: "director-1@flowiser.local",
    role: "tenant_admin",
    allowedBranchIds: [],
    allowedSiteIds: [],
    globalAccess: false,
    isActive: true
  }
];
