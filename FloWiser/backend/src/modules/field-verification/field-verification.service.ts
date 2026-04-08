import type { RecommendationEngineService } from "../recommendations/recommendation-engine.service.js";
import type { FieldMeasurementInput } from "./field-verification.types.js";
import { PostgresFieldVerificationRepository } from "./postgres-field-verification.repository.js";

export class FieldVerificationService {
  constructor(
    private readonly repository: PostgresFieldVerificationRepository,
    private readonly recommendationEngineService: RecommendationEngineService
  ) {}

  async createMeasurement(actionId: string, input: FieldMeasurementInput) {
    const recommendation = await this.recommendationEngineService.getRecommendation(actionId);
    if (!recommendation) {
      return undefined;
    }

    return this.repository.createMeasurement({
      actionId: recommendation.actionId,
      executionId: undefined,
      dispatchId: undefined,
      tenantId: recommendation.tenantId,
      branchId: recommendation.branchId,
      siteId: recommendation.siteId,
      deviceId: recommendation.deviceId,
      measurementBasis: input.measurementBasis,
      baselineKwhPerDay: input.baselineKwhPerDay,
      observedKwhPerDay: input.observedKwhPerDay,
      baselineDieselLitersPerDay: input.baselineDieselLitersPerDay,
      observedDieselLitersPerDay: input.observedDieselLitersPerDay,
      energyTariff: input.energyTariff,
      dieselCostPerLiter: input.dieselCostPerLiter,
      measuredBy: input.actor,
      note: input.note,
      measuredAt: new Date().toISOString()
    });
  }

  async listMeasurements(filters: { siteId?: string; actionId?: string; limit?: number }) {
    return this.repository.listMeasurements(filters);
  }

  async getRecommendationMeasurements(actionId: string) {
    const recommendation = await this.recommendationEngineService.getRecommendation(actionId);
    if (!recommendation) {
      return undefined;
    }

    const measurements = await this.repository.getRecommendationMeasurements(actionId);
    return {
      recommendation,
      measurements
    };
  }

  async getLatestMeasurement(actionId: string) {
    return this.repository.getLatestMeasurement(actionId);
  }
}
