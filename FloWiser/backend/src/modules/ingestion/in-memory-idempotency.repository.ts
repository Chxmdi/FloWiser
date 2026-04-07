import type { IdempotencyRecord, IdempotencyRepository } from "./idempotency.repository.js";

export class InMemoryIdempotencyRepository implements IdempotencyRepository {
  private readonly records = new Map<string, IdempotencyRecord>();

  find(key: string) {
    return this.records.get(key);
  }

  save(record: IdempotencyRecord) {
    this.records.set(record.key, record);
    return record;
  }
}
