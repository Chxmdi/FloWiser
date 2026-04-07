import type { CanonicalTelemetryEvent } from "@flowiser/schemas";

export type TelemetryEventQueryFilters = {
  eventId?: string;
  deviceId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export interface NormalizedTelemetryRepository {
  save(event: CanonicalTelemetryEvent): Promise<CanonicalTelemetryEvent>;
  findById(eventId: string): Promise<CanonicalTelemetryEvent | undefined>;
  findByFilters(filters: TelemetryEventQueryFilters): Promise<CanonicalTelemetryEvent[]>;
}
