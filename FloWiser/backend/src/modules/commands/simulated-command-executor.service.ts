import type { RecommendationRecord } from "../recommendations/recommendation.types.js";
import type { CommandPlan, CommandTemplate, SimulationResult } from "./command.types.js";

export class SimulatedCommandExecutorService {
  simulate(template: CommandTemplate, plan: CommandPlan, recommendation: RecommendationRecord): SimulationResult {
    const warnings: string[] = [];

    if (template.dispatchChannel === "manual_playbook") {
      warnings.push("This dispatch creates a manual execution package and does not directly command a device.");
    }

    if (template.requiresConfirmation) {
      warnings.push("Template requires final operator confirmation before live rollout.");
    }

    if (recommendation.failureRiskScore >= 70 && template.dispatchChannel === "simulated_gateway") {
      warnings.push("High failure risk: validate rollback path before live rollout.");
    }

    return {
      success: true,
      warnings,
      estimatedImpact: {
        monthlySavings: recommendation.expectedMonthlySavings,
        dieselSavings: recommendation.expectedDieselSavings
      },
      summary:
        template.dispatchChannel === "manual_playbook"
          ? `Generated a manual execution package with ${plan.commands.length} guided steps.`
          : `Simulated ${plan.commands.length} gateway command steps for ${recommendation.actionType}.`
    };
  }
}
