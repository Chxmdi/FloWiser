import type { CommandTemplate } from "./command.types.js";

export const defaultCommandTemplates: CommandTemplate[] = [
  {
    templateId: "schedule_adjustment_template",
    name: "Schedule adjustment command set",
    description: "Read, patch, and verify operating schedules for after-hours waste reduction.",
    actionType: "schedule_adjustment",
    dispatchChannel: "simulated_gateway",
    allowedExecutionModes: ["dry_run", "manual", "automated"],
    enabled: true,
    requiresConfirmation: true,
    commandBlueprint: {
      steps: ["read_schedule", "patch_schedule_window", "verify_schedule", "verify_load_drop"]
    }
  },
  {
    templateId: "schedule_tuning_template",
    name: "Schedule tuning command set",
    description: "Adjust start/stop windows for site schedule alignment.",
    actionType: "schedule_tuning",
    dispatchChannel: "simulated_gateway",
    allowedExecutionModes: ["dry_run", "manual", "automated"],
    enabled: true,
    requiresConfirmation: true,
    commandBlueprint: {
      steps: ["read_schedule", "update_start_stop_window", "verify_schedule"]
    }
  },
  {
    templateId: "load_staggering_template",
    name: "Load staggering playbook",
    description: "Generate manual stagger sequence guidance for heavy loads.",
    actionType: "load_staggering",
    dispatchChannel: "manual_playbook",
    allowedExecutionModes: ["dry_run", "manual"],
    enabled: true,
    requiresConfirmation: true,
    commandBlueprint: {
      steps: ["identify_heavy_loads", "prepare_stagger_plan", "review_with_ops"]
    }
  },
  {
    templateId: "dispatch_policy_review_template",
    name: "Generator dispatch review playbook",
    description: "Prepare a guarded manual review package for generator dispatch policies.",
    actionType: "dispatch_policy_review",
    dispatchChannel: "manual_playbook",
    allowedExecutionModes: ["dry_run", "manual"],
    enabled: true,
    requiresConfirmation: true,
    commandBlueprint: {
      steps: ["read_dispatch_policy", "review_grid_failover_thresholds", "prepare_change_request"]
    }
  },
  {
    templateId: "control_logic_review_template",
    name: "Control logic review playbook",
    description: "Prepare a manual change package for control logic instability issues.",
    actionType: "control_logic_review",
    dispatchChannel: "manual_playbook",
    allowedExecutionModes: ["dry_run", "manual"],
    enabled: true,
    requiresConfirmation: true,
    commandBlueprint: {
      steps: ["capture_runtime_context", "review_logic_conditions", "prepare_two_person_review"]
    }
  },
  {
    templateId: "generator_runtime_tuning_template",
    name: "Generator runtime tuning playbook",
    description: "Prepare manual runtime-tuning guidance for low-load generator use.",
    actionType: "generator_runtime_tuning",
    dispatchChannel: "manual_playbook",
    allowedExecutionModes: ["dry_run", "manual"],
    enabled: true,
    requiresConfirmation: false,
    commandBlueprint: {
      steps: ["inspect_generator_schedule", "reduce_low_load_runtime", "verify_fuel_savings"]
    }
  },
  {
    templateId: "connectivity_check_template",
    name: "Connectivity check command set",
    description: "Simulate gateway/device connectivity diagnostics.",
    actionType: "connectivity_check",
    dispatchChannel: "simulator",
    allowedExecutionModes: ["dry_run", "manual"],
    enabled: true,
    requiresConfirmation: false,
    commandBlueprint: {
      steps: ["ping_gateway", "check_last_heartbeat", "restart_telemetry_service"]
    }
  },
  {
    templateId: "electrical_inspection_template",
    name: "Electrical inspection playbook",
    description: "Generate a manual electrical inspection work package.",
    actionType: "electrical_inspection",
    dispatchChannel: "manual_playbook",
    allowedExecutionModes: ["dry_run", "manual"],
    enabled: true,
    requiresConfirmation: false,
    commandBlueprint: {
      steps: ["capture_phase_measurements", "inspect_sensor_wiring", "review_protection_devices"]
    }
  },
  {
    templateId: "maintenance_investigation_template",
    name: "Maintenance investigation playbook",
    description: "Prepare a maintenance investigation package for abnormal runtime drift.",
    actionType: "maintenance_investigation",
    dispatchChannel: "manual_playbook",
    allowedExecutionModes: ["dry_run", "manual"],
    enabled: true,
    requiresConfirmation: false,
    commandBlueprint: {
      steps: ["capture_runtime_baseline", "compare_recent_changes", "prepare_field_checklist"]
    }
  },
  {
    templateId: "operator_review_template",
    name: "Operator review playbook",
    description: "Create a minimal operator-review package for uncategorized recommendations.",
    actionType: "operator_review",
    dispatchChannel: "manual_playbook",
    allowedExecutionModes: ["dry_run", "manual"],
    enabled: true,
    requiresConfirmation: false,
    commandBlueprint: {
      steps: ["review_context", "confirm_owner", "record_next_step"]
    }
  }
];
