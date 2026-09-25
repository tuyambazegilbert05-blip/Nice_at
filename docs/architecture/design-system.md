# Design System & Visual Identity — NiCE Club Rwanda

## 1. Brand Essence: Science, Energy, People

NiCE Club Rwanda (*Nuclear is Clean Energy*) communicates:
`SCIENCE → ENERGY → PEOPLE → KNOWLEDGE → CONNECTION → IMPACT`

### What the platform is:
A clean, premium scientific product that empowers youth and institutions. It breathes light, precision, and purpose.

### What the platform is NOT:
- A dark hacker terminal or cyberpunk dashboard.
- A glowing neon gaming HUD or crypto platform.
- An overloaded NGO template with disorganized animations.

---

## 2. Color Palette & Semantic Tokens

### Base Surfaces (Light & Warm):
- **Surface Canvas**: `#ffffff` (Pure White) and `#fbfcfd` (Warm Scientific White)
- **Surface Muted**: `#f8fafc` (Soft cool slate)
- **Surface Raised / Card**: `#ffffff` with subtle border `#e2e8f0`
- **Surface Accent**: `#f0f7ff` (Soft Blue Tint)

### Primary & Supporting Accents:
- **NiCE Blue (Primary)**:
  - `primary-50`: `#eff6ff`
  - `primary-500`: `#0284c7` (Energetic Cobalt)
  - `primary-600`: `#0369a1` (Deep Scientific Blue)
  - `primary-700`: `#1d4ed8` (Royal Blue)
- **Energy Green (Supporting / Clean Energy)**:
  - `emerald-500`: `#10b981`
  - `emerald-600`: `#059669`
- **Scientific Cyan (Accent)**:
  - `cyan-500`: `#06b6d4`
- **Amber / Solar (Warning)**:
  - `amber-500`: `#f59e0b`
- **Status Rose (Critical / Error)**:
  - `rose-500`: `#f43f5e`

### Text & Contrast:
- **Text Headings**: `#0f172a` (Slate 900)
- **Text Body**: `#334155` (Slate 700)
- **Text Muted**: `#64748b` (Slate 500)
- **Borders**: `#e2e8f0` (Slate 200)

---

## 3. Typography Hierarchy

Primary Typeface: **Inter** or **Geist Sans** (Clean, neutral, modern, highly legible).

| Level | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| Display | 2.25rem (36px) | 700 (Bold) | 1.2 | Marketing & Success Hero |
| H1 | 1.875rem (30px) | 700 (Bold) | 1.25 | Primary View Headers |
| H2 | 1.5rem (24px) | 600 (Semibold) | 1.3 | Card / Section Headers |
| H3 | 1.25rem (20px) | 600 (Semibold) | 1.35 | Subsections & Modals |
| Body | 1rem (16px) | 400 / 500 | 1.5 | Standard copy & inputs |
| Small | 0.875rem (14px) | 400 / 500 | 1.4 | Meta info & table cells |
| Caption | 0.75rem (12px) | 600 | 1.3 | Badges, tags, hints |

---

## 4. Motion Guidelines (GSAP)

Animations must have clear communicative purpose:
- **Orbit & Pulse**: Subtle energetic pulse on check-in success and live attendance updates.
- **Card Lift**: Micro-elevation (2px) on hover with delicate border illumination.
- **Form Progression**: Smooth FLIP slide between wizard steps without cognitive disorientation.
- **Reduced Motion**: All animations immediately disable or collapse to quick opacity transitions when `prefers-reduced-motion: reduce` is active.
