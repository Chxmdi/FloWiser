import { z } from "zod";

export const measurementBasisSchema = z.enum([
  "manual_meter_read",
  "telemetry_rollup",
  "fuel_log",
  "site_survey"
]);
export type MeasurementBasis = z.infer<typeof measurementBasisSchema>;

export const fieldMeasurementInputSchema = z.object({
  actor: z.string().min(1),
  measurementBasis: measurementBasisSchema,
  baselineKwhPerDay: z.number().min(0).default(0),
  observedKwhPerDay: z.number().min(0).default(0),
  baselineDieselLitersPerDay: z.number().min(0).default(0),
  observedDieselLitersPerDay: z.number().min(0).default(0),
  energyTariff: z.number().min(0).default(0),
  dieselCostPerLiter: z.number().min(0).default(0),
  note: z.string().optional()
});
export type FieldMeasurementInput = z.infer<typeof fieldMeasurementInputSchema>;

export type FieldMeasurementRecord = {
  measurementId: string;
  actionId: string;
  executionId?: string;
  dispatchId?: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  deviceId?: string;
  measurementBasis: MeasurementBasis;
  baselineKwhPerDay: number;
  observedKwhPerDay: number;
  baselineDieselLitersPerDay: number;
  observedDieselLitersPerDay: number;
  energyTariff: number;
  dieselCostPerLiter: number;
  measuredBy: string;
  note?: string;
  measuredAt: string;
  createdAt: string;
  updatedAt: string;
};
