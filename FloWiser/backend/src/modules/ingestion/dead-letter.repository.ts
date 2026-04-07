import type { DeadLetterEntry } from "./ingestion.types.js";

export interface DeadLetterRepository {
  save(entry: DeadLetterEntry): DeadLetterEntry;
  find(entryId: string): DeadLetterEntry | undefined;
  list(): DeadLetterEntry[];
}
