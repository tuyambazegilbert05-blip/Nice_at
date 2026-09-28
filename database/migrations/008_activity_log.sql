CREATE TABLE IF NOT EXISTS activity_log (
  id bigserial PRIMARY KEY,
  actor_id text REFERENCES users(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('ADMIN', 'MANAGER', 'STAFF', 'VIEWER')),
  action text NOT NULL,
  target_type text,
  target_id text,
  target_label text,
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON activity_log(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS activity_log_actor_id_idx ON activity_log(actor_id, created_at DESC);
