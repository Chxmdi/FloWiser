import { randomUUID } from "node:crypto";
import { resolveReceivedAt } from "../normalization/timestamps.js";
import type {
  RawEventArchiveRecord,
  TelemetryDecodeRequest
} from "../decoders/decoder.types.js";
import type { RawEventArchiveRepository } from "./raw-event-archive.repository.js";

const addDays = (isoDate: string, days: number) => {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
};

export class RawEventArchiveService {
  constructor(private readonly repository: RawEventArchiveRepository) {}

  archivePending(request: TelemetryDecodeRequest) {
    const archivedAt = resolveReceivedAt(request.receivedAt);

    return this.repository.save({
      rawEventId: randomUUID(),
      protocol: request.protocol,
      topic: request.topic,
      decoderHint: request.decoderHint,
      tenantId: request.context.tenantId,
      branchId: request.context.branchId,
      siteId: request.context.siteId,
      deviceId: request.context.deviceId,
      archivedAt,
      retentionUntil: addDays(archivedAt, 30),
      parseStatus: "pending",
      rawPayload: request.payload
    });
  }

  markSuccess(rawEventId: string, normalizedEventId: string, decoderId: string) {
    const record = this.getById(rawEventId);

    return this.repository.save({
      ...record,
      parseStatus: "success",
      normalizedEventId,
      decoderId,
      parseError: undefined
    });
  }

  markFailure(rawEventId: string, errorMessage: string) {
    const record = this.getById(rawEventId);

    return this.repository.save({
      ...record,
      parseStatus: "failed",
      parseError: errorMessage
    });
  }

  getById(rawEventId: string): RawEventArchiveRecord {
    const record = this.repository.findById(rawEventId);

    if (!record) {
      throw new Error(`Raw event ${rawEventId} was not found in archive`);
    }

    return record;
  }
}
