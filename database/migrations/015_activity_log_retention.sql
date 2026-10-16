-- Enforce the one-year history window for existing data and keep scheduled
-- cleanup scans efficient as the activity log grows.
DELETE FROM activity_log
WHERE created_at < now() - interval '1 year';

CREATE INDEX IF NOT EXISTS activity_log_retention_idx
  ON activity_log(created_at);
