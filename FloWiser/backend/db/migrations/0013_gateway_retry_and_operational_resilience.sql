ALTER TABLE command_dispatches
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dead_letter_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_command_dispatches_retry_window
  ON command_dispatches(dispatch_status, next_attempt_at, attempt_count);

CREATE TABLE IF NOT EXISTS dispatch_operation_incidents (
  incident_id UUID PRIMARY KEY,
  dispatch_id UUID REFERENCES command_dispatches(dispatch_id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES gateway_agents(agent_id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dispatch_operation_incidents_dispatch_time
  ON dispatch_operation_incidents(dispatch_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dispatch_operation_incidents_status_time
  ON dispatch_operation_incidents(status, created_at DESC);

CREATE TABLE IF NOT EXISTS dispatch_dead_letters (
  dead_letter_id UUID PRIMARY KEY,
  dispatch_id UUID NOT NULL UNIQUE REFERENCES command_dispatches(dispatch_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_dead_letters_time
  ON dispatch_dead_letters(created_at DESC);
