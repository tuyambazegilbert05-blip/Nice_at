# NiCE Club Rwanda — Attendance Platform

> **Nuclear is Clean Energy (NiCE)** is a youth-led Rwandan initiative advancing public awareness, education, and informed dialogue around nuclear science and clean energy solutions for Africa's sustainable future.

The **NiCE Attendance Platform** is a modern, scientific, production-grade event and attendance management system. It enables authorized staff and organizers to publish sessions, generate branded dynamic QR codes, collect attendee verifications seamlessly on mobile devices without app installation, and derive real-time academic analytics.

---

## 🚀 Key Capabilities

- **Frictionless Mobile Attendee Check-In**: High-performance `/attend/[token]` route designed for instant scanning, progressive multi-stage information capture, and immediate verification.
- **Dynamic Branded QR Code Generation**: Downloadable vector SVG, high-res PNG, and printable A4 posters with high contrast and Kigali-inspired scientific geometry.
- **Data-Driven Staff Operations**: Real-time attendance counters, session life-cycle control (Draft → Upcoming → Open → Closing Soon → Closed), and participant academic breakdowns.
- **Configurable Academic & Custom Fields**: Faculty, program, year of study, participant type, qualitative reflections, and session-specific dynamic questions.
- **Scientific Visual Language**: Bright, purposeful interface powered by Next.js App Router, Tailwind CSS, GSAP orchestrated motion, and Three.js progressive enhancement energy visualizations.
- **Role-Based Server Authorization**: Secure role hierarchy (`ADMIN`, `MANAGER`, `STAFF`, `VIEWER`) strictly validated on server routes.
- **Production Exports**: Filtered CSV and XLSX export pipelines for post-session reporting and institutional compliance.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js (App Router, Server Components, Server Actions) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS + NiCE Scientific Design Tokens |
| **Database & ORM** | PostgreSQL + Prisma ORM |
| **Data Validation** | Zod (Client & Server unified schemas) |
| **Motion & Dynamics** | GSAP 3 (GreenSock Animation Platform) + Context Lifecycles |
| **3D Energy Systems** | Three.js (Progressive enhancement with SVG/CSS fallback) |
| **QR Code Engine** | QRCode vector SVG & canvas raster generation |
| **Testing** | Node.js Test Runner / Vitest / Playwright |

---

## 📁 Repository Structure

```
nice-attendance/
├── public/                 # Static web assets (brand marks, icons, illustrations)
├── src/
│   ├── app/                # Next.js App Router routes & API endpoints
│   ├── components/         # Reusable React components (ui, navigation, sessions, attendance)
│   ├── lib/                # Business logic, authorization, database client, validation
│   ├── hooks/              # Custom React hooks
│   ├── types/              # Domain TypeScript types
│   ├── utils/              # Formatting, date, crypto, styling utilities
│   ├── motion/             # GSAP animation timeline builders
│   ├── three/              # Three.js atomic energy object & canvas renderers
│   └── lottie/             # Semantic vector state animations
├── database/               # PostgreSQL schema, migrations, seed datasets
├── tests/                  # Unit, integration, and E2E test suites
├── docs/                   # Engineering, security, and product documentation
├── AGENTS.md               # Strict agent and contributor guidelines
└── package.json
```

---

## 🚦 Getting Started

### 1. Prerequisites
- Node.js `20.x` or higher
- npm `10.x` or higher
- PostgreSQL instance (local or hosted)

### 2. Setup Environment
```bash
cp .env.example .env.local
```
Configure your database connection string and authentication secrets in `.env.local`.

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Initialization
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔒 Security & Privacy

1. **Attendee Privacy**: Public check-in endpoints only verify token validity and accept submissions. They never disclose the attendee roster.
2. **Cryptographic Tokens**: Session public URLs use cryptographically unpredictable tokens rather than predictable database IDs.
3. **Server Validation**: All submissions are sanitized and validated server-side using Zod before database commits.
4. **Timezone Accuracy**: Time boundaries and check-in windows evaluate against canonical timestamps within `Africa/Kigali`.

---

## 📖 Documentation Index

- [Architecture Overview](docs/architecture/system-overview.md)
- [Database Design](docs/architecture/database-design.md)
- [Data Flow & Lifecycle](docs/architecture/data-flow.md)
- [Design Tokens & System](docs/architecture/design-system.md)
- [Security & Access Control](docs/security/rbac-and-authentication.md)
- [Development Status](docs/development-status.md)
