import type { RuleConfig } from "./rule.types.js";

export const defaultRules: RuleConfig[] = [
  {
    ruleId: "after_hours_baseload_waste",
    name: "After-hours baseload waste",
    description: "Detects meaningful kW draw during late-night hours when sites are likely closed.",
    category: "energy_waste",
    severity: "medium",
    enabled: true,
    scope: "site",
    version: "1.0.0",
    thresholdConfig: { minKw: 5, startHourUtc: 22, endHourUtc: 6 }
  },
  {
    ruleId: "schedule_misalignment",
    name: "Schedule misalignment",
    description: "Flags unusually high load too early or too late in the day.",
    category: "schedule",
    severity: "medium",
    enabled: true,
    scope: "site",
    version: "1.0.0",
    thresholdConfig: { minKw: 8, earlyHourUtc: 6, lateHourUtc: 21 }
  },
  {
    ruleId: "avoidable_peak_event",
    name: "Avoidable peak event",
    description: "Flags large spikes above the running daily site peak baseline.",
    category: "energy_waste",
    severity: "high",
    enabled: true,
    scope: "site",
    version: "1.0.0",
    thresholdConfig: { minKw: 50, peakGrowthFactor: 1.15 }
  },
  {
    ruleId: "generator_inefficient_runtime",
    name: "Generator inefficient runtime",
    description: "Flags generator runtime when grid appears available.",
    category: "generator",
    severity: "medium",
    enabled: true,
    scope: "site",
    version: "1.0.0",
    thresholdConfig: {}
  },
  {
    ruleId: "low_load_generator",
    name: "Low-load generator",
    description: "Flags generator runtime while site load is very low.",
    category: "generator",
    severity: "medium",
    enabled: true,
    scope: "site",
    version: "1.0.0",
    thresholdConfig: { maxKw: 10 }
  },
  {
    ruleId: "excessive_start_stop_cycling",
    name: "Excessive start-stop cycling",
    description: "Flags repeated generator starts within a 24-hour window.",
    category: "generator",
    severity: "high",
    enabled: true,
    scope: "device",
    version: "1.0.0",
    thresholdConfig: { maxStartsPer24h: 3 }
  },
  {
    ruleId: "voltage_current_anomaly",
    name: "Voltage or current anomaly",
    description: "Flags voltage/current anomalies already surfaced by the trust layer.",
    category: "equipment",
    severity: "high",
    enabled: true,
    scope: "device",
    version: "1.0.0",
    thresholdConfig: {}
  },
  {
    ruleId: "telemetry_gap",
    name: "Telemetry gap",
    description: "Flags large gaps between device telemetry events.",
    category: "telemetry",
    severity: "medium",
    enabled: true,
    scope: "device",
    version: "1.0.0",
    thresholdConfig: { maxGapMinutes: 30 }
  },
  {
    ruleId: "abnormal_runtime_drift",
    name: "Abnormal runtime drift",
    description: "Flags large generator load swings while generator runtime continues.",
    category: "equipment",
    severity: "medium",
    enabled: true,
    scope: "device",
    version: "1.0.0",
    thresholdConfig: { deltaKw: 25 }
  }
];
