# AGENTS.md — NiCE CLUB RWANDA ATTENDANCE PLATFORM

Welcome to the **NiCE Club Rwanda Attendance Platform** codebase.
This project is an operational product for **NiCE Club Rwanda** (*Nuclear is Clean Energy*), a youth-led Rwandan initiative promoting education, informed dialogue, and public awareness regarding peaceful nuclear energy and clean energy transitions.

All AI coding assistants, developers, and autonomous agents modifying this codebase **MUST** read, respect, and strictly comply with the architectural, design, database, security, and motion rules set forth in this document.

---

## 1. Core Philosophy & Design Identity

### The Product is NOT:
- A generic Bootstrap or dark hacker admin panel
- Cyberpunk, neon-heavy, or cryptocurrency aesthetic
- A gaming interface or sci-fi simulator
- An over-decorated NGO template with random animations
- A static mockup or prototype

### The Product IS:
- **Bright, Professional, Scientific, Modern, Fast, and Elegant**
- **Mobile-first** for attendees (zero friction, immediate check-in)
- **Desktop-optimized** for staff/administrators (data-rich, fast navigation, clear hierarchy)
- Visual narrative: `SCIENCE → ENERGY → PEOPLE → KNOWLEDGE → CONNECTION → IMPACT`
- Subtle, respectful integration of Rwandan aesthetic rhythm and scientific precision.

### Color Palette:
- **Surfaces**: Pure white (`#ffffff`), warm white (`#fbfcfd`), subtle cool gray/slate (`#f8fafc`, `#f1f5f9`), soft blue-tinted surfaces (`#f0f7ff`).
- **Primary / Energy**: Professional scientific blue (`#0284c7`, `#0369a1`, `#0ea5e9`, `#2563eb`).
- **Supporting**: Clean energy emerald/green (`#059669`, `#10b981`), scientific cyan (`#06b6d4`), subtle warning amber/yellow (`#d97706`).
- **Typography / Text**: Near-black (`#0f172a`), deep slate (`#334155`), muted slate (`#64748b`).
- **Strict Rule**: Avoid dark cyberpunk/black dashboard backgrounds.

---

## 2. Architecture & Directory Hierarchy

The project follows Next.js App Router conventions with clear separation of concerns:

```
nice-attendance/
├── public/                 # Static browser-accessible assets only (brand, images, 3d, lottie)
├── src/
│   ├── app/                # Next.js App Router routes & API endpoints
│   │   ├── (auth)/         # Staff authentication (login, reset password)
│   │   ├── (dashboard)/    # Admin & staff operations (sessions, attendance, analytics, settings)
│   │   ├── attend/[token]/ # High-performance public mobile-first attendee check-in
│   │   ├── api/            # Server API handlers
│   │   ├── layout.tsx      # Root application layout
│   │   └── globals.css     # Design tokens, typography, atomic styles
│   ├── components/         # Reusable React components (ui, navigation, sessions, attendance, qr, analytics)
│   ├── lib/                # Server & domain logic (auth, permissions, sessions, qr, exports, validation)
│   ├── hooks/              # Custom React client hooks
│   ├── types/              # Strict TypeScript definitions & domain interfaces
│   ├── utils/              # Pure utility functions (formatting, date, crypto, cn)
│   ├── motion/             # GSAP animation primitives and context
│   ├── three/              # Three.js progressive enhancement energy visualization
│   └── lottie/             # Semantic Lottie animation wrappers
├── database/               # PostgreSQL schema, migrations, seeds, documentation
├── tests/                  # Unit, integration, and E2E test suites
├── docs/                   # Comprehensive architecture, product, testing, and development guides
├── AGENTS.md               # Agent instructions and rules
└── README.md               # Repository documentation and run guides
```

### Golden Rules:
1. **Never scatter application logic** in repository root.
2. **Server/Client Separation**: Default to React Server Components. Use `'use client'` only where interactive state, DOM event listeners, GSAP, or Three.js are required.
3. **No Private Data in Public**: Never store tokens, private participant data, or environment secrets in `public/`.

---

## 3. Database & Data Truth Rules

1. **The Database is the Sole Source of Truth**:
   - Never use hardcoded client arrays as production statistics.
   - All dashboard metrics (Total Sessions, Attendees, Growth, Distributions) are dynamically computed.
2. **No Magic Data**:
   - Seed data must be strictly labeled as development seed data.
   - Never fabricate organizational achievements, partnerships, or nuclear metrics.
3. **Canonical Data Types & Timezones**:
   - Timestamp storage must be canonical UTC.
   - Business schedules and check-in windows must evaluate in `Africa/Kigali` timezone.
   - Participant emails must always be normalized (trimmed and lowercased).
4. **Non-destructive Data Handling**:
   - Session cancellation or retirement must prefer status archiving rather than cascading hard deletions.

---

## 4. Security & Authorization Rules

1. **Server-Side Enforcement**:
   - UI button hiding is for UX only. All mutations and sensitive queries must verify roles (`ADMIN`, `MANAGER`, `STAFF`, `VIEWER`) server-side.
2. **Cryptographic Public Tokens**:
   - Attendance URLs (`/attend/[token]`) must use cryptographically unpredictable tokens. Never expose sequential auto-incrementing database IDs in public URLs.
3. **Form Abuse & Replay Prevention**:
   - Public attendance submissions are subject to rate limiting, input sanitization via Zod, honeypot detection, and configurable duplicate prevention policies.
4. **Privacy**:
   - Attendee personal information (phone, email, academic info) is private to the organization. Never leak participant lists via unauthenticated endpoints.

---

## 5. Motion (GSAP) & 3D (Three.js) Rules

1. **Utility & Meaning First**:
   - Every animation must answer: *What changed? Where did it go? What should I look at now? What completed?*
2. **Progressive Enhancement**:
   - The platform MUST function completely if WebGL or Three.js is disabled or unsupported. Attendance check-in must never fail due to a canvas error.
3. **Clean GSAP Lifecycles**:
   - Always use `gsap.context()` for scoped animations in React client components and ensure proper unmount cleanup to avoid memory leaks.
4. **Accessibility (`prefers-reduced-motion`)**:
   - Always query and respect `prefers-reduced-motion`. In reduced-motion mode, replace complex particle physics and staggers with instant or subtle opacity changes.

---

## 6. Testing & Quality Requirements (Definition of Done)

A feature is **NOT** done until:
- [x] Strict TypeScript passes (`npx tsc --noEmit`) with zero errors.
- [x] ESLint passes (`npm run lint`).
- [x] Production build succeeds (`npm run build`).
- [x] Core E2E check-in loop passes (Staff Session Creation → Public QR Token → Attendee Submission → Real-time Dashboard Count).
- [x] Responsive on mobile viewports (360px, 390px, 430px) and desktop.
- [x] Handled all four operational states: Loading, Empty, Error, Success.
- [x] Documentation in `docs/development-status.md` is updated.

---

## 7. Phased Implementation Protocol

All changes must follow the structured phases:
1. **INSPECT** → Check existing files and dependencies.
2. **PLAN** → Define smallest coherent set of changes.
3. **IMPLEMENT** → Write clean, documented, strict TypeScript code.
4. **TEST** → Verify builds, lints, and test suites.
5. **DOCUMENT** → Update `docs/development-status.md`.
6. **REPORT** → Provide phase report in standard format.
