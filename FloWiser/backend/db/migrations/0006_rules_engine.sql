CREATE TABLE IF NOT EXISTS rules_config (
  rule_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  scope TEXT NOT NULL DEFAULT 'site',
  version TEXT NOT NULL,
  threshold_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rule_execution_traces (
  trace_id UUID PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES rules_config(rule_id) ON DELETE CASCADE,
  rule_version TEXT NOT NULL,
  matched BOOLEAN NOT NULL,
  severity TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  event_id UUID NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  executed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_config_enabled
  ON rules_config(enabled, category);

CREATE INDEX IF NOT EXISTS idx_rule_execution_traces_site_time
  ON rule_execution_traces(site_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_rule_execution_traces_rule_time
  ON rule_execution_traces(rule_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_rule_execution_traces_matched
  ON rule_execution_traces(matched, executed_at DESC);
