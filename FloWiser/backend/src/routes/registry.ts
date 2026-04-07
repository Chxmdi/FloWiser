import { Router } from "express";
import {
  assetCreateSchema,
  bindingCreateSchema,
  bindingRemapSchema,
  bindingUnbindSchema,
  branchCreateSchema,
  deviceCreateSchema,
  registryImportSchema,
  siteCreateSchema,
  tenantCreateSchema
} from "../modules/registry/registry.schemas.js";
import { RegistryError } from "../modules/registry/errors.js";
import { platformServices } from "../modules/platform/platform-services.js";

const parseBoolean = (value: unknown) => value === "true" || value === true;

export const registryRouter = Router();

registryRouter.get("/snapshot", (_request, response) => {
  response.status(200).json(platformServices.registryService.snapshot());
});

registryRouter.get("/tenants", (_request, response) => {
  response.status(200).json({ tenants: platformServices.registryService.listTenants() });
});

registryRouter.post("/tenants", (request, response) => {
  const parsed = tenantCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid tenant payload", details: parsed.error.flatten() });
  }

  try {
    return response.status(201).json(platformServices.registryService.createTenant(parsed.data));
  } catch (error) {
    if (error instanceof RegistryError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    return response.status(500).json({ error: error instanceof Error ? error.message : "Unknown registry error" });
  }
});

registryRouter.get("/branches", (request, response) => {
  response.status(200).json({
    branches: platformServices.registryService.listBranches({ tenantId: request.query.tenantId as string | undefined })
  });
});

registryRouter.post("/branches", (request, response) => {
  const parsed = branchCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid branch payload", details: parsed.error.flatten() });
  }

  try {
    return response.status(201).json(platformServices.registryService.createBranch(parsed.data));
  } catch (error) {
    if (error instanceof RegistryError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    return response.status(500).json({ error: error instanceof Error ? error.message : "Unknown registry error" });
  }
});

registryRouter.get("/sites", (request, response) => {
  response.status(200).json({
    sites: platformServices.registryService.listSites({
      tenantId: request.query.tenantId as string | undefined,
      branchId: request.query.branchId as string | undefined
    })
  });
});

registryRouter.post("/sites", (request, response) => {
  const parsed = siteCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid site payload", details: parsed.error.flatten() });
  }

  try {
    return response.status(201).json(platformServices.registryService.createSite(parsed.data));
  } catch (error) {
    if (error instanceof RegistryError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    return response.status(500).json({ error: error instanceof Error ? error.message : "Unknown registry error" });
  }
});

registryRouter.get("/assets", (request, response) => {
  response.status(200).json({
    assets: platformServices.registryService.listAssets({
      tenantId: request.query.tenantId as string | undefined,
      branchId: request.query.branchId as string | undefined,
      siteId: request.query.siteId as string | undefined
    })
  });
});

registryRouter.post("/assets", (request, response) => {
  const parsed = assetCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid asset payload", details: parsed.error.flatten() });
  }

  try {
    return response.status(201).json(platformServices.registryService.createAsset(parsed.data));
  } catch (error) {
    if (error instanceof RegistryError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    return response.status(500).json({ error: error instanceof Error ? error.message : "Unknown registry error" });
  }
});

registryRouter.get("/devices", (request, response) => {
  response.status(200).json({
    devices: platformServices.registryService.listDevices({
      tenantId: request.query.tenantId as string | undefined,
      branchId: request.query.branchId as string | undefined,
      siteId: request.query.siteId as string | undefined
    })
  });
});

registryRouter.post("/devices", (request, response) => {
  const parsed = deviceCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid device payload", details: parsed.error.flatten() });
  }

  try {
    return response.status(201).json(platformServices.registryService.createDevice(parsed.data));
  } catch (error) {
    if (error instanceof RegistryError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    return response.status(500).json({ error: error instanceof Error ? error.message : "Unknown registry error" });
  }
});

registryRouter.get("/device-bindings", (request, response) => {
  response.status(200).json({
    bindings: platformServices.registryService.listBindings({
      tenantId: request.query.tenantId as string | undefined,
      branchId: request.query.branchId as string | undefined,
      siteId: request.query.siteId as string | undefined,
      deviceId: request.query.deviceId as string | undefined,
      activeOnly: parseBoolean(request.query.activeOnly)
    })
  });
});

registryRouter.post("/device-bindings", (request, response) => {
  const parsed = bindingCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid device binding payload", details: parsed.error.flatten() });
  }

  try {
    return response.status(201).json(platformServices.registryService.bindDeviceToAsset(parsed.data));
  } catch (error) {
    if (error instanceof RegistryError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    return response.status(500).json({ error: error instanceof Error ? error.message : "Unknown registry error" });
  }
});

registryRouter.post("/device-bindings/:bindingId/remap", (request, response) => {
  const parsed = bindingRemapSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid binding remap payload", details: parsed.error.flatten() });
  }

  try {
    return response.status(200).json(platformServices.registryService.remapBinding(request.params.bindingId, parsed.data));
  } catch (error) {
    if (error instanceof RegistryError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    return response.status(500).json({ error: error instanceof Error ? error.message : "Unknown registry error" });
  }
});

registryRouter.post("/device-bindings/:bindingId/unbind", (request, response) => {
  const parsed = bindingUnbindSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid binding unbind payload", details: parsed.error.flatten() });
  }

  try {
    return response.status(200).json(platformServices.registryService.unbindBinding(request.params.bindingId, parsed.data));
  } catch (error) {
    if (error instanceof RegistryError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    return response.status(500).json({ error: error instanceof Error ? error.message : "Unknown registry error" });
  }
});

registryRouter.post("/import/hierarchy", (request, response) => {
  const parsed = registryImportSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid hierarchy import payload", details: parsed.error.flatten() });
  }

  try {
    return response.status(201).json(platformServices.registryService.importHierarchy(parsed.data));
  } catch (error) {
    if (error instanceof RegistryError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    return response.status(500).json({ error: error instanceof Error ? error.message : "Unknown registry error" });
  }
});
