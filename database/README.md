# PostgreSQL data store

The new Custom Forms section stores its data independently from Scientific Sessions and their attendance tables. Stand-alone forms, immutable published snapshots, submissions, rate-limit buckets, and confirmation-email attempts each use separate tables.

PostgreSQL is the persistent source of truth for staff accounts and profiles, invitations, password resets, sessions, session form questions, attendee check-ins, email-update consent, email delivery records, and staff activity. Application code accesses it through the server-only pool in `src/lib/database/client.ts`; browser code calls Next.js API routes instead of connecting to the database.

## Initialize a database

1. Create a PostgreSQL database and a least-privilege application role with permission to create and update objects in its schema.
2. Put the connection string in `.env.local` as `DATABASE_URL` (copy `.env.example` as a starting point). For Supabase on an IPv4-only network, use **Project → Connect → Session pooler** (port `5432`) instead of the direct `db.<project>.supabase.co` URL, which requires IPv6 unless IPv4 connectivity is enabled. Set `DATABASE_SSL=true` for the hosted connection. If certificate verification reports a self-signed chain, download the project CA certificate under **Project Settings → Database → SSL Configuration** and set `DATABASE_SSL_CA_FILE` to its path.
3. Run `npm run db:migrate` to apply the SQL files in `database/migrations` in order. The command records applied migration names and can safely be run again.
4. Add `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, and a unique `INITIAL_ADMIN_PASSWORD` to `.env.local` (these are intentionally not copied into an existing `.env` automatically), then run `npm run db:seed-admin`. Passwords must have at least 6 characters, uppercase and lowercase letters, a number, and a symbol. The password is stored as a salted PBKDF2 hash. Remove the password variable after creating the account. Shell variables must be exported for npm child processes to receive them.
5. Start the app. Sign-in verifies the submitted password against the database, and session creation, check-in, staff queries, and exports all read or write PostgreSQL.

`npm run db:migrate` verifies the required tables exist when it completes. It needs a reachable PostgreSQL server and a database that already exists; it does not create the server or database itself.

For Vercel deployments, configure a long random `CRON_SECRET` environment variable. The daily scheduled endpoint uses it to authorize the one-year activity retention cleanup.

## Data model

- `users`: normalized unique staff email, password hash, role, active state, timestamps, and server-persisted onboarding state. Migration 010 marks pre-existing accounts complete while new accounts default to incomplete; migration 011 records whether the first tour was skipped or completed.
- `users.avatar_url`: optional profile image link.
- `sessions`: schedule, unique cryptographic public token, status, duplicate policy, creator, and temporary attendance-extension expiry.
- `session_questions`: ordered form definitions for each session.
- `custom_forms`: stand-alone public forms with independent event details, server-saved drafts, stable public tokens, separate draft/published configurations, and response opening/closing timestamps. These rows do not reference `sessions`. Migration 013 backfills existing response windows and adds an index for published schedule lookups.
- `custom_form_versions`: immutable published field snapshots for historical responses.
- `custom_form_submissions`: private responses keyed to their original form version, with normalized email and idempotency protection.
- `custom_form_email_deliveries`: provider-acceptance/failure attempts for form confirmation messages. A provider acceptance is not evidence of inbox delivery.
- `custom_form_email_templates`: administrator-editable default confirmation subject, heading, and outreach message.
- `custom_form_rate_limits`: hashed-client rate-limit buckets for public form submissions.
- `attendance_records`: private attendee details, normalized email, submitted responses, and UTC timestamp.
- `user_invitations`: hashed, seven-day staff invitation links and acceptance timestamps.
- `email_delivery_log`: recipient, category, provider result, and timestamp for each attempt; message bodies and API secrets are not stored.
- `password_reset_tokens`: hashed, expiring, single-use password recovery tokens.
- `activity_log`: actor and role snapshots, meaningful staff page visits and business actions, related record, safe metadata, and timestamp. Staff can review their own history; administrators can review all staff activity. Passwords, tokens, message bodies, recipient lists, and submitted answers are excluded.
- Activity history is limited to 25 entries per page with a “Next 25” control. Migration 015 removes records already older than one year; the Vercel daily cron at 03:00 UTC continues this cleanup. Set `CRON_SECRET` in the deployment environment so only the scheduler can run it.
- `attendance_records.email_updates_opt_in`: optional consent used to include attendees in the Communications contact picker.
- `schema_migrations`: applied migration ledger.

Attendance submission locks its session while checking duplicate policy and inserting a record, preventing simultaneous duplicate submissions from racing. Records are retained when sessions are closed; sessions are never deleted by attendance operations.
