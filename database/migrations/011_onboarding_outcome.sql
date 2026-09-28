ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_outcome text;

UPDATE users
SET onboarding_outcome = CASE
  WHEN has_completed_onboarding THEN 'completed'
  ELSE 'not_started'
END
WHERE onboarding_outcome IS NULL;

ALTER TABLE users
  ALTER COLUMN onboarding_outcome SET DEFAULT 'not_started',
  ALTER COLUMN onboarding_outcome SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_onboarding_outcome_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_onboarding_outcome_check
      CHECK (onboarding_outcome IN ('not_started', 'skipped', 'completed'));
  END IF;
END $$;
