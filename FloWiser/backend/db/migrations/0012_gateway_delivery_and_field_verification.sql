CREATE TABLE IF NOT EXISTS gateway_agents (
  agent_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT,
  display_name TEXT NOT NULL,
  shared_key TEXT NOT NULL,
  supported_action_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gateway_agents_tenant_site
  ON gateway_agents(tenant_id, site_id, is_active);

CREATE TABLE IF NOT EXISTS gateway_dispatch_receipts (
  receipt_id UUID PRIMARY KEY,
  dispatch_id UUID NOT NULL REFERENCES command_dispatches(dispatch_id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES gateway_agents(agent_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gateway_dispatch_receipts_dispatch_time
  ON gateway_dispatch_receipts(dispatch_id, created_at DESC);

CREATE TABLE IF NOT EXISTS field_verification_measurements (
  measurement_id UUID PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES recommendations(action_id) ON DELETE CASCADE,
  execution_id UUID REFERENCES action_execution_requests(execution_id) ON DELETE SET NULL,
  dispatch_id UUID REFERENCES command_dispatches(dispatch_id) ON DELETE SET NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT,
  measurement_basis TEXT NOT NULL,
  baseline_kwh_per_day NUMERIC(12,2) NOT NULL DEFAULT 0,
  observed_kwh_per_day NUMERIC(12,2) NOT NULL DEFAULT 0,
  baseline_diesel_liters_per_day NUMERIC(12,2) NOT NULL DEFAULT 0,
  observed_diesel_liters_per_day NUMERIC(12,2) NOT NULL DEFAULT 0,
  energy_tariff NUMERIC(12,2) NOT NULL DEFAULT 0,
  diesel_cost_per_liter NUMERIC(12,2) NOT NULL DEFAULT 0,
  measured_by TEXT NOT NULL,
  note TEXT,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_verification_measurements_action_time
  ON field_verification_measurements(action_id, measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_field_verification_measurements_site_time
  ON field_verification_measurements(site_id, measured_at DESC);
