import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { RuleExecutionTrace } from "../rules/rule.types.js";
import type { RootCauseClassification } from "./recommendation.types.js";

const numberFromEvidence = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export class RootCauseService {
  classify(trace: RuleExecutionTrace, event: CanonicalTelemetryEvent): RootCauseClassification {
    switch (trace.ruleId) {
      case "after_hours_baseload_waste": {
        const kw = numberFromEvidence(trace.evidence.kw, event.metrics.kw ?? 0);
        return {
          rootCauseKey: "always_on_loads_after_hours",
          rootCauseLabel: "Always-on loads after hours",
          likelyCause: "Non-critical loads are still energized during closed hours.",
          actionType: "schedule_adjustment",
          recommendationMode: "approval_required",
          automationPossible: true,
          effortScore: 18,
          confidenceScore: 86,
          savingsScore: 72,
          dieselScore: 20,
          uptimeImpactScore: 25,
          failureRiskScore: 20,
          expectedMonthlySavings: Math.round(kw * 22 * 8),
          expectedDieselSavings: 0,
          title: "Cut after-hours baseload",
          summary: `Reduce overnight load at ${event.siteId}; ${kw} kW is persisting after hours.`,
          evidence: trace.evidence
        };
      }
      case "schedule_misalignment": {
        const kw = numberFromEvidence(trace.evidence.kw, event.metrics.kw ?? 0);
        return {
          rootCauseKey: "schedule_configuration_drift",
          rootCauseLabel: "Schedule configuration drift",
          likelyCause: "Equipment start and stop times are misaligned with expected site hours.",
          actionType: "schedule_tuning",
          recommendationMode: "approval_required",
          automationPossible: true,
          effortScore: 22,
          confidenceScore: 82,
          savingsScore: 68,
          dieselScore: 24,
          uptimeImpactScore: 30,
          failureRiskScore: 22,
          expectedMonthlySavings: Math.round(kw * 18 * 6),
          expectedDieselSavings: 0,
          title: "Retune operating schedule",
          summary: `Load pattern suggests ${event.siteId} is running equipment outside expected hours.`,
          evidence: trace.evidence
        };
      }
      case "avoidable_peak_event": {
        const kw = numberFromEvidence(trace.evidence.kw, event.metrics.kw ?? 0);
        return {
          rootCauseKey: "coincident_load_peak",
          rootCauseLabel: "Coincident load peak",
          likelyCause: "Multiple heavy loads appear to be starting or overlapping together.",
          actionType: "load_staggering",
          recommendationMode: "approval_required",
          automationPossible: false,
          effortScore: 32,
          confidenceScore: 78,
          savingsScore: 88,
          dieselScore: 30,
          uptimeImpactScore: 38,
          failureRiskScore: 28,
          expectedMonthlySavings: Math.round(kw * 25),
          expectedDieselSavings: 35,
          title: "Stagger peak loads",
          summary: `Investigate coincident heavy loads at ${event.siteId} to reduce avoidable peaks.`,
          evidence: trace.evidence
        };
      }
      case "generator_inefficient_runtime": {
        return {
          rootCauseKey: "generator_dispatch_policy_inefficiency",
          rootCauseLabel: "Generator dispatch policy inefficiency",
          likelyCause: "Generator remains on while grid appears stable or available.",
          actionType: "dispatch_policy_review",
          recommendationMode: "approval_required",
          automationPossible: false,
          effortScore: 28,
          confidenceScore: 84,
          savingsScore: 60,
          dieselScore: 84,
          uptimeImpactScore: 35,
          failureRiskScore: 24,
          expectedMonthlySavings: 180,
          expectedDieselSavings: 120,
          title: "Review generator dispatch logic",
          summary: `Generator runtime at ${event.siteId} appears unnecessary while grid is available.`,
          evidence: trace.evidence
        };
      }
      case "low_load_generator": {
        return {
          rootCauseKey: "inefficient_generator_loading",
          rootCauseLabel: "Inefficient generator loading",
          likelyCause: "Generator is supporting a very small load and may be wasting fuel.",
          actionType: "generator_runtime_tuning",
          recommendationMode: "advisory",
          automationPossible: false,
          effortScore: 20,
          confidenceScore: 80,
          savingsScore: 52,
          dieselScore: 76,
          uptimeImpactScore: 22,
          failureRiskScore: 18,
          expectedMonthlySavings: 90,
          expectedDieselSavings: 95,
          title: "Reduce low-load generator use",
          summary: `Generator is running at low site load on ${event.siteId}; tune runtime or consolidate loads.`,
          evidence: trace.evidence
        };
      }
      case "excessive_start_stop_cycling": {
        return {
          rootCauseKey: "generator_control_instability",
          rootCauseLabel: "Generator control instability",
          likelyCause: "Generator switching logic or site power conditions are causing repeated starts.",
          actionType: "control_logic_review",
          recommendationMode: "approval_required",
          automationPossible: false,
          effortScore: 36,
          confidenceScore: 79,
          savingsScore: 35,
          dieselScore: 42,
          uptimeImpactScore: 55,
          failureRiskScore: 72,
          expectedMonthlySavings: 60,
          expectedDieselSavings: 40,
          title: "Stabilize generator start-stop behavior",
          summary: `Repeated generator starts may be increasing wear and reliability risk at ${event.siteId}.`,
          evidence: trace.evidence
        };
      }
      case "voltage_current_anomaly": {
        return {
          rootCauseKey: "electrical_quality_or_sensor_issue",
          rootCauseLabel: "Electrical quality or sensor issue",
          likelyCause: "Voltage/current anomalies suggest electrical instability or sensor wiring problems.",
          actionType: "electrical_inspection",
          recommendationMode: "advisory",
          automationPossible: false,
          effortScore: 30,
          confidenceScore: 74,
          savingsScore: 20,
          dieselScore: 10,
          uptimeImpactScore: 44,
          failureRiskScore: 70,
          expectedMonthlySavings: 25,
          expectedDieselSavings: 0,
          title: "Inspect electrical quality issue",
          summary: `Voltage/current anomalies at ${event.siteId} should be inspected before they escalate.`,
          evidence: trace.evidence
        };
      }
      case "telemetry_gap": {
        return {
          rootCauseKey: "connectivity_or_reporting_gap",
          rootCauseLabel: "Connectivity or reporting gap",
          likelyCause: "The device or gateway stopped reporting for longer than expected.",
          actionType: "connectivity_check",
          recommendationMode: "advisory",
          automationPossible: false,
          effortScore: 16,
          confidenceScore: 90,
          savingsScore: 8,
          dieselScore: 0,
          uptimeImpactScore: 26,
          failureRiskScore: 16,
          expectedMonthlySavings: 0,
          expectedDieselSavings: 0,
          title: "Restore telemetry continuity",
          summary: `Telemetry gap detected for ${event.deviceId}; inspect connectivity and device health.`,
          evidence: trace.evidence
        };
      }
      case "abnormal_runtime_drift": {
        return {
          rootCauseKey: "equipment_performance_drift",
          rootCauseLabel: "Equipment performance drift",
          likelyCause: "The device or asset behavior is drifting away from its recent runtime profile.",
          actionType: "maintenance_investigation",
          recommendationMode: "advisory",
          automationPossible: false,
          effortScore: 34,
          confidenceScore: 72,
          savingsScore: 26,
          dieselScore: 12,
          uptimeImpactScore: 38,
          failureRiskScore: 58,
          expectedMonthlySavings: 40,
          expectedDieselSavings: 15,
          title: "Investigate abnormal runtime drift",
          summary: `Load behavior changed sharply while runtime continued at ${event.siteId}.`,
          evidence: trace.evidence
        };
      }
      default:
        return {
          rootCauseKey: `unclassified_${trace.ruleId}`,
          rootCauseLabel: "Unclassified operational issue",
          likelyCause: "A rule matched, but no specific root-cause mapping has been defined yet.",
          actionType: "operator_review",
          recommendationMode: "advisory",
          automationPossible: false,
          effortScore: 25,
          confidenceScore: 60,
          savingsScore: 10,
          dieselScore: 10,
          uptimeImpactScore: 20,
          failureRiskScore: 20,
          expectedMonthlySavings: 0,
          expectedDieselSavings: 0,
          title: trace.title,
          summary: trace.summary,
          evidence: trace.evidence
        };
    }
  }
}
