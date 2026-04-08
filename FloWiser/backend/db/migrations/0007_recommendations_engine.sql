CREATE TABLE IF NOT EXISTS recommendations (
  action_id UUID PRIMARY KEY,
  recommendation_key TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT,
  event_id UUID NOT NULL,
  rule_id TEXT NOT NULL,
  root_cause_key TEXT NOT NULL,
  root_cause_label TEXT NOT NULL,
  likely_cause TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  action_type TEXT NOT NULL,
  recommendation_mode TEXT NOT NULL,
  approval_status TEXT NOT NULL,
  status TEXT NOT NULL,
  automation_possible BOOLEAN NOT NULL DEFAULT FALSE,
  effort_score INTEGER NOT NULL,
  confidence_score INTEGER NOT NULL,
  savings_score INTEGER NOT NULL,
  diesel_score INTEGER NOT NULL,
  uptime_impact_score INTEGER NOT NULL,
  failure_risk_score INTEGER NOT NULL,
  priority_score NUMERIC(10,2) NOT NULL,
  expected_monthly_savings NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_diesel_savings NUMERIC(12,2) NOT NULL DEFAULT 0,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejected_by TEXT,
  rejected_at TIMESTAMPTZ,
  approval_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_site_status
  ON recommendations(site_id, status, priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_rule_status
  ON recommendations(rule_id, status, priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_mode_status
  ON recommendations(recommendation_mode, approval_status, priority_score DESC);
