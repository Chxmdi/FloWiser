CREATE TABLE IF NOT EXISTS command_templates (
  template_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL,
  dispatch_channel TEXT NOT NULL,
  allowed_execution_modes JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  requires_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  command_blueprint JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_command_templates_action_type
  ON command_templates(action_type, enabled);

CREATE TABLE IF NOT EXISTS command_dispatches (
  dispatch_id UUID PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES action_execution_requests(execution_id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES recommendations(action_id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES command_templates(template_id),
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT,
  dispatch_channel TEXT NOT NULL,
  execution_mode TEXT NOT NULL,
  dispatch_status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  note TEXT,
  command_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  simulation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_summary TEXT,
  requested_at TIMESTAMPTZ NOT NULL,
  dispatched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_command_dispatches_execution_status
  ON command_dispatches(execution_id, dispatch_status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_command_dispatches_site_status
  ON command_dispatches(site_id, dispatch_status, requested_at DESC);
