import { PostgresReportingRepository } from "./postgres-reporting.repository.js";
import type { VerificationRequestInput, VerificationSnapshotRecord } from "./reporting.types.js";
import type { FieldVerificationService } from "../field-verification/field-verification.service.js";

const safeDivide = (numerator: number, denominator: number) => (denominator > 0 ? numerator / denominator : 0);

const getDispatchBaseFactor = (dispatchChannel?: string) => {
  switch (dispatchChannel) {
    case "simulated_gateway":
      return 0.85;
    case "manual_playbook":
      return 0.65;
    case "simulator":
      return 0.55;
    default:
      return 0.4;
  }
};

const getExecutionFactor = (executionStatus?: string) => {
  switch (executionStatus) {
    case "executed":
      return 1;
    case "ready":
      return 0.6;
    case "pending_approval":
      return 0.3;
    case "dry_run_evaluated":
      return 0.2;
    case "failed":
    case "blocked":
      return 0;
    default:
      return 0;
  }
};

const getDispatchFactor = (dispatchStatus?: string) => {
  switch (dispatchStatus) {
    case "succeeded":
      return 1;
    case "simulated":
      return 0.55;
    case "planned":
      return 0.25;
    case "sent":
      return 0.45;
    case "failed":
    case "blocked":
      return 0;
    default:
      return 0;
  }
};

const ageHours = (timestamp: string) => Math.max(0, (Date.now() - Date.parse(timestamp)) / (1000 * 60 * 60));

export class ReportingService {
  constructor(
    private readonly repository: PostgresReportingRepository,
    private readonly fieldVerificationService?: FieldVerificationService
  ) {}

  async verifyRecommendation(actionId: string, input: VerificationRequestInput) {
    const context = await this.repository.getRecommendationVerificationContext(actionId);
    if (!context) {
      return undefined;
    }

    const latestMeasurement = await this.fieldVerificationService?.getLatestMeasurement(actionId);

    let verificationStatus: VerificationSnapshotRecord["verificationStatus"] = "unverified";
    let verificationBasis = "no_execution";
    let realizationRate = 0;
    let realizedMonthlySavings = 0;
    let realizedDieselSavings = 0;
    let implementationCostProxy = Math.max(50000, context.effortScore * 15000);

    if (latestMeasurement) {
      const energyDelta = Math.max(0, latestMeasurement.baselineKwhPerDay - latestMeasurement.observedKwhPerDay);
      const dieselDelta = Math.max(0, latestMeasurement.baselineDieselLitersPerDay - latestMeasurement.observedDieselLitersPerDay);
      realizedMonthlySavings = Number((energyDelta * 30 * latestMeasurement.energyTariff).toFixed(2));
      realizedDieselSavings = Number((dieselDelta * 30 * latestMeasurement.dieselCostPerLiter).toFixed(2));
      realizationRate = Number(
        Math.min(1, safeDivide(realizedMonthlySavings, Math.max(context.expectedMonthlySavings, 1))).toFixed(4)
      );
      verificationBasis = `field_measurement_${latestMeasurement.measurementBasis}`;
      implementationCostProxy = Math.max(implementationCostProxy, Number((context.effortScore * 12000).toFixed(2)));

      if (realizationRate >= 0.65 || realizedDieselSavings >= context.expectedDieselSavings * 0.65) {
        verificationStatus = "realized";
      } else if (realizationRate > 0 || realizedDieselSavings > 0) {
        verificationStatus = "partially_realized";
      } else {
        verificationStatus = "not_realized";
      }
    } else if (!context.executionId) {
      verificationStatus = "unverified";
      verificationBasis = "no_execution";
    } else if (context.executionStatus === "failed" || context.dispatchStatus === "failed" || context.dispatchStatus === "blocked") {
      verificationStatus = "not_realized";
      verificationBasis = context.dispatchStatus ? `dispatch_${context.dispatchStatus}` : `execution_${context.executionStatus}`;
      realizationRate = 0;
    } else {
      const confidenceFactor = context.confidenceScore / 100;
      const channelFactor = getDispatchBaseFactor(context.dispatchChannel);
      const maturityFactor = Math.max(getExecutionFactor(context.executionStatus), getDispatchFactor(context.dispatchStatus));
      realizationRate = Number((channelFactor * confidenceFactor * maturityFactor).toFixed(4));

      if (realizationRate >= 0.65) {
        verificationStatus = "realized";
      } else if (realizationRate > 0) {
        verificationStatus = "partially_realized";
      } else {
        verificationStatus = "not_realized";
      }

      if (context.dispatchStatus === "succeeded") {
        verificationBasis = context.dispatchChannel ? `${context.dispatchChannel}_dispatch_succeeded` : "dispatch_succeeded";
      } else if (context.dispatchStatus) {
        verificationBasis = `dispatch_${context.dispatchStatus}`;
      } else {
        verificationBasis = `execution_${context.executionStatus ?? "unknown"}`;
      }

      if (context.recommendationStatus === "resolved" && realizationRate > 0 && verificationStatus === "partially_realized") {
        realizationRate = Number(Math.min(1, realizationRate + 0.1).toFixed(4));
        if (realizationRate >= 0.65) {
          verificationStatus = "realized";
        }
      }

      const agingPenalty = Math.max(0.75, 1 - ageHours(context.lastSeenAt) / 1000);
      realizationRate = Number((realizationRate * agingPenalty).toFixed(4));
      realizedMonthlySavings = Number((context.expectedMonthlySavings * realizationRate).toFixed(2));
      realizedDieselSavings = Number((context.expectedDieselSavings * realizationRate).toFixed(2));
    }

    const roiScore = Number((safeDivide(realizedMonthlySavings, implementationCostProxy) * 100).toFixed(2));
    const paybackMonths = realizedMonthlySavings > 0
      ? Number((implementationCostProxy / realizedMonthlySavings).toFixed(2))
      : undefined;

    const snapshot = await this.repository.createVerificationSnapshot({
      actionId: context.actionId,
      executionId: context.executionId,
      dispatchId: context.dispatchId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      siteId: context.siteId,
      deviceId: context.deviceId,
      verificationStatus,
      verificationBasis,
      expectedMonthlySavings: context.expectedMonthlySavings,
      expectedDieselSavings: context.expectedDieselSavings,
      realizedMonthlySavings,
      realizedDieselSavings,
      realizationRate,
      implementationCostProxy,
      roiScore,
      paybackMonths,
      verificationNote: input.note,
      verifiedBy: input.actor,
      measuredAt: new Date().toISOString()
    });

    return {
      context,
      fieldMeasurement: latestMeasurement,
      snapshot
    };
  }

  async listVerifications(filters: { siteId?: string; actionId?: string; verificationStatus?: string; limit?: number }) {
    return this.repository.listVerificationSnapshots(filters);
  }

  async getRecommendationVerification(actionId: string) {
    return this.repository.getRecommendationVerification(actionId);
  }

  async getOverview() {
    return this.repository.getOverview();
  }

  async getExecutiveReport() {
    return this.repository.getExecutiveReport();
  }

  async getSiteReport(siteId: string) {
    return this.repository.getSiteReport(siteId);
  }
}
