import { createDefaultDecoderRegistry } from "../decoders/create-default-decoder-registry.js";
import { InMemoryRawEventArchiveRepository } from "../raw-events/in-memory-raw-event-archive.repository.js";
import { RawEventArchiveService } from "../raw-events/raw-event-archive.service.js";
import { TelemetryDecodeService } from "../telemetry/telemetry-decode.service.js";
import { InMemoryIdempotencyRepository } from "../ingestion/in-memory-idempotency.repository.js";
import { IdempotencyService } from "../ingestion/idempotency.service.js";
import { InMemoryOrderingStateRepository } from "../ingestion/in-memory-ordering-state.repository.js";
import { OrderingService } from "../ingestion/ordering.service.js";
import { InMemoryDeadLetterRepository } from "../ingestion/in-memory-dead-letter.repository.js";
import { DeadLetterService } from "../ingestion/dead-letter.service.js";
import { IngestionConsumerService } from "../ingestion/consumer.service.js";

const decoderRegistry = createDefaultDecoderRegistry();
const rawEventArchiveService = new RawEventArchiveService(new InMemoryRawEventArchiveRepository());
const telemetryDecodeService = new TelemetryDecodeService(decoderRegistry, rawEventArchiveService);
const idempotencyService = new IdempotencyService(new InMemoryIdempotencyRepository());
const orderingService = new OrderingService(new InMemoryOrderingStateRepository());
const deadLetterService = new DeadLetterService(new InMemoryDeadLetterRepository());
const ingestionConsumerService = new IngestionConsumerService(
  telemetryDecodeService,
  idempotencyService,
  orderingService,
  deadLetterService
);

export const platformServices = {
  decoderRegistry,
  rawEventArchiveService,
  telemetryDecodeService,
  idempotencyService,
  orderingService,
  deadLetterService,
  ingestionConsumerService
};
