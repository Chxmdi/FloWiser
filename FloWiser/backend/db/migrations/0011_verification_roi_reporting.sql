CREATE TABLE IF NOT EXISTS verification_snapshots (
  snapshot_id UUID PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES recommendations(action_id) ON DELETE CASCADE,
  execution_id UUID REFERENCES action_execution_requests(execution_id) ON DELETE SET NULL,
  dispatch_id UUID REFERENCES command_dispatches(dispatch_id) ON DELETE SET NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT,
  verification_status TEXT NOT NULL,
  verification_basis TEXT NOT NULL,
  expected_monthly_savings NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_diesel_savings NUMERIC(12,2) NOT NULL DEFAULT 0,
  realized_monthly_savings NUMERIC(12,2) NOT NULL DEFAULT 0,
  realized_diesel_savings NUMERIC(12,2) NOT NULL DEFAULT 0,
  realization_rate NUMERIC(6,4) NOT NULL DEFAULT 0,
  implementation_cost_proxy NUMERIC(12,2) NOT NULL DEFAULT 0,
  roi_score NUMERIC(12,2) NOT NULL DEFAULT 0,
  payback_months NUMERIC(12,2),
  verification_note TEXT,
  verified_by TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_snapshots_action_time
  ON verification_snapshots(action_id, measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_snapshots_site_time
  ON verification_snapshots(site_id, measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_snapshots_status_time
  ON verification_snapshots(verification_status, measured_at DESC);
