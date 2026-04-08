import { Router } from "express";
import { membershipCreateSchema, membershipUpdateSchema } from "../modules/access/access.types.js";
import { getActorContext, requireActorRoles } from "../modules/access/access.middleware.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const accessRouter = Router();

accessRouter.get("/me", (request, response) => {
  const actor = getActorContext(response);
  return response.status(200).json({ actor });
});

accessRouter.get("/memberships", requireActorRoles(["tenant_admin", "platform_admin"]), async (request, response) => {
  if (!platformServices.accessAuthorizationService) {
    return response.status(501).json({ error: "Access control is unavailable until DATABASE_URL is configured." });
  }

  const actor = getActorContext(response);
  const memberships = await platformServices.accessAuthorizationService.listMemberships(actor!, {
    tenantId: request.query.tenantId as string | undefined,
    userId: request.query.userId as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ memberships });
});

accessRouter.post("/memberships", requireActorRoles(["tenant_admin", "platform_admin"]), async (request, response) => {
  const parsed = membershipCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid membership payload", details: parsed.error.flatten() });
  }

  if (!platformServices.accessAuthorizationService) {
    return response.status(501).json({ error: "Access control is unavailable until DATABASE_URL is configured." });
  }

  try {
    const membership = await platformServices.accessAuthorizationService.createMembership(getActorContext(response)!, parsed.data);
    return response.status(201).json(membership);
  } catch (error) {
    return response.status(409).json({
      error: error instanceof Error ? error.message : "Membership could not be created"
    });
  }
});

accessRouter.patch("/memberships/:membershipId", requireActorRoles(["tenant_admin", "platform_admin"]), async (request, response) => {
  const parsed = membershipUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid membership update payload", details: parsed.error.flatten() });
  }

  if (!platformServices.accessAuthorizationService) {
    return response.status(501).json({ error: "Access control is unavailable until DATABASE_URL is configured." });
  }

  try {
    const membership = await platformServices.accessAuthorizationService.updateMembership(
      getActorContext(response)!,
      request.params.membershipId,
      parsed.data
    );

    if (!membership) {
      return response.status(404).json({ error: `Membership ${request.params.membershipId} was not found` });
    }

    return response.status(200).json(membership);
  } catch (error) {
    return response.status(409).json({
      error: error instanceof Error ? error.message : "Membership could not be updated"
    });
  }
});

accessRouter.get("/audit-logs", requireActorRoles(["tenant_admin", "platform_admin"]), async (request, response) => {
  if (!platformServices.accessAuditService) {
    return response.status(501).json({ error: "Access audit is unavailable until DATABASE_URL is configured." });
  }

  const logs = await platformServices.accessAuditService.listLogs(getActorContext(response)!, {
    tenantId: request.query.tenantId as string | undefined,
    userId: request.query.userId as string | undefined,
    path: request.query.path as string | undefined,
    method: request.query.method as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ logs });
});
