# Database Design — NiCE Club Attendance Platform

## 1. Overview

PostgreSQL is the production source of truth. The application uses parameterized SQL through the `pg` connection pool in `src/lib/database/client.ts`; it does not use Prisma. Schema changes are applied in order from `database/migrations` with `npm run db:migrate`.

## 2. Entity relationships

```mermaid
erDiagram
    users ||--o{ sessions : creates
    users ||--o{ user_invitations : invites
    users ||--o{ activity_log : performs
    users ||--o{ password_reset_tokens : requests
    sessions ||--o{ session_questions : defines
    sessions ||--o{ attendance_records : receives
    attendance_records ||--o{ email_delivery_log : may_reference

    users {
        text id PK
        text name
        text email UK
        text password_hash
        text role
        boolean is_active
        text avatar_url
        timestamptz created_at
        timestamptz updated_at
    }

    sessions {
        text id PK
        text title
        text description
        text type
        text status
        text location
        date session_date
        time start_time
        time end_time
        timestamptz attendance_opens
        timestamptz attendance_closes
        timestamptz attendance_override_until
        text public_token UK
        text duplicate_policy
        text created_by_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    session_questions {
        text id PK
        text session_id FK
        text label
        text description
        text question_type
        boolean required
        jsonb options
        integer display_order
    }

    attendance_records {
        text id PK
        text session_id FK
        text full_name
        text email
        text phone
        text faculty
        text program
        text year_of_study
        text participant_type
        text key_takeaway
        text feedback
        jsonb custom_responses
        jsonb metadata
        boolean email_updates_opt_in
        timestamptz submitted_at
    }

    user_invitations {
        text id PK
        text email
        text role
        text token_hash UK
        text invited_by_id FK
        timestamptz expires_at
        timestamptz accepted_at
    }

    password_reset_tokens {
        text id PK
        text user_id FK
        text token_hash UK
        timestamptz expires_at
        timestamptz used_at
    }

    email_delivery_log {
        text id PK
        text recipient_email
        text subject
        text category
        text status
        text sent_by_id FK
        text attendance_id FK
        timestamptz created_at
    }

    activity_log {
        bigint id PK
        text actor_id FK
        text actor_name
        text actor_role
        text action
        text target_type
        text target_id
        text target_label
        text summary
        jsonb details
        timestamptz created_at
    }
```

The email log stores delivery metadata, not email message bodies or provider secrets. Activity rows keep actor name and role snapshots so an audit entry remains readable if an account is later removed. Temporary attendance extensions expire using the database timestamp; check-in validates the normal window or active override while holding the session row lock.

## 3. Data integrity and indexes

- Staff emails are unique and normalized before lookup or persistence.
- Public attendance tokens are random and unique; public URLs do not expose sequential database IDs.
- Attendance rows reference sessions with `ON DELETE RESTRICT`. Session deletion explicitly removes attendance inside a transaction; session questions cascade with their session, while linked email-log history is retained with a null attendance reference.
- Password-reset and invitation tokens are hashed before storage and expire.
- Check-in and session mutations use server-side role checks. Activity-log reads are admin-only.
- Session status/date, attendance session/submission time, email delivery time, activity time/actor, and token lookup fields have supporting indexes in the migration set.

## 4. Duplicate attendance policy

Each session chooses one policy:

1. `PREVENT_BY_EMAIL` (default): reject a repeat email for the same session.
2. `PREVENT_BY_EMAIL_AND_PHONE`: reject a matching email or phone for the same session.
3. `ALLOW_DUPLICATES`: accept repeat submissions.

The server locks the session row while it evaluates the current attendance window, checks duplicates, and inserts a check-in. This serializes competing submissions and an administrator closing a temporary extension.
