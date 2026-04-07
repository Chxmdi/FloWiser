import { randomUUID } from "node:crypto";
import type { DeadLetterRepository } from "./dead-letter.repository.js";
import type { DeadLetterEntry, DeadLetterStage, IngestionEnvelope } from "./ingestion.types.js";

export class DeadLetterService {
  constructor(private readonly repository: DeadLetterRepository) {}

  create(stage: DeadLetterStage, reason: string, envelope: IngestionEnvelope, traceId: string, rawEventId?: string) {
    return this.repository.save({
      entryId: randomUUID(),
      createdAt: new Date().toISOString(),
      traceId,
      stage,
      reason,
      topic: envelope.topic,
      transportMessageId: envelope.sourceAuth.transportMessageId,
      tenantId: envelope.context.tenantId,
      siteId: envelope.context.siteId,
      deviceId: envelope.context.deviceId,
      rawEventId
    });
  }

  list() {
    return this.repository.list();
  }

  get(entryId: string): DeadLetterEntry {
    const entry = this.repository.find(entryId);

    if (!entry) {
      throw new Error(`Dead-letter entry ${entryId} was not found`);
    }

    return entry;
  }
}
