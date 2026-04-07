import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import { defaultRules } from "./default-rules.js";
import { PostgresRulesRepository } from "./postgres-rules.repository.js";
import type { RuleConfig, RuleExecutionTrace, RuleUpdateInput } from "./rule.types.js";

const getHourUtc = (timestamp: string) => new Date(timestamp).getUTCHours();
const getDayKey = (timestamp: string) => new Date(timestamp).toISOString().slice(0, 10);
const toMillis = (timestamp: string) => new Date(timestamp).getTime();

const includesAny = (source: string[], candidates: string[]) => candidates.some((candidate) => source.includes(candidate));

type EvaluationContext = {
  previousEvent?: CanonicalTelemetryEvent;
  dailyPeakKw: number;
  generatorStartsIn24h: number;
};

export class RulesEngineService {
  private defaultsEnsured = false;
  private readonly previousEventByDevice = new Map<string, CanonicalTelemetryEvent>();
  private readonly dailyPeakBySiteDay = new Map<string, number>();
  private readonly generatorStartHistoryByDevice = new Map<string, string[]>();

  constructor(private readonly repository: PostgresRulesRepository) {}

  async listRules() {
    await this.ensureDefaults();
    return this.repository.listRules();
  }

  async getRule(ruleId: string) {
    await this.ensureDefaults();
    return this.repository.getRule(ruleId);
  }

  async updateRule(ruleId: string, patch: RuleUpdateInput) {
    await this.ensureDefaults();
    return this.repository.updateRule(ruleId, patch);
  }

  async listTraces(filters: { ruleId?: string; siteId?: string; deviceId?: string; matched?: boolean; limit?: number }) {
    await this.ensureDefaults();
    return this.repository.listTraces(filters);
  }

  async evaluateTelemetry(event: CanonicalTelemetryEvent) {
    await this.ensureDefaults();
    const rules = (await this.repository.listRules()).filter((rule) => rule.enabled);
    const context = this.buildContext(event);
    const traces: RuleExecutionTrace[] = [];
    const matchedTraces: RuleExecutionTrace[] = [];

    for (const rule of rules) {
      const evaluation = this.evaluateRule(rule, event, context);
      const trace = await this.repository.saveTrace({
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        matched: evaluation.matched,
        severity: rule.severity,
        tenantId: event.tenantId,
        branchId: event.branchId,
        siteId: event.siteId,
        deviceId: event.deviceId,
        eventId: event.eventId,
        title: evaluation.title,
        summary: evaluation.summary,
        evidence: evaluation.evidence,
        executedAt: event.receivedAt
      });
      traces.push(trace);
      if (trace.matched) {
        matchedTraces.push(trace);
      }
    }

    this.updateRuntimeState(event);

    return {
      executedRules: traces.length,
      matchedRules: matchedTraces,
      traces
    };
  }

  private async ensureDefaults() {
    if (this.defaultsEnsured) {
      return;
    }

    await this.repository.ensureDefaults(defaultRules);
    this.defaultsEnsured = true;
  }

  private buildContext(event: CanonicalTelemetryEvent): EvaluationContext {
    const previousEvent = this.previousEventByDevice.get(event.deviceId);
    const siteDayKey = `${event.siteId}:${getDayKey(event.meterTimestamp)}`;
    const dailyPeakKw = this.dailyPeakBySiteDay.get(siteDayKey) ?? 0;
    const starts = (this.generatorStartHistoryByDevice.get(event.deviceId) ?? []).filter((timestamp) =>
      toMillis(event.meterTimestamp) - toMillis(timestamp) <= 24 * 60 * 60 * 1000
    );

    return {
      previousEvent,
      dailyPeakKw,
      generatorStartsIn24h: starts.length
    };
  }

  private updateRuntimeState(event: CanonicalTelemetryEvent) {
    const siteDayKey = `${event.siteId}:${getDayKey(event.meterTimestamp)}`;
    const currentPeak = this.dailyPeakBySiteDay.get(siteDayKey) ?? 0;
    const currentKw = event.metrics.kw ?? 0;
    if (currentKw > currentPeak) {
      this.dailyPeakBySiteDay.set(siteDayKey, currentKw);
    }

    const previousEvent = this.previousEventByDevice.get(event.deviceId);
    const starts = (this.generatorStartHistoryByDevice.get(event.deviceId) ?? []).filter((timestamp) =>
      toMillis(event.meterTimestamp) - toMillis(timestamp) <= 24 * 60 * 60 * 1000
    );

    if (event.status.generatorRunning && !previousEvent?.status.generatorRunning) {
      starts.push(event.meterTimestamp);
    }

    this.generatorStartHistoryByDevice.set(event.deviceId, starts);
    this.previousEventByDevice.set(event.deviceId, event);
  }

  private evaluateRule(rule: RuleConfig, event: CanonicalTelemetryEvent, context: EvaluationContext) {
    const hour = getHourUtc(event.meterTimestamp);
    const kw = event.metrics.kw ?? 0;

    switch (rule.ruleId) {
      case "after_hours_baseload_waste": {
        const startHour = Number(rule.thresholdConfig.startHourUtc ?? 22);
        const endHour = Number(rule.thresholdConfig.endHourUtc ?? 6);
        const minKw = Number(rule.thresholdConfig.minKw ?? 5);
        const isAfterHours = hour >= startHour || hour < endHour;
        return {
          matched: isAfterHours && kw >= minKw,
          title: "After-hours baseload waste",
          summary: isAfterHours && kw >= minKw
            ? `Site ${event.siteId} is drawing ${kw} kW during after-hours windows.`
            : "No after-hours baseload waste detected.",
          evidence: { hour, kw, minKw, startHour, endHour }
        };
      }
      case "schedule_misalignment": {
        const earlyHour = Number(rule.thresholdConfig.earlyHourUtc ?? 6);
        const lateHour = Number(rule.thresholdConfig.lateHourUtc ?? 21);
        const minKw = Number(rule.thresholdConfig.minKw ?? 8);
        const matched = (hour < earlyHour || hour >= lateHour) && kw >= minKw;
        return {
          matched,
          title: "Schedule misalignment",
          summary: matched
            ? `Load of ${kw} kW suggests operations are running outside expected hours.`
            : "No schedule misalignment detected.",
          evidence: { hour, kw, minKw, earlyHour, lateHour }
        };
      }
      case "avoidable_peak_event": {
        const minKw = Number(rule.thresholdConfig.minKw ?? 50);
        const peakGrowthFactor = Number(rule.thresholdConfig.peakGrowthFactor ?? 1.15);
        const threshold = context.dailyPeakKw > 0 ? context.dailyPeakKw * peakGrowthFactor : minKw;
        const matched = kw >= minKw && kw >= threshold;
        return {
          matched,
          title: "Avoidable peak event",
          summary: matched
            ? `Site ${event.siteId} hit ${kw} kW against running peak threshold ${threshold.toFixed(2)} kW.`
            : "No avoidable peak event detected.",
          evidence: { kw, minKw, priorPeakKw: context.dailyPeakKw, threshold }
        };
      }
      case "generator_inefficient_runtime": {
        const matched = event.status.generatorRunning === true && event.status.gridAvailable === true;
        return {
          matched,
          title: "Generator inefficient runtime",
          summary: matched
            ? "Generator is running while grid appears available."
            : "No generator/grid conflict detected.",
          evidence: {
            generatorRunning: event.status.generatorRunning,
            gridAvailable: event.status.gridAvailable
          }
        };
      }
      case "low_load_generator": {
        const maxKw = Number(rule.thresholdConfig.maxKw ?? 10);
        const matched = event.status.generatorRunning === true && kw < maxKw;
        return {
          matched,
          title: "Low-load generator",
          summary: matched
            ? `Generator is running at low site load of ${kw} kW.`
            : "No low-load generator condition detected.",
          evidence: { kw, maxKw, generatorRunning: event.status.generatorRunning }
        };
      }
      case "excessive_start_stop_cycling": {
        const maxStartsPer24h = Number(rule.thresholdConfig.maxStartsPer24h ?? 3);
        const justStarted = event.status.generatorRunning === true && !context.previousEvent?.status.generatorRunning;
        const startCount = context.generatorStartsIn24h + (justStarted ? 1 : 0);
        const matched = startCount >= maxStartsPer24h;
        return {
          matched,
          title: "Excessive start-stop cycling",
          summary: matched
            ? `Generator has started ${startCount} times in the last 24 hours.`
            : "No excessive generator start-stop cycling detected.",
          evidence: { startCount, maxStartsPer24h, justStarted }
        };
      }
      case "voltage_current_anomaly": {
        const matched = includesAny(event.quality.flags, [
          "voltage_out_of_range",
          "current_out_of_range",
          "current_kw_mismatch"
        ]);
        return {
          matched,
          title: "Voltage or current anomaly",
          summary: matched
            ? "Voltage/current-related trust flags are active for this event."
            : "No voltage/current anomaly detected.",
          evidence: { qualityFlags: event.quality.flags }
        };
      }
      case "telemetry_gap": {
        const maxGapMinutes = Number(rule.thresholdConfig.maxGapMinutes ?? 30);
        const gapMinutes = context.previousEvent
          ? Math.round((toMillis(event.meterTimestamp) - toMillis(context.previousEvent.meterTimestamp)) / 60000)
          : 0;
        const matched = Boolean(context.previousEvent) && gapMinutes > maxGapMinutes;
        return {
          matched,
          title: "Telemetry gap",
          summary: matched
            ? `Telemetry gap of ${gapMinutes} minutes exceeded ${maxGapMinutes} minutes.`
            : "No telemetry gap detected.",
          evidence: { gapMinutes, maxGapMinutes }
        };
      }
      case "abnormal_runtime_drift": {
        const deltaKw = Number(rule.thresholdConfig.deltaKw ?? 25);
        const previousKw = context.previousEvent?.metrics.kw ?? kw;
        const kwDelta = Math.abs(kw - previousKw);
        const matched = Boolean(context.previousEvent?.status.generatorRunning && event.status.generatorRunning) && kwDelta >= deltaKw;
        return {
          matched,
          title: "Abnormal runtime drift",
          summary: matched
            ? `Generator-related load changed by ${kwDelta} kW while runtime continued.`
            : "No abnormal runtime drift detected.",
          evidence: { kw, previousKw, kwDelta, deltaKw }
        };
      }
      default:
        return {
          matched: false,
          title: rule.name,
          summary: `Rule ${rule.ruleId} has no evaluator implementation.`,
          evidence: {}
        };
    }
  }
}
