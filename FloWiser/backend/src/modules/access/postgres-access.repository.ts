import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type {
  AuditLogRecord,
  MembershipCreateInput,
  MembershipUpdateInput,
  TenantMembership
} from "./access.types.js";

const mapMembership = (row: Record<string, unknown>): TenantMembership => ({
  membershipId: row.membership_id as string,
  tenantId: row.tenant_id as string,
  userId: row.user_id as string,
  email: row.email as string,
  role: row.role as TenantMembership["role"],
  allowedBranchIds: (row.allowed_branch_ids as string[]) ?? [],
  allowedSiteIds: (row.allowed_site_ids as string[]) ?? [],
  globalAccess: Boolean(row.global_access),
  isActive: Boolean(row.is_active),
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapAudit = (row: Record<string, unknown>): AuditLogRecord => ({
  auditId: row.audit_id as string,
  tenantId: row.tenant_id as string,
  userId: row.user_id as string,
  role: row.role as AuditLogRecord["role"],
  method: row.method as string,
  path: row.path as string,
  statusCode: Number(row.status_code),
  resourceType: row.resource_type as string,
  resourceId: (row.resource_id as string | null) ?? undefined,
  outcome: row.outcome as string,
  metadata: (row.metadata as Record<string, unknown>) ?? {},
  createdAt: row.created_at as string
});

export class PostgresAccessRepository {
  constructor(private readonly pool: Pool) {}

  async ensureDefaults(defaults: MembershipCreateInput[]) {
    for (const membership of defaults) {
      await this.pool.query(
        `
          INSERT INTO tenant_memberships (
            membership_id, tenant_id, user_id, email, role, allowed_branch_ids, allowed_site_ids,
            global_access, is_active, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb,
            $8, $9, NOW(), NOW()
          ) ON CONFLICT (tenant_id, user_id) DO NOTHING;
        `,
        [
          randomUUID(),
          membership.tenantId,
          membership.userId,
          membership.email,
          membership.role,
          JSON.stringify(membership.allowedBranchIds),
          JSON.stringify(membership.allowedSiteIds),
          membership.globalAccess,
          membership.isActive
        ]
      );
    }
  }

  async findMembership(tenantId: string, userId: string) {
    const result = await this.pool.query(
      "SELECT * FROM tenant_memberships WHERE tenant_id = $1 AND user_id = $2 AND is_active = TRUE LIMIT 1",
      [tenantId, userId]
    );
    return result.rowCount ? mapMembership(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async getMembership(membershipId: string) {
    const result = await this.pool.query(
      "SELECT * FROM tenant_memberships WHERE membership_id = $1 LIMIT 1",
      [membershipId]
    );
    return result.rowCount ? mapMembership(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async listMemberships(filters: { tenantId?: string; userId?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.tenantId) {
      values.push(filters.tenantId);
      conditions.push(`tenant_id = $${values.length}`);
    }
    if (filters.userId) {
      values.push(filters.userId);
      conditions.push(`user_id = $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM tenant_memberships ${whereClause} ORDER BY tenant_id, role DESC, email ASC LIMIT $${values.length}`,
      values
    );

    return result.rows.map((row) => mapMembership(row as Record<string, unknown>));
  }

  async createMembership(input: MembershipCreateInput) {
    const result = await this.pool.query(
      `
        INSERT INTO tenant_memberships (
          membership_id, tenant_id, user_id, email, role, allowed_branch_ids, allowed_site_ids,
          global_access, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb,
          $8, $9, NOW(), NOW()
        ) RETURNING *;
      `,
      [
        randomUUID(),
        input.tenantId,
        input.userId,
        input.email,
        input.role,
        JSON.stringify(input.allowedBranchIds),
        JSON.stringify(input.allowedSiteIds),
        input.globalAccess,
        input.isActive
      ]
    );
    return mapMembership(result.rows[0] as Record<string, unknown>);
  }

  async updateMembership(membershipId: string, patch: MembershipUpdateInput) {
    const current = await this.getMembership(membershipId);
    if (!current) {
      return undefined;
    }

    const next = {
      ...current,
      ...patch,
      allowedBranchIds: patch.allowedBranchIds ?? current.allowedBranchIds,
      allowedSiteIds: patch.allowedSiteIds ?? current.allowedSiteIds,
      globalAccess: patch.globalAccess ?? current.globalAccess,
      isActive: patch.isActive ?? current.isActive
    };

    const result = await this.pool.query(
      `
        UPDATE tenant_memberships
        SET email = $2,
            role = $3,
            allowed_branch_ids = $4::jsonb,
            allowed_site_ids = $5::jsonb,
            global_access = $6,
            is_active = $7,
            updated_at = NOW()
        WHERE membership_id = $1
        RETURNING *;
      `,
      [
        membershipId,
        next.email,
        next.role,
        JSON.stringify(next.allowedBranchIds),
        JSON.stringify(next.allowedSiteIds),
        next.globalAccess,
        next.isActive
      ]
    );

    return mapMembership(result.rows[0] as Record<string, unknown>);
  }

  async createAuditLog(input: Omit<AuditLogRecord, "auditId" | "createdAt">) {
    const result = await this.pool.query(
      `
        INSERT INTO audit_logs (
          audit_id, tenant_id, user_id, role, method, path, status_code, resource_type,
          resource_id, outcome, metadata, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11::jsonb, NOW()
        ) RETURNING *;
      `,
      [
        randomUUID(),
        input.tenantId,
        input.userId,
        input.role,
        input.method,
        input.path,
        input.statusCode,
        input.resourceType,
        input.resourceId ?? null,
        input.outcome,
        JSON.stringify(input.metadata)
      ]
    );
    return mapAudit(result.rows[0] as Record<string, unknown>);
  }

  async listAuditLogs(filters: { tenantId?: string; userId?: string; path?: string; method?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.tenantId) {
      values.push(filters.tenantId);
      conditions.push(`tenant_id = $${values.length}`);
    }
    if (filters.userId) {
      values.push(filters.userId);
      conditions.push(`user_id = $${values.length}`);
    }
    if (filters.path) {
      values.push(filters.path);
      conditions.push(`path = $${values.length}`);
    }
    if (filters.method) {
      values.push(filters.method);
      conditions.push(`method = $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${values.length}`,
      values
    );

    return result.rows.map((row) => mapAudit(row as Record<string, unknown>));
  }
}
