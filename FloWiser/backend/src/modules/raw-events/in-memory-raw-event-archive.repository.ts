import type { RawEventArchiveRecord } from "../decoders/decoder.types.js";
import type { RawEventArchiveRepository } from "./raw-event-archive.repository.js";

export class InMemoryRawEventArchiveRepository implements RawEventArchiveRepository {
  private readonly records = new Map<string, RawEventArchiveRecord>();

  save(record: RawEventArchiveRecord) {
    this.records.set(record.rawEventId, record);
    return record;
  }

  findById(rawEventId: string) {
    return this.records.get(rawEventId);
  }
}
