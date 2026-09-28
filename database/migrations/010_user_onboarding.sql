ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean NOT NULL DEFAULT true;

-- Backfill existing accounts as complete while new registrations start fresh.
ALTER TABLE users
  ALTER COLUMN has_completed_onboarding SET DEFAULT false;
