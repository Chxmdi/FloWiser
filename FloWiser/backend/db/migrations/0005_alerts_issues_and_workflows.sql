CREATE TABLE IF NOT EXISTS alerts (
  alert_id UUID PRIMARY KEY,
  alert_key TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  state TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT,
  event_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  correlation_key TEXT NOT NULL,
  dedupe_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  suppressed_until TIMESTAMPTZ,
  issue_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_alerts_active_key
  ON alerts(alert_key)
  WHERE state IN ('open', 'suppressed');

CREATE INDEX IF NOT EXISTS idx_alerts_site_state
  ON alerts(site_id, state, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS issues (
  issue_id UUID PRIMARY KEY,
  source_alert_id UUID REFERENCES alerts(alert_id),
  source_alert_key TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  assignee TEXT,
  auto_resolvable BOOLEAN NOT NULL DEFAULT FALSE,
  sla_due_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_site_status
  ON issues(site_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_issues_source_alert_key
  ON issues(source_alert_key);

CREATE TABLE IF NOT EXISTS issue_comments (
  comment_id UUID PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES issues(issue_id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  comment_type TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_log (
  notification_id UUID PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  template_key TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_checklists (
  checklist_id UUID PRIMARY KEY,
  issue_id UUID REFERENCES issues(issue_id) ON DELETE SET NULL,
  site_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_tasks (
  task_id UUID PRIMARY KEY,
  issue_id UUID REFERENCES issues(issue_id) ON DELETE SET NULL,
  site_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  assignee TEXT,
  evidence_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  rollback_note TEXT,
  completion_note TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_visits (
  visit_id UUID PRIMARY KEY,
  site_id TEXT NOT NULL,
  issue_id UUID REFERENCES issues(issue_id) ON DELETE SET NULL,
  engineer TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  summary TEXT NOT NULL,
  evidence_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
