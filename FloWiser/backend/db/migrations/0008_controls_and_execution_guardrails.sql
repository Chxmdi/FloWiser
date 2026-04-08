CREATE TABLE IF NOT EXISTS control_approval_policies (
  policy_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  recommendation_mode TEXT NOT NULL,
  allowed_execution_modes JSONB NOT NULL DEFAULT '[]'::jsonb,
  min_execution_approvals INTEGER NOT NULL DEFAULT 0,
  requires_two_person BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  max_open_critical_alerts INTEGER NOT NULL DEFAULT 0,
  min_confidence_score INTEGER NOT NULL DEFAULT 0,
  max_recommendation_age_hours INTEGER NOT NULL DEFAULT 168,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS action_execution_requests (
  execution_id UUID PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES recommendations(action_id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT,
  action_type TEXT NOT NULL,
  recommendation_mode TEXT NOT NULL,
  execution_mode TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  note TEXT,
  policy_id TEXT REFERENCES control_approval_policies(policy_id),
  guardrail_outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_summary TEXT,
  requested_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_execution_requests_site_status
  ON action_execution_requests(site_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_execution_requests_action_status
  ON action_execution_requests(action_id, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS action_execution_approvals (
  approval_id UUID PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES action_execution_requests(execution_id) ON DELETE CASCADE,
  approver TEXT NOT NULL,
  role TEXT,
  note TEXT,
  approved_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (execution_id, approver)
);

CREATE INDEX IF NOT EXISTS idx_action_execution_approvals_execution
  ON action_execution_approvals(execution_id, approved_at DESC);
