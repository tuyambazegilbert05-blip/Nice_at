# System Overview — NiCE Club Attendance Platform

## 1. Executive Summary

The **NiCE Club Rwanda Attendance Platform** is an enterprise-grade digital attendance and event intelligence operating system. Built for **NiCE Club Rwanda** (*Nuclear is Clean Energy*), the platform provides rapid session configuration, dynamic branded QR check-in, real-time participant registration, and longitudinal academic analytics.

## 2. Core Operational Architecture

```
                    ┌────────────────────────┐
                    │     NiCE Ecosystem     │
                    │ (Public Web / Lab / App)│
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│     Staff & Admin Portal      │       │     Public Attendee Flow      │
│     (Next.js App Router)      │       │       (/attend/[token])       │
├───────────────────────────────┤       ├───────────────────────────────┤
│ • Auth & RBAC (Admin, Staff)  │       │ • Zero-auth instant load      │
│ • Session Wizard & Scheduler  │       │ • High-speed mobile UX        │
│ • Branded QR Poster Engine    │       │ • Progressive stage forms     │
│ • Live Attendance Feed        │       │ • Server-side Zod validation  │
│ • Analytics & CSV/XLSX Export │       │ • Instant energetic feedback  │
└───────────────┬───────────────┘       └───────────────┬───────────────┘
                │                                       │
                └───────────────────┬───────────────────┘
                                    ▼
                ┌───────────────────────────────────────┐
                │        Server Logic & API Layer       │
                ├───────────────────────────────────────┤
                │ • Cryptographic Token Verifier        │
                │ • Timezone Scheduling (Africa/Kigali) │
                │ • Duplicate Prevention Policies       │
                │ • Role Verification Middleware        │
                └───────────────────┬───────────────────┘
                                    ▼
                ┌───────────────────────────────────────┐
                │      PostgreSQL & Prisma Data Layer   │
                ├───────────────────────────────────────┤
                │ • Users & RBAC Permissions            │
                │ • Sessions & Public Tokens            │
                │ • Attendance & Academic Profiles      │
                │ • Custom Form Field Schemas           │
                │ • Audit Event Log                     │
                └───────────────────────────────────────┘
```

## 3. Key Design Tenets

1. **Light & Scientific Visual Clarity**:
   - The UI avoids dark hacker themes and neon gamer tropes.
   - Grounded in high-contrast crisp whites, warm tones, and scientific blues, representing clean nuclear energy and human clarity.
2. **Resilient Public Check-in Loop**:
   - The attendee experience (`/attend/[token]`) requires zero login, works across poor mobile networks, and requires no heavy dependencies.
   - Three.js and dynamic physics are strictly progressive enhancements; core check-in operates flawlessly without WebGL.
3. **Canonical Data Integrity**:
   - Timestamps are stored canonically in UTC and evaluated according to Rwanda Standard Time (`Africa/Kigali`).
   - Emails and phone numbers are normalized before persistence.
4. **Architectural Modularity**:
   - Engineered so future modules (such as NiCE Lab and the public educational website) can seamlessly share design tokens, GSAP motion systems, and 3D visual primitives without structural refactoring.
