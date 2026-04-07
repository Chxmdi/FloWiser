ALTER TABLE device_state
  ADD COLUMN IF NOT EXISTS quality_status TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS quality_score INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS quality_flags_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_issue_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE site_state
  ADD COLUMN IF NOT EXISTS quality_status TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS quality_score INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS quality_flags_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_issue_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE branch_state
  ADD COLUMN IF NOT EXISTS quality_status TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS quality_score INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS quality_flags_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_issue_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_normalized_telemetry_quality_status
  ON normalized_telemetry_events ((quality->>'status'));

CREATE INDEX IF NOT EXISTS idx_normalized_telemetry_quality_score
  ON normalized_telemetry_events (((quality->>'score')::INTEGER));
