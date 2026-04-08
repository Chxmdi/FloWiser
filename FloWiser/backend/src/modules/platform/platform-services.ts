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
import { PostgresControlsRepository } from "../controls/postgres-controls.repository.js";
import { ExecutionGuardrailService } from "../controls/execution-guardrail.service.js";
import { ActionExecutionService } from "../controls/action-execution.service.js";
import { PostgresCommandingRepository } from "../commands/postgres-commanding.repository.js";
import { SimulatedCommandExecutorService } from "../commands/simulated-command-executor.service.js";
import { DeviceCommandingService } from "../commands/device-commanding.service.js";
import { PostgresAccessRepository } from "../access/postgres-access.repository.js";
import { AccessAuthorizationService } from "../access/access-authorization.service.js";
import { AccessAuditService } from "../access/access-audit.service.js";
import { PostgresReportingRepository } from "../reporting/postgres-reporting.repository.js";
import { ReportingService } from "../reporting/reporting.service.js";
import { PostgresGatewayRepository } from "../gateway/postgres-gateway.repository.js";
import { GatewayIntegrationService } from "../gateway/gateway-integration.service.js";
import { PostgresFieldVerificationRepository } from "../field-verification/postgres-field-verification.repository.js";
import { FieldVerificationService } from "../field-verification/field-verification.service.js";
import { GatewayOperationsService } from "../operations/gateway-operations.service.js";

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
const controlsRepository = pool ? new PostgresControlsRepository(pool) : undefined;
const executionGuardrailService = controlsRepository ? new ExecutionGuardrailService(controlsRepository) : undefined;
const actionExecutionService =
  controlsRepository && recommendationEngineService && executionGuardrailService
    ? new ActionExecutionService(controlsRepository, recommendationEngineService, executionGuardrailService)
    : undefined;
const deviceCommandingRepository = pool ? new PostgresCommandingRepository(pool) : undefined;
const deviceCommandingService =
  deviceCommandingRepository && actionExecutionService && recommendationEngineService
    ? new DeviceCommandingService(
        deviceCommandingRepository,
        actionExecutionService,
        recommendationEngineService,
        new SimulatedCommandExecutorService()
      )
    : undefined;
const accessRepository = pool ? new PostgresAccessRepository(pool) : undefined;
const accessAuthorizationService = accessRepository ? new AccessAuthorizationService(accessRepository) : undefined;
const accessAuditService = accessRepository ? new AccessAuditService(accessRepository) : undefined;
const fieldVerificationRepository = pool ? new PostgresFieldVerificationRepository(pool) : undefined;
const fieldVerificationService =
  fieldVerificationRepository && recommendationEngineService
    ? new FieldVerificationService(fieldVerificationRepository, recommendationEngineService)
    : undefined;
const reportingRepository = pool ? new PostgresReportingRepository(pool) : undefined;
const reportingService = reportingRepository
  ? new ReportingService(reportingRepository, fieldVerificationService)
  : undefined;
const gatewayRepository = pool ? new PostgresGatewayRepository(pool) : undefined;
const gatewayIntegrationService = gatewayRepository && actionExecutionService
  ? new GatewayIntegrationService(gatewayRepository, actionExecutionService, deviceCommandingRepository)
  : undefined;
const gatewayOperationsService =
  deviceCommandingRepository && gatewayIntegrationService && actionExecutionService
    ? new GatewayOperationsService(deviceCommandingRepository, gatewayIntegrationService, actionExecutionService)
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
  rulesEngineService,
  recommendationEngineService,
  experienceRepository,
  actionExecutionService,
  deviceCommandingService,
  accessAuthorizationService,
  accessAuditService,
  fieldVerificationService,
  reportingService,
  gatewayIntegrationService,
  gatewayOperationsService,
  persistenceEnabled
};
