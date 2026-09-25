# Database Design — NiCE Club Attendance Platform

## 1. Overview

The persistent data layer is implemented in PostgreSQL and modeled via Prisma ORM. The schema models the complete lifecycle of organizers, scientific sessions, public attendance entries, configurable custom questions, and administrative audit trails.

## 2. Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Session : "creates"
    User ||--o{ AuditLog : "triggers"
    Session ||--o{ Attendance : "receives"
    Session ||--o{ Question : "contains"
    
    User {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role "ADMIN, MANAGER, STAFF, VIEWER"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Session {
        string id PK
        string title
        string description
        enum type "LECTURE, WORKSHOP, SEMINAR, SCHOOL_OUTREACH, UNIVERSITY_SESSION, CONFERENCE, WEBINAR, TRAINING, YOUTH_EVENT, OTHER"
        string location
        datetime date
        string startTime
        string endTime
        datetime attendanceOpens
        datetime attendanceCloses
        enum status "DRAFT, UPCOMING, OPEN, CLOSING_SOON, CLOSED"
        string publicToken UK
        enum duplicatePolicy "PREVENT_BY_EMAIL, PREVENT_BY_EMAIL_AND_PHONE, ALLOW_DUPLICATES"
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }

    Attendance {
        string id PK
        string sessionId FK
        string fullName
        string email
        string phone
        string faculty
        string program
        string yearOfStudy
        string participantType
        string keyTakeaway
        string feedback
        json customResponses
        json metadata
        datetime submittedAt
    }

    Question {
        string id PK
        string sessionId FK
        string label
        string description
        enum type "TEXT, TEXTAREA, EMAIL, PHONE, NUMBER, SELECT, RADIO, CHECKBOX"
        boolean required
        json options
        int order
        datetime createdAt
    }

    AuditLog {
        string id PK
        string userId FK
        string action
        string entity
        string entityId
        json metadata
        datetime createdAt
    }
```

## 3. Indexing Strategy

To guarantee rapid query response times under high-volume simultaneous check-in conditions:

- `Session.publicToken`: Unique index for \(O(1)\) public QR verification lookup.
- `Session.status` & `Session.date`: Composite index for rapid dashboard filtering.
- `Attendance.sessionId` & `Attendance.email`: Index for duplicate attendance verification and session roster display.
- `Attendance.submittedAt`: Index for real-time timeline analytics.
- `User.email`: Unique index for authentication.

## 4. Duplicate Prevention Logic

Configured per-session:
1. `PREVENT_BY_EMAIL` (default): Checks `(sessionId, normalizedEmail)`.
2. `PREVENT_BY_EMAIL_AND_PHONE`: Checks `(sessionId, normalizedEmail)` OR `(sessionId, normalizedPhone)`.
3. `ALLOW_DUPLICATES`: Permits multiple participations (e.g. continuous multi-day or repeated lab entries).
