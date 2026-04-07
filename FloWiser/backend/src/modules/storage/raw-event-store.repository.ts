import type { RawEventArchiveRecord } from "../decoders/decoder.types.js";

export type RawEventQueryFilters = {
  rawEventId?: string;
  deviceId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export interface PersistentRawEventStoreRepository {
  save(record: RawEventArchiveRecord): Promise<RawEventArchiveRecord>;
  findById(rawEventId: string): Promise<RawEventArchiveRecord | undefined>;
  findByFilters(filters: RawEventQueryFilters): Promise<RawEventArchiveRecord[]>;
}
