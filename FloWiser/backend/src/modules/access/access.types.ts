import { z } from "zod";

export const actorRoleSchema = z.enum(["viewer", "operator", "tenant_admin", "platform_admin"]);
export type ActorRole = z.infer<typeof actorRoleSchema>;

export const actorRoleOrder: ActorRole[] = ["viewer", "operator", "tenant_admin", "platform_admin"];

export const roleAllows = (actorRole: ActorRole, allowedRoles: ActorRole[]) =>
  allowedRoles.some((role) => actorRoleOrder.indexOf(actorRole) >= actorRoleOrder.indexOf(role));

export const membershipSchema = z.object({
  membershipId: z.string().uuid(),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  email: z.string().email(),
  role: actorRoleSchema,
  allowedBranchIds: z.array(z.string()).default([]),
  allowedSiteIds: z.array(z.string()).default([]),
  globalAccess: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional()
});
export type TenantMembership = z.infer<typeof membershipSchema>;

export const membershipCreateSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  email: z.string().email(),
  role: actorRoleSchema,
  allowedBranchIds: z.array(z.string()).default([]),
  allowedSiteIds: z.array(z.string()).default([]),
  globalAccess: z.boolean().default(false),
  isActive: z.boolean().default(true)
});
export type MembershipCreateInput = z.infer<typeof membershipCreateSchema>;

export const membershipUpdateSchema = z.object({
  email: z.string().email().optional(),
  role: actorRoleSchema.optional(),
  allowedBranchIds: z.array(z.string()).optional(),
  allowedSiteIds: z.array(z.string()).optional(),
  globalAccess: z.boolean().optional(),
  isActive: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one updatable field is required"
});
export type MembershipUpdateInput = z.infer<typeof membershipUpdateSchema>;

export type ActorContext = {
  membershipId: string;
  tenantId: string;
  userId: string;
  email: string;
  role: ActorRole;
  allowedBranchIds: string[];
  allowedSiteIds: string[];
  globalAccess: boolean;
};

export type AccessScope = {
  tenantId?: string;
  branchId?: string;
  siteId?: string;
};

export type AuditLogRecord = {
  auditId: string;
  tenantId: string;
  userId: string;
  role: ActorRole;
  method: string;
  path: string;
  statusCode: number;
  resourceType: string;
  resourceId?: string;
  outcome: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};
