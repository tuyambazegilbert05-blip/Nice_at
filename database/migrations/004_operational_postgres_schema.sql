CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF', 'VIEWER')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL,
  status text NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('DRAFT', 'UPCOMING', 'OPEN', 'CLOSING_SOON', 'CLOSED')),
  location text NOT NULL,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  attendance_opens timestamptz NOT NULL,
  attendance_closes timestamptz NOT NULL,
  public_token text NOT NULL UNIQUE,
  duplicate_policy text NOT NULL DEFAULT 'PREVENT_BY_EMAIL' CHECK (duplicate_policy IN ('ALLOW_DUPLICATES', 'PREVENT_BY_EMAIL', 'PREVENT_BY_EMAIL_AND_PHONE')),
  created_by_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (attendance_closes > attendance_opens)
);

CREATE TABLE IF NOT EXISTS session_questions (
  id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  question_type text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  options jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  faculty text,
  program text,
  year_of_study text,
  participant_type text NOT NULL,
  key_takeaway text,
  feedback text,
  custom_responses jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- Upgrade installations that used the first draft tables before the operational schema.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_date date;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS start_time time;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_time time;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS attendance_opens timestamptz;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS attendance_closes timestamptz;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS public_token text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS duplicate_policy text NOT NULL DEFAULT 'PREVENT_BY_EMAIL';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_by_id text REFERENCES users(id) ON DELETE SET NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='scheduled_start') THEN
    UPDATE sessions SET session_date=COALESCE(session_date, scheduled_start::date),
      location=COALESCE(location, venue),
      start_time=COALESCE(start_time, scheduled_start::time), end_time=COALESCE(end_time, scheduled_end::time),
      attendance_opens=COALESCE(attendance_opens, check_in_opens_at),
      attendance_closes=COALESCE(attendance_closes, check_in_closes_at),
      public_token=COALESCE(public_token, md5(random()::text || clock_timestamp()::text)),
      status=CASE lower(status) WHEN 'scheduled' THEN 'UPCOMING' WHEN 'published' THEN 'UPCOMING'
        WHEN 'open' THEN 'OPEN' WHEN 'closed' THEN 'CLOSED' ELSE upper(status) END,
      type=upper(type)
    WHERE session_date IS NULL OR public_token IS NULL;
    ALTER TABLE sessions ALTER COLUMN scheduled_start DROP NOT NULL;
    ALTER TABLE sessions ALTER COLUMN scheduled_end DROP NOT NULL;
    ALTER TABLE sessions ALTER COLUMN check_in_opens_at DROP NOT NULL;
    ALTER TABLE sessions ALTER COLUMN check_in_closes_at DROP NOT NULL;
    ALTER TABLE sessions ALTER COLUMN venue DROP NOT NULL;
  END IF;
END $$;
UPDATE sessions SET location=COALESCE(location,'') WHERE location IS NULL;
ALTER TABLE sessions ALTER COLUMN location SET NOT NULL;
UPDATE sessions SET public_token=md5(random()::text || clock_timestamp()::text) WHERE public_token IS NULL;
ALTER TABLE sessions ALTER COLUMN session_date SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN start_time SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN end_time SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN attendance_opens SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN attendance_closes SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN public_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sessions_public_token_unique_idx ON sessions(public_token);

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS faculty text;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS program text;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS year_of_study text;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS participant_type text NOT NULL DEFAULT 'Other';
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS key_takeaway text;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS feedback text;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS custom_responses jsonb;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now();
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_records' AND column_name='participant_name') THEN
    UPDATE attendance_records SET full_name=COALESCE(full_name, participant_name), email=COALESCE(email,lower(trim(participant_email)))
      WHERE full_name IS NULL OR email IS NULL;
    ALTER TABLE attendance_records ALTER COLUMN participant_name DROP NOT NULL;
    ALTER TABLE attendance_records ALTER COLUMN participant_email DROP NOT NULL;
    ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS unique_session_email;
  END IF;
END $$;
UPDATE attendance_records SET full_name=COALESCE(full_name,'Unknown'), email=COALESCE(email,'') WHERE full_name IS NULL OR email IS NULL;
ALTER TABLE attendance_records ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE attendance_records ALTER COLUMN email SET NOT NULL;
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_session_id_fkey;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_session_id_fkey
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS sessions_status_date_idx ON sessions(status, session_date DESC);
CREATE INDEX IF NOT EXISTS attendance_session_submitted_idx ON attendance_records(session_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS attendance_email_idx ON attendance_records(email);
CREATE INDEX IF NOT EXISTS session_questions_order_idx ON session_questions(session_id, display_order);

CREATE TABLE IF NOT EXISTS schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
