import type { DeadLetterEntry } from "./ingestion.types.js";
import type { DeadLetterRepository } from "./dead-letter.repository.js";

export class InMemoryDeadLetterRepository implements DeadLetterRepository {
  private readonly entries = new Map<string, DeadLetterEntry>();

  save(entry: DeadLetterEntry) {
    this.entries.set(entry.entryId, entry);
    return entry;
  }

  find(entryId: string) {
    return this.entries.get(entryId);
  }

  list() {
    return [...this.entries.values()].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt)
    );
  }
}
