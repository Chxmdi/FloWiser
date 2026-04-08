import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { FieldMeasurementRecord } from "./field-verification.types.js";

const toNumber = (value: unknown) => Number(value ?? 0);

const mapMeasurement = (row: Record<string, unknown>): FieldMeasurementRecord => ({
  measurementId: row.measurement_id as string,
  actionId: row.action_id as string,
  executionId: (row.execution_id as string | null) ?? undefined,
  dispatchId: (row.dispatch_id as string | null) ?? undefined,
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  deviceId: (row.device_id as string | null) ?? undefined,
  measurementBasis: row.measurement_basis as FieldMeasurementRecord["measurementBasis"],
  baselineKwhPerDay: toNumber(row.baseline_kwh_per_day),
  observedKwhPerDay: toNumber(row.observed_kwh_per_day),
  baselineDieselLitersPerDay: toNumber(row.baseline_diesel_liters_per_day),
  observedDieselLitersPerDay: toNumber(row.observed_diesel_liters_per_day),
  energyTariff: toNumber(row.energy_tariff),
  dieselCostPerLiter: toNumber(row.diesel_cost_per_liter),
  measuredBy: row.measured_by as string,
  note: (row.note as string | null) ?? undefined,
  measuredAt: row.measured_at as string,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

export class PostgresFieldVerificationRepository {
  constructor(private readonly pool: Pool) {}

  async createMeasurement(input: Omit<FieldMeasurementRecord, "measurementId" | "createdAt" | "updatedAt">) {
    const result = await this.pool.query(
      `
        INSERT INTO field_verification_measurements (
          measurement_id, action_id, execution_id, dispatch_id, tenant_id, branch_id, site_id, device_id,
          measurement_basis, baseline_kwh_per_day, observed_kwh_per_day, baseline_diesel_liters_per_day,
          observed_diesel_liters_per_day, energy_tariff, diesel_cost_per_liter, measured_by, note, measured_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, NOW(), NOW()
        ) RETURNING *;
      `,
      [
        randomUUID(),
        input.actionId,
        input.executionId ?? null,
        input.dispatchId ?? null,
        input.tenantId,
        input.branchId,
        input.siteId,
        input.deviceId ?? null,
        input.measurementBasis,
        input.baselineKwhPerDay,
        input.observedKwhPerDay,
        input.baselineDieselLitersPerDay,
        input.observedDieselLitersPerDay,
        input.energyTariff,
        input.dieselCostPerLiter,
        input.measuredBy,
        input.note ?? null,
        input.measuredAt
      ]
    );
    return mapMeasurement(result.rows[0] as Record<string, unknown>);
  }

  async listMeasurements(filters: { siteId?: string; actionId?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (filters.siteId) {
      values.push(filters.siteId);
      conditions.push(`site_id = $${values.length}`);
    }
    if (filters.actionId) {
      values.push(filters.actionId);
      conditions.push(`action_id = $${values.length}`);
    }
    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM field_verification_measurements ${whereClause} ORDER BY measured_at DESC LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => mapMeasurement(row as Record<string, unknown>));
  }

  async getRecommendationMeasurements(actionId: string) {
    const result = await this.pool.query(
      `SELECT * FROM field_verification_measurements WHERE action_id = $1 ORDER BY measured_at DESC`,
      [actionId]
    );
    return result.rows.map((row) => mapMeasurement(row as Record<string, unknown>));
  }

  async getLatestMeasurement(actionId: string) {
    const result = await this.pool.query(
      `SELECT * FROM field_verification_measurements WHERE action_id = $1 ORDER BY measured_at DESC LIMIT 1`,
      [actionId]
    );
    return result.rowCount ? mapMeasurement(result.rows[0] as Record<string, unknown>) : undefined;
  }
}
