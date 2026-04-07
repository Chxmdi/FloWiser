import type { RawEventArchiveRecord } from "../decoders/decoder.types.js";

export interface RawEventArchiveRepository {
  save(record: RawEventArchiveRecord): RawEventArchiveRecord;
  findById(rawEventId: string): RawEventArchiveRecord | undefined;
}
