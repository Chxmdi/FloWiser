import type { CanonicalTelemetryEvent, QualityStatus } from "@flowiser/schemas";

export type TelemetryEventQueryFilters = {
  eventId?: string;
  deviceId?: string;
  from?: string;
  to?: string;
  qualityStatus?: QualityStatus;
  minQualityScore?: number;
  limit?: number;
};

export interface NormalizedTelemetryRepository {
  save(event: CanonicalTelemetryEvent): Promise<CanonicalTelemetryEvent>;
  findById(eventId: string): Promise<CanonicalTelemetryEvent | undefined>;
  findByFilters(filters: TelemetryEventQueryFilters): Promise<CanonicalTelemetryEvent[]>;
}
