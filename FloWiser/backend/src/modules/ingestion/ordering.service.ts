import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { IngestionFinding } from "./ingestion.types.js";
import type { OrderingStateRepository } from "./ordering-state.repository.js";

const replayBacklogThresholdMs = 5 * 60 * 1000;

export class OrderingService {
  constructor(private readonly repository: OrderingStateRepository) {}

  evaluate(event: CanonicalTelemetryEvent): IngestionFinding[] {
    const findings: IngestionFinding[] = [];
    const existing = this.repository.find(event.deviceId);

    if (existing?.lastSequenceNo !== undefined && event.sequenceNo !== undefined) {
      if (event.sequenceNo < existing.lastSequenceNo) {
        findings.push("out_of_order");
      }

      if (event.sequenceNo > existing.lastSequenceNo + 1) {
        findings.push("sequence_gap");
      }
    }

    if (
      existing?.lastMeterTimestamp &&
      new Date(event.meterTimestamp).getTime() < new Date(existing.lastMeterTimestamp).getTime()
    ) {
      findings.push("late_arrival");
    }

    if (new Date(event.receivedAt).getTime() - new Date(event.meterTimestamp).getTime() > replayBacklogThresholdMs) {
      findings.push("replay_backlog");
    }

    this.repository.save({
      deviceId: event.deviceId,
      lastSequenceNo:
        existing?.lastSequenceNo === undefined || event.sequenceNo === undefined
          ? event.sequenceNo ?? existing?.lastSequenceNo
          : Math.max(existing.lastSequenceNo, event.sequenceNo),
      lastMeterTimestamp:
        existing?.lastMeterTimestamp &&
        new Date(existing.lastMeterTimestamp).getTime() > new Date(event.meterTimestamp).getTime()
          ? existing.lastMeterTimestamp
          : event.meterTimestamp
    });

    return findings;
  }
}
