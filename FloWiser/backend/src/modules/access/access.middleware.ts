import type { NextFunction, Request, Response } from "express";
import type { AccessAuditService } from "./access-audit.service.js";
import type { AccessAuthorizationService } from "./access-authorization.service.js";
import type { AccessScope, ActorContext, ActorRole } from "./access.types.js";
import { roleAllows } from "./access.types.js";

const getValue = (container: unknown, keys: string[]) => {
  if (!container || typeof container !== "object") {
    return undefined;
  }

  const record = container as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return undefined;
};

const extractScope = (request: Request): AccessScope => ({
  tenantId:
    getValue(request.params, ["tenantId", "tenant_id"]) ??
    getValue(request.query, ["tenantId", "tenant_id"]) ??
    getValue(request.body, ["tenantId", "tenant_id"]),
  branchId:
    getValue(request.params, ["branchId", "branch_id"]) ??
    getValue(request.query, ["branchId", "branch_id"]) ??
    getValue(request.body, ["branchId", "branch_id"]),
  siteId:
    getValue(request.params, ["siteId", "site_id"]) ??
    getValue(request.query, ["siteId", "site_id"]) ??
    getValue(request.body, ["siteId", "site_id"])
});

const resourceTypeForPath = (path: string) => path.split("/").filter(Boolean)[0] ?? "root";
const resourceIdForRequest = (request: Request) =>
  getValue(request.params, [
    "branchId",
    "siteId",
    "ruleId",
    "actionId",
    "executionId",
    "dispatchId",
    "alertId",
    "issueId",
    "policyId",
    "membershipId",
    "deviceId",
    "rawEventId",
    "templateId"
  ]);

export const getActorContext = (response: Response) => (response.locals.actorContext as ActorContext | undefined);

export const createProtectedRouteMiddleware = (
  accessAuthorizationService: AccessAuthorizationService | undefined,
  allowedRoles: ActorRole[]
) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    if (!accessAuthorizationService) {
      return response.status(501).json({ error: "Access control is unavailable until DATABASE_URL is configured." });
    }

    const tenantId = request.header("x-tenant-id");
    const userId = request.header("x-user-id");

    if (!tenantId || !userId) {
      return response.status(401).json({
        error: "Missing actor headers. Provide x-tenant-id and x-user-id."
      });
    }

    const actor = await accessAuthorizationService.resolveActorContext(tenantId, userId);

    if (!actor) {
      return response.status(403).json({
        error: `No active membership found for user ${userId} in tenant ${tenantId}`
      });
    }

    const authorization = accessAuthorizationService.authorize(actor, allowedRoles, extractScope(request));

    if (!authorization.allowed) {
      return response.status(403).json({
        error: authorization.reason
      });
    }

    response.locals.actorContext = actor;
    return next();
  };
};

export const requireActorRoles = (allowedRoles: ActorRole[]) => {
  return (request: Request, response: Response, next: NextFunction) => {
    const actor = getActorContext(response);
    if (!actor) {
      return response.status(401).json({ error: "Missing actor context" });
    }

    if (!roleAllows(actor.role, allowedRoles)) {
      return response.status(403).json({ error: `Role ${actor.role} is insufficient for this route` });
    }

    return next();
  };
};

export const createAuditLoggingMiddleware = (accessAuditService: AccessAuditService | undefined) => {
  return (request: Request, response: Response, next: NextFunction) => {
    response.on("finish", () => {
      const actor = getActorContext(response);
      if (!accessAuditService || !actor) {
        return;
      }

      void accessAuditService.record(actor, {
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        resourceType: resourceTypeForPath(request.path),
        resourceId: resourceIdForRequest(request),
        outcome: response.statusCode >= 400 ? "error" : "success",
        metadata: {
          params: request.params,
          query: request.query
        }
      }).catch(() => undefined);
    });

    return next();
  };
};
