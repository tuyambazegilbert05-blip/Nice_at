CREATE TABLE IF NOT EXISTS communication_email_images (
  token text PRIMARY KEY,
  file_name text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp')),
  image_data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS communication_email_images_created_idx
  ON communication_email_images(created_at);
