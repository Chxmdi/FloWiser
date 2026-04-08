import { PostgresSreRepository } from "./postgres-sre.repository.js";
import type { SreRunbookRequestInput } from "./sre.types.js";
import type { GatewayOperationsService } from "../operations/gateway-operations.service.js";
import type { ObservabilityService } from "../observability/observability.service.js";

const runbooks = [
  {
    runbookKey: "retry-stuck-dispatches",
    title: "Retry stuck dispatches",
    description: "Runs the retry and dead-letter sweep for stale or failed gateway dispatches."
  },
  {
    runbookKey: "capture-observability",
    title: "Capture observability snapshot",
    description: "Captures a current service health snapshot across gateways, broker backlog, and incidents."
  },
  {
    runbookKey: "retry-and-capture",
    title: "Retry then capture",
    description: "Runs the retry sweep first, then captures an observability snapshot."
  }
];

export class SreRunbookService {
  constructor(
    private readonly repository: PostgresSreRepository,
    private readonly gatewayOperationsService: GatewayOperationsService,
    private readonly observabilityService: ObservabilityService
  ) {}

  async listRunbooks() {
    return runbooks;
  }

  async listExecutions(limit?: number) {
    return this.repository.listExecutions(limit ?? 100);
  }

  async executeRunbook(runbookKey: string, input: SreRunbookRequestInput) {
    const runbook = runbooks.find((item) => item.runbookKey === runbookKey);
    if (!runbook) {
      return undefined;
    }

    const execution = await this.repository.createExecution({
      runbookKey,
      actor: input.actor,
      status: "running",
      input: {
        note: input.note,
        input: input.input
      }
    });

    let output: Record<string, unknown>;
    if (runbookKey === "retry-stuck-dispatches") {
      output = await this.gatewayOperationsService.runRetrySweep({ actor: input.actor, note: input.note });
    } else if (runbookKey === "capture-observability") {
      output = await this.observabilityService.captureSnapshot({ actor: input.actor, note: input.note });
    } else {
      const retry = await this.gatewayOperationsService.runRetrySweep({ actor: input.actor, note: input.note });
      const snapshot = await this.observabilityService.captureSnapshot({ actor: input.actor, note: input.note });
      output = { retry, snapshot };
    }

    const completed = await this.repository.completeExecution(execution.runbookExecutionId, "completed", output);
    return {
      runbook,
      execution: completed
    };
  }
}
