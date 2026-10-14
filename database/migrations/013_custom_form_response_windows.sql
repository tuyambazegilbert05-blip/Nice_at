ALTER TABLE custom_forms
  ADD COLUMN IF NOT EXISTS response_opens_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_closes_at timestamptz;

UPDATE custom_forms
SET response_opens_at = COALESCE(response_opens_at, created_at),
    response_closes_at = COALESCE(
      response_closes_at,
      (event_date + end_time) AT TIME ZONE 'Africa/Kigali'
    );

CREATE INDEX IF NOT EXISTS custom_forms_response_window_idx
  ON custom_forms(status, response_opens_at, response_closes_at);
