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
import { InMemoryRegistryStore } from "../registry/in-memory-registry.store.js";
import { RegistryService } from "../registry/registry.service.js";
import { CurrentStateProjectionService } from "../storage/current-state-projection.service.js";
import { getDatabasePool, isPersistenceEnabled } from "../storage/database.js";
import { PostgresCurrentStateRepository } from "../storage/postgres-current-state.repository.js";
import { PostgresNormalizedTelemetryRepository } from "../storage/postgres-normalized-telemetry.repository.js";
import { PostgresRawEventStoreRepository } from "../storage/postgres-raw-event-store.repository.js";
import { PostgresRollupRepository } from "../storage/postgres-rollup.repository.js";
import { RollupProjectionService } from "../storage/rollup-projection.service.js";
import { StorageOrchestratorService } from "../storage/storage-orchestrator.service.js";
import { InMemoryQualityHistoryRepository } from "../quality/in-memory-quality-history.repository.js";
import { QualityMetricsService } from "../quality/quality-metrics.service.js";
import { TelemetryQualityService } from "../quality/telemetry-quality.service.js";
import { StateEngineService } from "../state/state-engine.service.js";
import { NotificationService } from "../alerts/notification.service.js";
import { PostgresAlertWorkflowRepository } from "../alerts/postgres-alert-workflow.repository.js";
import { AlertWorkflowService } from "../alerts/alert-workflow.service.js";

const decoderRegistry = createDefaultDecoderRegistry();
const rawEventArchiveService = new RawEventArchiveService(new InMemoryRawEventArchiveRepository());
const qualityMetricsService = new QualityMetricsService();
const telemetryQualityService = new TelemetryQualityService(
  new InMemoryQualityHistoryRepository(),
  qualityMetricsService
);
const telemetryDecodeService = new TelemetryDecodeService(
  decoderRegistry,
  rawEventArchiveService,
  telemetryQualityService
);
const idempotencyService = new IdempotencyService(new InMemoryIdempotencyRepository());
const orderingService = new OrderingService(new InMemoryOrderingStateRepository());
const deadLetterService = new DeadLetterService(new InMemoryDeadLetterRepository());
const ingestionConsumerService = new IngestionConsumerService(
  telemetryDecodeService,
  idempotencyService,
  orderingService,
  deadLetterService
);
const registryService = new RegistryService(new InMemoryRegistryStore());

const persistenceEnabled = isPersistenceEnabled();

const currentStateRepository = persistenceEnabled ? new PostgresCurrentStateRepository(getDatabasePool()) : undefined;

const storageOrchestratorService = persistenceEnabled && currentStateRepository
  ? new StorageOrchestratorService(
      new PostgresRawEventStoreRepository(getDatabasePool()),
      new PostgresNormalizedTelemetryRepository(getDatabasePool()),
      new CurrentStateProjectionService(currentStateRepository),
      new RollupProjectionService(new PostgresRollupRepository(getDatabasePool())),
      currentStateRepository
    )
  : undefined;

const stateEngineService = currentStateRepository ? new StateEngineService(currentStateRepository) : undefined;
const alertWorkflowRepository = persistenceEnabled ? new PostgresAlertWorkflowRepository(getDatabasePool()) : undefined;
const alertWorkflowService = alertWorkflowRepository
  ? new AlertWorkflowService(alertWorkflowRepository, new NotificationService(alertWorkflowRepository))
  : undefined;

export const platformServices = {
  decoderRegistry,
  rawEventArchiveService,
  telemetryDecodeService,
  telemetryQualityService,
  qualityMetricsService,
  idempotencyService,
  orderingService,
  deadLetterService,
  ingestionConsumerService,
  registryService,
  storageOrchestratorService,
  stateEngineService,
  alertWorkflowService,
  persistenceEnabled
};
