import type { IdempotencyRepository } from "./idempotency.repository.js";

export class IdempotencyService {
  constructor(private readonly repository: IdempotencyRepository) {}

  claim(key: string, kind: "transport" | "canonical") {
    const existing = this.repository.find(key);

    if (existing) {
      return { claimed: false, record: existing };
    }

    const record = this.repository.save({
      key,
      kind,
      createdAt: new Date().toISOString()
    });

    return { claimed: true, record };
  }
}
