ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS email_updates_opt_in boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS user_invitations (
  id text PRIMARY KEY,
  email text NOT NULL,
  name text,
  role text NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF', 'VIEWER')),
  token_hash text NOT NULL UNIQUE,
  invited_by_id text REFERENCES users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_invitations_email_idx ON user_invitations(email, created_at DESC);

CREATE TABLE IF NOT EXISTS email_delivery_log (
  id text PRIMARY KEY,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN ('INVITATION', 'ATTENDANCE_THANK_YOU', 'COMMUNICATION')),
  status text NOT NULL CHECK (status IN ('SENT', 'FAILED')),
  provider_message_id text,
  sent_by_id text REFERENCES users(id) ON DELETE SET NULL,
  attendance_id text REFERENCES attendance_records(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_delivery_log_created_idx ON email_delivery_log(created_at DESC);
