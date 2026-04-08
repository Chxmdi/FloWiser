CREATE TABLE IF NOT EXISTS external_infra_profiles (
  profile_id TEXT PRIMARY KEY,
  profile_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  connection_mode TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_infra_profiles_type_enabled
  ON external_infra_profiles(profile_type, enabled);

CREATE TABLE IF NOT EXISTS telemetry_metric_points (
  metric_id UUID PRIMARY KEY,
  metric_key TEXT NOT NULL,
  labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  metric_value NUMERIC(18,4) NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_metric_points_key_time
  ON telemetry_metric_points(metric_key, captured_at DESC);

CREATE TABLE IF NOT EXISTS telemetry_log_entries (
  log_id UUID PRIMARY KEY,
  severity TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_log_entries_source_time
  ON telemetry_log_entries(source, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_log_entries_severity_time
  ON telemetry_log_entries(severity, captured_at DESC);

CREATE TABLE IF NOT EXISTS trace_spans (
  span_id UUID PRIMARY KEY,
  trace_id TEXT NOT NULL,
  parent_span_id TEXT,
  span_name TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trace_spans_trace_time
  ON trace_spans(trace_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_trace_spans_source_time
  ON trace_spans(source, started_at DESC);

CREATE TABLE IF NOT EXISTS observability_alert_policies (
  policy_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  signal_key TEXT NOT NULL,
  comparator TEXT NOT NULL,
  threshold NUMERIC(18,4) NOT NULL,
  severity TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observability_alert_policies_signal_enabled
  ON observability_alert_policies(signal_key, enabled);

CREATE TABLE IF NOT EXISTS observability_alert_events (
  alert_event_id UUID PRIMARY KEY,
  policy_id TEXT NOT NULL REFERENCES observability_alert_policies(policy_id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_observability_alert_events_status_time
  ON observability_alert_events(status, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_observability_alert_events_policy_time
  ON observability_alert_events(policy_id, triggered_at DESC);
