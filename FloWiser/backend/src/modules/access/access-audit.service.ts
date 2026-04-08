import type { ActorContext } from "./access.types.js";
import { PostgresAccessRepository } from "./postgres-access.repository.js";

export class AccessAuditService {
  constructor(private readonly repository: PostgresAccessRepository) {}

  async record(actor: ActorContext, input: {
    method: string;
    path: string;
    statusCode: number;
    resourceType: string;
    resourceId?: string;
    outcome: string;
    metadata: Record<string, unknown>;
  }) {
    return this.repository.createAuditLog({
      tenantId: actor.tenantId,
      userId: actor.userId,
      role: actor.role,
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      outcome: input.outcome,
      metadata: input.metadata
    });
  }

  async listLogs(actor: ActorContext, filters: { tenantId?: string; userId?: string; path?: string; method?: string; limit?: number }) {
    return this.repository.listAuditLogs({
      ...filters,
      tenantId: actor.role === "platform_admin" ? filters.tenantId : actor.tenantId
    });
  }
}
