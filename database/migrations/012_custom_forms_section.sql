CREATE TABLE IF NOT EXISTS custom_forms (
  id text PRIMARY KEY,
  public_token text NOT NULL UNIQUE,
  title text NOT NULL,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
  draft_config jsonb NOT NULL,
  published_config jsonb,
  draft_revision integer NOT NULL DEFAULT 1 CHECK (draft_revision > 0),
  published_version integer NOT NULL DEFAULT 0 CHECK (published_version >= 0),
  created_by_id text REFERENCES users(id) ON DELETE SET NULL,
  updated_by_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS custom_forms_created_idx ON custom_forms(created_at DESC);

CREATE TABLE IF NOT EXISTS custom_form_versions (
  form_id text NOT NULL REFERENCES custom_forms(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  config jsonb NOT NULL,
  published_by_id text REFERENCES users(id) ON DELETE SET NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (form_id, version)
);

CREATE TABLE IF NOT EXISTS custom_form_submissions (
  id text PRIMARY KEY,
  form_id text NOT NULL REFERENCES custom_forms(id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  email text NOT NULL,
  responses jsonb NOT NULL,
  form_version integer NOT NULL,
  form_snapshot jsonb NOT NULL,
  idempotency_key text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS custom_form_submissions_form_idx ON custom_form_submissions(form_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS custom_form_submissions_email_idx ON custom_form_submissions(form_id, email);
CREATE UNIQUE INDEX IF NOT EXISTS custom_form_submission_idempotency_idx
  ON custom_form_submissions(form_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS custom_form_submission_email_unique_idx
  ON custom_form_submissions(form_id, email);

CREATE TABLE IF NOT EXISTS custom_form_rate_limits (
  form_id text NOT NULL REFERENCES custom_forms(id) ON DELETE CASCADE,
  client_hash text NOT NULL,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  PRIMARY KEY (form_id, client_hash)
);

CREATE TABLE IF NOT EXISTS custom_form_email_deliveries (
  id text PRIMARY KEY,
  submission_id text NOT NULL REFERENCES custom_form_submissions(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('SENDING', 'ACCEPTED', 'FAILED')),
  provider_message_id text,
  attempt_count integer NOT NULL DEFAULT 1,
  safe_error text,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS custom_form_email_submission_idx
  ON custom_form_email_deliveries(submission_id, attempted_at DESC);

CREATE TABLE IF NOT EXISTS custom_form_email_templates (
  id text PRIMARY KEY,
  subject text NOT NULL,
  heading text NOT NULL,
  body text NOT NULL,
  updated_by_id text REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO custom_form_email_templates(id, subject, heading, body)
VALUES (
  'default',
  'Attendance Confirmed — {{sessionTitle}} | NiCE Club Rwanda',
  'Thank you for being with us, {{firstName}}',
  E'Thank you for participating in {{sessionTitle}} with NiCE Club Rwanda. Your attendance has been successfully recorded.\n\nSession details\nDate: {{sessionDate}}\nTime: {{sessionTime}} CAT\nLocation: {{sessionLocation}}\n\nWe are glad to have you as part of a community exploring nuclear science, clean energy, and the opportunities these fields create for Rwanda and Africa.\n\nA message from our outreach team\nThank you for learning and engaging with NiCE Club Rwanda. We believe informed conversations and youth participation are essential to building a better understanding of nuclear science and its peaceful applications.\n\nWe invite you to stay connected, take part in future learning opportunities, and continue exploring how science and innovation can contribute to our shared future.\n\nWe look forward to seeing you at another NiCE activity.\n\nWarm regards,\nNiCE Club Rwanda Outreach Team\nNuclear is Clean Energy'
)
ON CONFLICT (id) DO NOTHING;
