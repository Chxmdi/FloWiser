CREATE TABLE IF NOT EXISTS raw_event_archive (
  raw_event_id UUID PRIMARY KEY,
  protocol TEXT NOT NULL,
  topic TEXT NOT NULL,
  decoder_hint JSONB,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL,
  retention_until TIMESTAMPTZ NOT NULL,
  parse_status TEXT NOT NULL,
  parse_error TEXT,
  normalized_event_id UUID,
  decoder_id TEXT,
  raw_payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_event_archive_device_time
  ON raw_event_archive(device_id, archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_event_archive_tenant_site_time
  ON raw_event_archive(tenant_id, site_id, archived_at DESC);

CREATE TABLE IF NOT EXISTS normalized_telemetry_events (
  event_id UUID PRIMARY KEY,
  raw_event_id UUID REFERENCES raw_event_archive(raw_event_id),
  schema_version TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  meter_timestamp TIMESTAMPTZ NOT NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  source_protocol TEXT NOT NULL,
  source_topic TEXT NOT NULL,
  decoder_id TEXT NOT NULL,
  decoder_version TEXT NOT NULL,
  decoder_audit_id UUID NOT NULL,
  sequence_no BIGINT,
  metrics JSONB NOT NULL,
  status JSONB NOT NULL,
  quality JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_normalized_telemetry_device_time
  ON normalized_telemetry_events(device_id, meter_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_normalized_telemetry_site_time
  ON normalized_telemetry_events(site_id, meter_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_normalized_telemetry_raw_event_id
  ON normalized_telemetry_events(raw_event_id);

CREATE TABLE IF NOT EXISTS device_state (
  device_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  latest_event_id UUID NOT NULL,
  latest_raw_event_id UUID NOT NULL,
  latest_telemetry_at TIMESTAMPTZ NOT NULL,
  last_received_at TIMESTAMPTZ NOT NULL,
  is_online BOOLEAN NOT NULL,
  generator_running BOOLEAN,
  grid_available BOOLEAN,
  health_score INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_state (
  site_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  latest_event_id UUID NOT NULL,
  latest_telemetry_at TIMESTAMPTZ NOT NULL,
  last_received_at TIMESTAMPTZ NOT NULL,
  is_online BOOLEAN NOT NULL,
  generator_running BOOLEAN,
  grid_available BOOLEAN,
  health_score INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branch_state (
  branch_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  latest_event_id UUID NOT NULL,
  latest_telemetry_at TIMESTAMPTZ NOT NULL,
  last_received_at TIMESTAMPTZ NOT NULL,
  is_online BOOLEAN NOT NULL,
  generator_running BOOLEAN,
  grid_available BOOLEAN,
  health_score INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry_rollup_1m (
  device_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  bucket_start TIMESTAMPTZ NOT NULL,
  sample_count INTEGER NOT NULL,
  sum_kw DOUBLE PRECISION NOT NULL,
  min_kw DOUBLE PRECISION NOT NULL,
  max_kw DOUBLE PRECISION NOT NULL,
  last_kw DOUBLE PRECISION NOT NULL,
  first_meter_timestamp TIMESTAMPTZ NOT NULL,
  last_meter_timestamp TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (device_id, bucket_start)
);

CREATE TABLE IF NOT EXISTS telemetry_rollup_5m (LIKE telemetry_rollup_1m INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS telemetry_rollup_1h (LIKE telemetry_rollup_1m INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS telemetry_rollup_1d (LIKE telemetry_rollup_1m INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);

CREATE INDEX IF NOT EXISTS idx_telemetry_rollup_1m_site_time ON telemetry_rollup_1m(site_id, bucket_start DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_rollup_5m_site_time ON telemetry_rollup_5m(site_id, bucket_start DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_rollup_1h_site_time ON telemetry_rollup_1h(site_id, bucket_start DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_rollup_1d_site_time ON telemetry_rollup_1d(site_id, bucket_start DESC);
