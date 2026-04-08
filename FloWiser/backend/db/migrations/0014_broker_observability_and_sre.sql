CREATE TABLE IF NOT EXISTS broker_messages (
  message_id UUID PRIMARY KEY,
  topic TEXT NOT NULL,
  routing_key TEXT NOT NULL,
  dispatch_id UUID NOT NULL REFERENCES command_dispatches(dispatch_id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  device_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL,
  claim_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  acked_at TIMESTAMPTZ,
  dead_lettered_at TIMESTAMPTZ,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_broker_messages_topic_status_time
  ON broker_messages(topic, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_broker_messages_dispatch_status
  ON broker_messages(dispatch_id, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_broker_messages_site_status
  ON broker_messages(site_id, status, published_at DESC);

CREATE TABLE IF NOT EXISTS service_health_snapshots (
  snapshot_id UUID PRIMARY KEY,
  captured_by TEXT NOT NULL,
  gateway_online_count INTEGER NOT NULL DEFAULT 0,
  gateway_stale_count INTEGER NOT NULL DEFAULT 0,
  gateway_offline_count INTEGER NOT NULL DEFAULT 0,
  gateway_never_seen_count INTEGER NOT NULL DEFAULT 0,
  pending_dispatch_count INTEGER NOT NULL DEFAULT 0,
  retry_scheduled_count INTEGER NOT NULL DEFAULT 0,
  dead_letter_count INTEGER NOT NULL DEFAULT 0,
  open_incident_count INTEGER NOT NULL DEFAULT 0,
  broker_pending_count INTEGER NOT NULL DEFAULT 0,
  broker_claimed_count INTEGER NOT NULL DEFAULT 0,
  broker_dead_lettered_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_health_snapshots_time
  ON service_health_snapshots(created_at DESC);

CREATE TABLE IF NOT EXISTS sre_runbook_executions (
  runbook_execution_id UUID PRIMARY KEY,
  runbook_key TEXT NOT NULL,
  actor TEXT NOT NULL,
  status TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sre_runbook_executions_time
  ON sre_runbook_executions(created_at DESC);
