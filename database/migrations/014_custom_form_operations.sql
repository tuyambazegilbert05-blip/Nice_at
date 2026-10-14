ALTER TABLE custom_forms
  ADD COLUMN IF NOT EXISTS response_override_until timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS custom_forms_response_override_until_idx
  ON custom_forms(response_override_until)
  WHERE response_override_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS custom_forms_archived_at_idx
  ON custom_forms(archived_at, created_at DESC)
  WHERE archived_at IS NOT NULL;
