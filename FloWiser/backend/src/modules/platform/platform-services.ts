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
import { PostgresRulesRepository } from "../rules/postgres-rules.repository.js";
import { RulesEngineService } from "../rules/rules-engine.service.js";
import { PostgresRecommendationRepository } from "../recommendations/postgres-recommendation.repository.js";
import { RecommendationEngineService } from "../recommendations/recommendation-engine.service.js";
import { RootCauseService } from "../recommendations/root-cause.service.js";
import { PostgresExperienceRepository } from "../experience/postgres-experience.repository.js";

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
const pool = persistenceEnabled ? getDatabasePool() : undefined;

const currentStateRepository = pool ? new PostgresCurrentStateRepository(pool) : undefined;

const storageOrchestratorService = pool && currentStateRepository
  ? new StorageOrchestratorService(
      new PostgresRawEventStoreRepository(pool),
      new PostgresNormalizedTelemetryRepository(pool),
      new CurrentStateProjectionService(currentStateRepository),
      new RollupProjectionService(new PostgresRollupRepository(pool)),
      currentStateRepository
    )
  : undefined;

const stateEngineService = currentStateRepository ? new StateEngineService(currentStateRepository) : undefined;
const alertWorkflowRepository = pool ? new PostgresAlertWorkflowRepository(pool) : undefined;
const alertWorkflowService = alertWorkflowRepository
  ? new AlertWorkflowService(alertWorkflowRepository, new NotificationService(alertWorkflowRepository))
  : undefined;
const rulesRepository = pool ? new PostgresRulesRepository(pool) : undefined;
const rulesEngineService = rulesRepository ? new RulesEngineService(rulesRepository) : undefined;
const recommendationRepository = pool ? new PostgresRecommendationRepository(pool) : undefined;
const recommendationEngineService = recommendationRepository
  ? new RecommendationEngineService(recommendationRepository, new RootCauseService())
  : undefined;
const experienceRepository = pool ? new PostgresExperienceRepository(pool) : undefined;

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
  rulesEngineService,
  recommendationEngineService,
  experienceRepository,
  persistenceEnabled
};
