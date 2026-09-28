ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS attendance_override_until timestamptz;

CREATE INDEX IF NOT EXISTS sessions_attendance_override_until_idx
  ON sessions(attendance_override_until)
  WHERE attendance_override_until IS NOT NULL;
