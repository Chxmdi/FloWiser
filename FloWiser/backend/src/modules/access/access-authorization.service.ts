import { defaultMemberships } from "./default-memberships.js";
import type {
  AccessScope,
  ActorContext,
  ActorRole,
  MembershipCreateInput,
  MembershipUpdateInput,
  TenantMembership
} from "./access.types.js";
import { roleAllows } from "./access.types.js";
import { PostgresAccessRepository } from "./postgres-access.repository.js";

export class AccessAuthorizationService {
  private defaultsEnsured = false;

  constructor(private readonly repository: PostgresAccessRepository) {}

  async resolveActorContext(tenantId: string, userId: string) {
    await this.ensureDefaults();
    const membership = await this.repository.findMembership(tenantId, userId);
    if (!membership) {
      return undefined;
    }

    return this.toActorContext(membership);
  }

  authorize(actor: ActorContext, allowedRoles: ActorRole[], scope?: AccessScope) {
    if (!roleAllows(actor.role, allowedRoles)) {
      return { allowed: false, reason: `Role ${actor.role} is insufficient for this route` };
    }

    if (!actor.globalAccess) {
      if (scope?.tenantId && scope.tenantId !== actor.tenantId) {
        return { allowed: false, reason: `Tenant scope ${scope.tenantId} does not match actor tenant ${actor.tenantId}` };
      }

      if (scope?.branchId && actor.allowedBranchIds.length > 0 && !actor.allowedBranchIds.includes(scope.branchId)) {
        return { allowed: false, reason: `Actor is not allowed to access branch ${scope.branchId}` };
      }

      if (scope?.siteId && actor.allowedSiteIds.length > 0 && !actor.allowedSiteIds.includes(scope.siteId)) {
        return { allowed: false, reason: `Actor is not allowed to access site ${scope.siteId}` };
      }
    }

    return { allowed: true };
  }

  async listMemberships(requester: ActorContext, filters: { tenantId?: string; userId?: string; limit?: number }) {
    await this.ensureDefaults();
    const tenantId = requester.role === "platform_admin" ? filters.tenantId : requester.tenantId;
    return this.repository.listMemberships({ ...filters, tenantId });
  }

  async createMembership(requester: ActorContext, input: MembershipCreateInput) {
    await this.ensureDefaults();
    this.assertMembershipWriteAllowed(requester, input.tenantId, input.role, input.globalAccess);
    return this.repository.createMembership(input);
  }

  async updateMembership(requester: ActorContext, membershipId: string, patch: MembershipUpdateInput) {
    await this.ensureDefaults();
    const current = await this.repository.getMembership(membershipId);
    if (!current) {
      return undefined;
    }

    this.assertMembershipWriteAllowed(
      requester,
      current.tenantId,
      patch.role ?? current.role,
      patch.globalAccess ?? current.globalAccess
    );

    return this.repository.updateMembership(membershipId, patch);
  }

  private assertMembershipWriteAllowed(
    requester: ActorContext,
    tenantId: string,
    targetRole: ActorRole,
    targetGlobalAccess: boolean
  ) {
    if (requester.role === "platform_admin") {
      return;
    }

    if (requester.role !== "tenant_admin") {
      throw new Error("Only tenant or platform admins can manage memberships");
    }

    if (tenantId !== requester.tenantId) {
      throw new Error(`Tenant admin ${requester.userId} cannot manage memberships outside tenant ${requester.tenantId}`);
    }

    if (targetRole === "platform_admin" || targetGlobalAccess) {
      throw new Error("Tenant admins cannot assign platform-wide access");
    }
  }

  private toActorContext(membership: TenantMembership): ActorContext {
    return {
      membershipId: membership.membershipId,
      tenantId: membership.tenantId,
      userId: membership.userId,
      email: membership.email,
      role: membership.role,
      allowedBranchIds: membership.allowedBranchIds,
      allowedSiteIds: membership.allowedSiteIds,
      globalAccess: membership.globalAccess
    };
  }

  private async ensureDefaults() {
    if (this.defaultsEnsured) {
      return;
    }

    await this.repository.ensureDefaults(defaultMemberships);
    this.defaultsEnsured = true;
  }
}
