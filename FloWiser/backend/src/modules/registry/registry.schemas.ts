import { z } from "zod";

const optionalString = z.string().trim().min(1).optional();
const isoDateTime = z.string().datetime({ offset: true }).optional();

export const tenantCreateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1),
  code: optionalString,
  country: optionalString,
  timezone: optionalString
});

export const branchCreateSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  name: z.string().trim().min(1),
  region: optionalString,
  branchType: optionalString
});

export const siteCreateSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  branchId: z.string().uuid(),
  name: z.string().trim().min(1),
  siteType: optionalString,
  location: optionalString,
  timezone: optionalString,
  criticality: optionalString
});

export const assetCreateSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  branchId: z.string().uuid(),
  siteId: z.string().uuid(),
  name: z.string().trim().min(1),
  assetCategory: z.enum(["meter", "generator", "hvac", "panel", "feeder", "battery", "inverter", "other"]),
  metadata: z.record(z.string(), z.string()).default({})
});

export const deviceCreateSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  branchId: z.string().uuid(),
  siteId: z.string().uuid(),
  name: z.string().trim().min(1),
  deviceType: z.enum(["meter", "gateway", "sensor", "controller", "other"]),
  vendor: optionalString,
  model: optionalString,
  firmwareVersion: optionalString,
  connectivityProtocol: optionalString,
  lifecycleState: z.enum(["provisioned", "commissioning", "active", "retired"]).default("provisioned")
});

export const bindingCreateSchema = z.object({
  deviceId: z.string().uuid(),
  assetId: z.string().uuid(),
  effectiveFrom: isoDateTime,
  notes: optionalString
});

export const bindingRemapSchema = z.object({
  assetId: z.string().uuid(),
  effectiveFrom: isoDateTime,
  notes: optionalString
});

export const bindingUnbindSchema = z.object({
  endedAt: isoDateTime,
  notes: optionalString
});

export const registryImportSchema = z.object({
  tenants: z.array(tenantCreateSchema).default([]),
  branches: z.array(branchCreateSchema).default([]),
  sites: z.array(siteCreateSchema).default([]),
  assets: z.array(assetCreateSchema).default([]),
  devices: z.array(deviceCreateSchema).default([])
});

export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
export type BranchCreateInput = z.infer<typeof branchCreateSchema>;
export type SiteCreateInput = z.infer<typeof siteCreateSchema>;
export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
export type DeviceCreateInput = z.infer<typeof deviceCreateSchema>;
export type BindingCreateInput = z.infer<typeof bindingCreateSchema>;
export type BindingRemapInput = z.infer<typeof bindingRemapSchema>;
export type BindingUnbindInput = z.infer<typeof bindingUnbindSchema>;
export type RegistryImportInput = z.infer<typeof registryImportSchema>;
