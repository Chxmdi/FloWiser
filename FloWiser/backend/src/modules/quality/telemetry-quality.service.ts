import type { CanonicalQuality, CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { QualityHistoryRepository } from "./quality-history.repository.js";
import { QualityMetricsService } from "./quality-metrics.service.js";

const toUnix = (timestamp: string) => new Date(timestamp).getTime();

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const markSevere = (flags: string[]) =>
  flags.some((flag) =>
    [
      "timestamp_drift_critical",
      "negative_kw_sign_inversion",
      "negative_energy_counter",
      "counter_reset_or_rollover",
      "voltage_out_of_range",
      "current_out_of_range"
    ].includes(flag)
  );

export class TelemetryQualityService {
  constructor(
    private readonly historyRepository: QualityHistoryRepository,
    private readonly metricsService: QualityMetricsService
  ) {}

  evaluate(event: CanonicalTelemetryEvent) {
    const previous = this.historyRepository.getLatestForDevice(event.deviceId);
    const quality = this.buildQuality(event, previous);
    const evaluatedEvent = {
      ...event,
      quality
    };

    this.historyRepository.setLatestForDevice(evaluatedEvent);
    this.metricsService.record(quality);

    return evaluatedEvent;
  }

  reEvaluate(event: CanonicalTelemetryEvent) {
    const quality = this.buildQuality(event);
    const evaluatedEvent = {
      ...event,
      quality
    };

    this.metricsService.record(quality);
    return evaluatedEvent;
  }

  private buildQuality(current: CanonicalTelemetryEvent, previous?: CanonicalTelemetryEvent): CanonicalQuality {
    const flags: string[] = [];
    let score = 100;

    if (current.metrics.kw === undefined) {
      flags.push("kw_missing");
      score -= 15;
    }

    if (current.metrics.kw !== undefined && current.metrics.kw < 0) {
      flags.push("negative_kw_sign_inversion");
      score -= 35;
    }

    if (current.metrics.kwhTotal !== undefined && current.metrics.kwhTotal < 0) {
      flags.push("negative_energy_counter");
      score -= 35;
    }

    const phaseVoltages = [current.metrics.voltageL1, current.metrics.voltageL2, current.metrics.voltageL3];
    const phaseCurrents = [current.metrics.currentL1, current.metrics.currentL2, current.metrics.currentL3];

    if (phaseVoltages.filter((value) => value !== undefined).length === 1 || phaseVoltages.filter((value) => value !== undefined).length === 2) {
      flags.push("missing_phase_voltage");
      score -= 10;
    }

    if (phaseCurrents.filter((value) => value !== undefined).length === 1 || phaseCurrents.filter((value) => value !== undefined).length === 2) {
      flags.push("missing_phase_current");
      score -= 10;
    }

    if (phaseVoltages.some((value) => value !== undefined && (value < 150 || value > 260))) {
      flags.push("voltage_out_of_range");
      score -= 25;
    }

    if (phaseCurrents.some((value) => value !== undefined && (value < 0 || value > 1200))) {
      flags.push("current_out_of_range");
      score -= 20;
    }

    if (
      current.metrics.kw !== undefined &&
      current.metrics.currentL1 !== undefined &&
      current.metrics.currentL2 !== undefined &&
      current.metrics.currentL3 !== undefined
    ) {
      const currentSum = current.metrics.currentL1 + current.metrics.currentL2 + current.metrics.currentL3;
      if (currentSum > 0 && current.metrics.kw > currentSum * 0.6) {
        flags.push("current_kw_mismatch");
        score -= 15;
      }
    }

    if (current.metrics.frequency !== undefined && (current.metrics.frequency < 45 || current.metrics.frequency > 55)) {
      flags.push("frequency_out_of_range");
      score -= 15;
    }

    if (current.metrics.powerFactor !== undefined && (current.metrics.powerFactor < -1 || current.metrics.powerFactor > 1)) {
      flags.push("power_factor_out_of_range");
      score -= 10;
    }

    const driftMs = Math.abs(toUnix(current.receivedAt) - toUnix(current.meterTimestamp));
    if (driftMs > 15 * 60 * 1000) {
      flags.push("timestamp_drift_critical");
      score -= 35;
    } else if (driftMs > 3 * 60 * 1000) {
      flags.push("timestamp_drift_warning");
      score -= 10;
    }

    if (previous) {
      if (toUnix(current.meterTimestamp) < toUnix(previous.meterTimestamp)) {
        flags.push("retrograde_meter_timestamp");
        score -= 25;
      }

      if (
        current.metrics.kwhTotal !== undefined &&
        previous.metrics.kwhTotal !== undefined &&
        current.metrics.kwhTotal < previous.metrics.kwhTotal
      ) {
        flags.push("counter_reset_or_rollover");
        score -= 25;
      }

      const sameKw =
        current.metrics.kw !== undefined &&
        previous.metrics.kw !== undefined &&
        current.metrics.kw === previous.metrics.kw;

      const intervalMs = Math.abs(toUnix(current.meterTimestamp) - toUnix(previous.meterTimestamp));

      if (sameKw && intervalMs > 0 && intervalMs <= 30 * 60 * 1000) {
        flags.push("flatline_candidate");
        score -= 8;
      }

      if (
        current.metrics.frequency !== undefined &&
        previous.metrics.frequency !== undefined &&
        Math.abs(current.metrics.frequency - previous.metrics.frequency) > 2
      ) {
        flags.push("frequency_drift");
        score -= 8;
      }
    }

    const status = markSevere(flags) ? "bad" : flags.length > 0 ? "suspicious" : "good";

    return {
      status,
      score: clamp(score, 0, 100),
      flags
    };
  }
}
