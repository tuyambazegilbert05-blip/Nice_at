# Data Flow & Lifecycle — NiCE Club Attendance Platform

## 1. End-to-End Operational Lifecycle

The system coordinates between organizers creating scientific events and participants checking in over mobile devices:

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff / Admin
    participant Server as Next.js Server & DB
    actor Attendee as Participant / Student
    
    Staff->>Server: 1. Create & configure session (Title, Window, Questions)
    Server-->>Staff: 2. Session created with Cryptographic publicToken
    Staff->>Server: 3. Publish Session & Open Attendance
    Staff->>Staff: 4. Display or Print Branded QR Poster
    
    Attendee->>Server: 5. Scans QR -> GET /attend/[token]
    Server->>Server: 6. Validate token, publish status, & check-in window (Africa/Kigali)
    Server-->>Attendee: 7. Render dynamic mobile check-in form
    
    Attendee->>Server: 8. Submit attendance (Name, Email, Phone, Academic Info, Reflection)
    Server->>Server: 9. Server Zod validation & duplicate policy check
    Server->>Server: 10. Persist Attendance Record & update metrics
    Server-->>Attendee: 11. Return Success + Trigger energetic confirmation
    
    Server-->>Staff: 12. Dashboard updates live counter & analytics
```

## 2. Status Derivation Logic

Session status is determined dynamically according to the current timestamp in `Africa/Kigali`:

1. **DRAFT**: Session has not been published by an organizer. Public token rejects submissions.
2. **UPCOMING**: Published, but current time is before `attendanceOpens`.
3. **OPEN**: Current time is between `attendanceOpens` and `attendanceCloses`.
4. **CLOSING_SOON**: Open, with 15 minutes or less remaining until `attendanceCloses`.
5. **CLOSED**: Current time is past `attendanceCloses` or manually toggled closed by staff.

Submissions to sessions in any state other than `OPEN` or `CLOSING_SOON` are safely rejected with descriptive guidance.
