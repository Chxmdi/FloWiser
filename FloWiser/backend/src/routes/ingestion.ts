import { Router } from "express";
import { ingestionEnvelopeSchema } from "../modules/ingestion/ingestion.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

export const ingestionRouter = Router();

ingestionRouter.post("/process", async (request, response) => {
  const parsed = ingestionEnvelopeSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      error: "Invalid ingestion envelope",
      details: parsed.error.flatten()
    });
  }

  const result = platformServices.ingestionConsumerService.process(parsed.data);
  let storageStatus: "persisted" | "not_configured" | "skipped" = "skipped";
  let alertSummary: { alertCount: number; issueCount: number; skippedReason?: string } | undefined;
  let ruleSummary:
    | {
        executedRules: number;
        matchedRules: number;
        matchedRuleIds: string[];
      }
    | undefined;
  let recommendationSummary:
    | {
        generated: number;
        topActionIds: string[];
      }
    | undefined;

  if (result.status === "processed" && result.rawEvent && result.canonicalEvent) {
    if (platformServices.storageOrchestratorService) {
      await platformServices.storageOrchestratorService.persistProcessedTelemetry(
        result.rawEvent,
        result.canonicalEvent
      );
      storageStatus = "persisted";

      let matchedRules: Awaited<ReturnType<NonNullable<typeof platformServices.rulesEngineService>["evaluateTelemetry"]>>["matchedRules"] = [];

      if (platformServices.rulesEngineService) {
        const rulesResult = await platformServices.rulesEngineService.evaluateTelemetry(result.canonicalEvent);
        matchedRules = rulesResult.matchedRules;
        ruleSummary = {
          executedRules: rulesResult.executedRules,
          matchedRules: rulesResult.matchedRules.length,
          matchedRuleIds: rulesResult.matchedRules.map((trace) => trace.ruleId)
        };
      }

      if (platformServices.recommendationEngineService && matchedRules.length > 0) {
        const recommendations = await platformServices.recommendationEngineService.generateFromRuleTraces(
          result.canonicalEvent,
          matchedRules
        );
        recommendationSummary = {
          generated: recommendations.length,
          topActionIds: recommendations.slice(0, 3).map((recommendation) => recommendation.actionId)
        };
      }

      if (platformServices.alertWorkflowService) {
        const workflowResult = await platformServices.alertWorkflowService.generateFromTelemetry(result.canonicalEvent);
        alertSummary = {
          alertCount: workflowResult.alerts.length,
          issueCount: workflowResult.issues.length,
          skippedReason: workflowResult.skippedReason
        };
      }
    } else {
      storageStatus = "not_configured";
    }
  }

  const publicResult = {
    traceId: result.traceId,
    status: result.status,
    findings: result.findings,
    rawEventId: result.rawEventId,
    canonicalEventId: result.canonicalEventId,
    deadLetterEntryId: result.deadLetterEntryId,
    duplicateOfKey: result.duplicateOfKey,
    storageStatus,
    ruleSummary,
    recommendationSummary,
    alertSummary
  };

  const statusCode = result.status === "processed" ? 201 : result.status === "dead_letter" ? 422 : 200;

  return response.status(statusCode).json(publicResult);
});

ingestionRouter.get("/dead-letter", (_request, response) => {
  response.status(200).json({
    entries: platformServices.deadLetterService.list()
  });
});

ingestionRouter.get("/dead-letter/:entryId", (request, response) => {
  try {
    const entry = platformServices.deadLetterService.get(request.params.entryId);
    return response.status(200).json(entry);
  } catch (error) {
    return response.status(404).json({
      error: error instanceof Error ? error.message : "Dead-letter entry not found"
    });
  }
});
