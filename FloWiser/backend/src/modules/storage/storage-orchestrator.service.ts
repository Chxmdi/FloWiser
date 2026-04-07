import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { RawEventArchiveRecord } from "../decoders/decoder.types.js";
import type { PersistentRawEventStoreRepository, RawEventQueryFilters } from "./raw-event-store.repository.js";
import type { NormalizedTelemetryRepository, TelemetryEventQueryFilters } from "./normalized-telemetry.repository.js";
import { CurrentStateProjectionService } from "./current-state-projection.service.js";
import { RollupProjectionService } from "./rollup-projection.service.js";

export class StorageOrchestratorService {
  constructor(
    private readonly rawEventStore: PersistentRawEventStoreRepository,
    private readonly normalizedTelemetryStore: NormalizedTelemetryRepository,
    private readonly currentStateProjectionService: CurrentStateProjectionService,
    private readonly rollupProjectionService: RollupProjectionService
  ) {}

  async persistProcessedTelemetry(rawEvent: RawEventArchiveRecord, canonicalEvent: CanonicalTelemetryEvent) {
    await this.rawEventStore.save(rawEvent);
    await this.normalizedTelemetryStore.save(canonicalEvent);
    await this.currentStateProjectionService.project(canonicalEvent);
    await this.rollupProjectionService.project(canonicalEvent);
  }

  async findRawEventById(rawEventId: string) {
    return this.rawEventStore.findById(rawEventId);
  }

  async findRawEvents(filters: RawEventQueryFilters) {
    return this.rawEventStore.findByFilters(filters);
  }

  async findTelemetryEvents(filters: TelemetryEventQueryFilters) {
    return this.normalizedTelemetryStore.findByFilters(filters);
  }
}
