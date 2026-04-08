import type { ActionExecutionService } from "../controls/action-execution.service.js";
import type { RecommendationEngineService } from "../recommendations/recommendation-engine.service.js";
import { defaultCommandTemplates } from "./default-command-templates.js";
import { PostgresCommandingRepository } from "./postgres-commanding.repository.js";
import { SimulatedCommandExecutorService } from "./simulated-command-executor.service.js";
import type { CommandPlan, CommandRequestInput } from "./command.types.js";

export class DeviceCommandingService {
  private defaultsEnsured = false;

  constructor(
    private readonly repository: PostgresCommandingRepository,
    private readonly actionExecutionService: ActionExecutionService,
    private readonly recommendationEngineService: RecommendationEngineService,
    private readonly simulator: SimulatedCommandExecutorService
  ) {}

  async listTemplates() {
    await this.ensureDefaults();
    return this.repository.listTemplates();
  }

  async getTemplate(templateId: string) {
    await this.ensureDefaults();
    return this.repository.getTemplate(templateId);
  }

  async listDispatches(filters: { executionId?: string; siteId?: string; dispatchStatus?: string; limit?: number }) {
    await this.ensureDefaults();
    return this.repository.listDispatches(filters);
  }

  async getDispatch(dispatchId: string) {
    await this.ensureDefaults();
    return this.repository.getDispatch(dispatchId);
  }

  async planExecution(executionId: string, input: CommandRequestInput) {
    await this.ensureDefaults();
    const context = await this.resolveContext(executionId);
    if (!context) {
      return undefined;
    }

    const commandPlan = this.buildPlan(context.template, context.recommendation);
    const dispatch = await this.repository.createDispatch({
      executionId: context.execution.executionId,
      actionId: context.recommendation.actionId,
      templateId: context.template.templateId,
      tenantId: context.recommendation.tenantId,
      branchId: context.recommendation.branchId,
      siteId: context.recommendation.siteId,
      deviceId: context.recommendation.deviceId,
      dispatchChannel: context.template.dispatchChannel,
      executionMode: context.execution.executionMode,
      dispatchStatus: context.execution.guardrailOutcome.ready ? "planned" : "blocked",
      requestedBy: input.actor,
      note: input.note,
      commandPayload: commandPlan,
      simulationResult: {
        success: context.execution.guardrailOutcome.ready,
        warnings: context.execution.guardrailOutcome.warnings,
        estimatedImpact: {
          monthlySavings: context.recommendation.expectedMonthlySavings,
          dieselSavings: context.recommendation.expectedDieselSavings
        },
        summary: context.execution.guardrailOutcome.ready
          ? "Command plan prepared successfully."
          : `Command plan blocked: ${context.execution.guardrailOutcome.blocks.join('; ')}`
      },
      resultSummary: undefined,
      requestedAt: new Date().toISOString()
    });

    return { ...context, commandPlan, dispatch };
  }

  async simulateExecution(executionId: string, input: CommandRequestInput) {
    await this.ensureDefaults();
    const context = await this.resolveContext(executionId);
    if (!context) {
      return undefined;
    }

    const commandPlan = this.buildPlan(context.template, context.recommendation);
    const simulation = this.simulator.simulate(context.template, commandPlan, context.recommendation);
    const dispatch = await this.repository.createDispatch({
      executionId: context.execution.executionId,
      actionId: context.recommendation.actionId,
      templateId: context.template.templateId,
      tenantId: context.recommendation.tenantId,
      branchId: context.recommendation.branchId,
      siteId: context.recommendation.siteId,
      deviceId: context.recommendation.deviceId,
      dispatchChannel: context.template.dispatchChannel,
      executionMode: context.execution.executionMode,
      dispatchStatus: context.execution.guardrailOutcome.ready ? "simulated" : "blocked",
      requestedBy: input.actor,
      note: input.note,
      commandPayload: commandPlan,
      simulationResult: simulation,
      resultSummary: simulation.summary,
      requestedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    });

    return { ...context, commandPlan, simulation, dispatch };
  }

  async dispatchExecution(executionId: string, input: CommandRequestInput) {
    await this.ensureDefaults();
    const context = await this.resolveContext(executionId);
    if (!context) {
      return undefined;
    }

    if (context.execution.status !== "ready") {
      throw new Error(`Execution ${executionId} is not ready for dispatch`);
    }

    const commandPlan = this.buildPlan(context.template, context.recommendation);
    const simulation = this.simulator.simulate(context.template, commandPlan, context.recommendation);
    const timestamp = new Date().toISOString();
    const dispatch = await this.repository.createDispatch({
      executionId: context.execution.executionId,
      actionId: context.recommendation.actionId,
      templateId: context.template.templateId,
      tenantId: context.recommendation.tenantId,
      branchId: context.recommendation.branchId,
      siteId: context.recommendation.siteId,
      deviceId: context.recommendation.deviceId,
      dispatchChannel: context.template.dispatchChannel,
      executionMode: context.execution.executionMode,
      dispatchStatus: simulation.success ? "succeeded" : "failed",
      requestedBy: input.actor,
      note: input.note,
      commandPayload: commandPlan,
      simulationResult: simulation,
      resultSummary: simulation.summary,
      requestedAt: timestamp,
      dispatchedAt: timestamp,
      completedAt: timestamp
    });

    let executionResult:
      | Awaited<ReturnType<ActionExecutionService["completeExecution"]>>
      | { execution: typeof context.execution; approvals: typeof context.approvals }
      | undefined;

    if (context.template.dispatchChannel === "manual_playbook") {
      executionResult = { execution: context.execution, approvals: context.approvals };
    } else {
      executionResult = await this.actionExecutionService.completeExecution(executionId, {
        actor: input.actor,
        success: simulation.success,
        resultSummary: simulation.summary
      });
    }

    return {
      ...context,
      commandPlan,
      simulation,
      dispatch,
      executionResult
    };
  }

  private async resolveContext(executionId: string) {
    const executionDetail = await this.actionExecutionService.getExecution(executionId);
    if (!executionDetail) {
      return undefined;
    }

    const recommendation = await this.recommendationEngineService.getRecommendation(executionDetail.execution.actionId);
    if (!recommendation) {
      return undefined;
    }

    const template = await this.repository.findTemplateByActionType(recommendation.actionType);
    if (!template) {
      return undefined;
    }

    return {
      execution: executionDetail.execution,
      approvals: executionDetail.approvals,
      recommendation,
      template
    };
  }

  private buildPlan(template: Awaited<ReturnType<PostgresCommandingRepository["findTemplateByActionType"]>>, recommendation: Awaited<ReturnType<RecommendationEngineService["getRecommendation"]>>): CommandPlan {
    const steps = ((template?.commandBlueprint.steps as string[]) ?? []).map((step) => ({
      step,
      command: `${template?.actionType}.${step}`,
      target: recommendation?.deviceId ?? recommendation?.siteId ?? "site",
      params: {
        actionId: recommendation?.actionId,
        siteId: recommendation?.siteId,
        deviceId: recommendation?.deviceId,
        expectedMonthlySavings: recommendation?.expectedMonthlySavings,
        expectedDieselSavings: recommendation?.expectedDieselSavings,
        recommendationTitle: recommendation?.title
      }
    }));

    return {
      templateId: template?.templateId ?? "unknown",
      actionType: template?.actionType ?? "unknown",
      dispatchChannel: template?.dispatchChannel ?? "manual_playbook",
      commands: steps
    };
  }

  private async ensureDefaults() {
    if (this.defaultsEnsured) {
      return;
    }

    await this.repository.ensureDefaults(defaultCommandTemplates);
    this.defaultsEnsured = true;
  }
}
