# Development Status — NiCE Club Attendance Platform

**Current Date / Timestamp**: 2026-10-16 (Africa/Kigali)
**Lead Engineer / Pair**: Antigravity Assistant & Lead Product Engineer
**Current Active Phases**: PHASES 11–13 — EXPERIENCE SYSTEMS

## Platform-wide Action Feedback — UPDATED (2026-10-16)

- Shared buttons now show an accessible pending spinner and prevent repeat clicks when their action returns a promise. Confirmation dialogs remain open during async work and show a pending state; app route links display a subtle global progress cue while navigation completes.
- Added explicit in-progress feedback to native account, communications, team-role, sign-out, QR-copy, and Custom Forms actions. Local controls such as filters, tabs, password visibility, and opening details remain immediate and show their selected state.
- Sign-in, attendee submissions, session/form creation and publishing, response-window saves, and graphic downloads retain their existing action-specific loading states.
- Activity history now records staff-visible page visits and meaningful business actions such as creating or publishing sessions/forms, changing access or response windows, sending communications, exporting records, and account security changes. Generic API route traffic is no longer recorded, and legacy `api.*` entries are hidden from the activity view. Staff can review their own history; administrators can review all staff activity with filtering and cursor-based pages of 25 entries. Migration 015 removes history older than one year, and a daily Vercel Cron endpoint continues retention cleanup using `CRON_SECRET`. Event metadata excludes passwords, tokens, message bodies, recipient lists, and form answers.

## Shared Site Background — UPDATED (2026-10-16)

- Applied the pale scientific grid as the root page background across public, authentication, and dashboard routes. Reused the existing session atom illustration at three times its prior size in six staggered fusion sequences behind page content: reactants converge, a brief energy pulse marks fusion, and the product follows an outward trajectory. The sequence respects reduced-motion preferences.

## Public Form QR Availability — UPDATED (2026-10-16)

- QR image generation now encodes the stable public form URL directly from its token and no longer opens a PostgreSQL connection just to verify the form title. This lets the QR preview and download work during transient database connection failures; the public form route still enforces whether the form exists and is available. Added the transparent NiCE logo on a white, blue-bordered plate at the center of the QR code, with high error correction retained for scan reliability.

## Stand-alone Custom Forms Section — IMPLEMENTED (2026-10-14)

- Added a separate Custom Forms dashboard area with its own form details, draft builder, public link, QR display, response list, CSV export, and confirmation-email settings. It does not change the Scientific Sessions pages, `sessions` service, existing QR check-in API, or `/attend/[token]` submission flow.
- The forms index shows per-form attendee counts and overall totals; each form card opens its attendance overview. Attendee rows open the shared modal pattern with every answer from that submission. The overview includes registration and response analytics; authorized staff can customize the draft for a published form and publish a new immutable version while the current version remains live until then.
- Custom form drafts autosave to separate PostgreSQL tables with revision checks; published configurations are copied into immutable form-version snapshots. Public submissions retain their form snapshot and stable field IDs. Event dates are serialized as ISO date-only strings from PostgreSQL to avoid JavaScript date parsing errors.
- Added protected Full Name and Email fields, optional standard attendance fields, the “Standard Attendance,” “Workshop Feedback,” “School Outreach,” and “Conference Registration” starter templates, editable field types/options/visibility/required state, drag reorder, and keyboard move controls. Workshop Feedback and School Outreach now have dedicated sections and field sets, analytics-friendly rating choices, and conditional role/follow-up questions. The selector lists templates in that order.
- Upgraded the existing Conference Registration template within the shared builder: it now starts with six editable sections covering personal details, academic/professional background, participant category, event participation, additional questions, and separate required registration versus optional communications consent. Optional speaker and volunteer questions appear only for matching categories. Staff can rename/add/remove sections and assign fields to them; the live preview and published public form render those sections and conditions. Existing flat configs remain valid.
- Conditional visibility is limited to one visible dropdown, single-choice, or multiple-choice controller per question. The public form clears answers when they become hidden, and the server rejects stale/hidden responses. Event capacity, waitlists, and separate registration/check-in lifecycle work from the broader brief are not part of this Conference template upgrade.
- Public `/form/[token]` pages render only published fields, save browser recovery drafts for seven days, validate on the server, rate-limit attempts using hashed client addresses, reject duplicate email submissions, and support idempotent retries.
- Moved public-link controls, close/export actions, and QR sharing out of the form editor into a separate `/forms/[formId]/share` workspace. Fixed the broken QR preview: the session `/api/qr` endpoint returns JSON, so it could not serve an `<Image>` as a PNG; custom forms now use their own published-token route that returns `image/png` and supports direct QR downloads. Sharing offers a QR PNG, a print-ready flyer PNG, and a square social graphic PNG.
- Confirmation messages use an administrator-editable template and the existing Brevo transport. Delivery records distinguish provider acceptance from failure; staff can retry failed attempts. Provider acceptance does not mean inbox delivery. Marketing consent is not inferred from form submission.
- Database migration `012_custom_forms_section.sql` defines isolated form, version, submission, rate-limit, email-template, and delivery tables. It has been applied to the connected database; the migration runner verified the new tables and existing required tables.
- Form cards now lead to a dedicated overview with direct Customize, Analytics, Responses, and Sharing actions. Responses have their own searchable/filterable page and full-submission dialog; the builder no longer loads or renders the response list.
- Added scheduled response windows with Kigali date/time inputs, manager controls to close or reopen a published form, and public-page messages for upcoming or ended windows. Submission acceptance checks the current saved window inside the custom form transaction. Reopening starts acceptance immediately while preserving a future close time.
- Added response-time histogram, categorical pie charts, percentage bars, and email confirmation-rate display alongside the registration time series. Visualizations use saved submission and delivery data.
- Replaced text/icon-only brand stand-ins across Custom Forms builder previews, public response pages, staff response views, email settings, and form sharing with the supplied animated NiCE logo. Flyer artwork embeds `/brand/logo.png`; the social graphic and custom-form confirmation email use `/brand/NiCE-Logo-Animated-transparent.webp`. Flyer and social downloads render as self-contained high-resolution PNGs (2160 × 2700 and 2160 × 2160).
- Reused the session attendee page's scientific grid and atom background, centered NiCE branding, event/status card, numbered field sections, and shared field motion in the standalone Custom Forms response flow. The background and branded layout continue through loading, unavailable, closed/scheduled, and success states; session check-in routes and logic remain unchanged.
- Added the session-style operations toolbar to each form overview: customize, analytics, display QR, copy link, open/close responses, and response export. Administrators can temporarily reopen a published response window for 5, 10, 15, 30, or 60 minutes; the public submission transaction honors the override and it expires automatically. Form removal is a password-confirmed archive with restore support, keeping existing response records and analytics intact.
- Migration `014_custom_form_operations.sql` adds independent response-override and archive timestamps for Custom Forms; it was applied to the configured database and does not alter session tables or attendance endpoints.
- Migration `013_custom_form_response_windows.sql` adds and backfills independent custom form schedule columns. It has been applied and verified on the configured database; run `npm run db:migrate` for other environments.
- Custom Form data is now available in the shared workspace without changing session attendance records: Global Analytics reports form-response metrics in a separate section, the Participants directory merges people by normalized email while keeping session and form activity counts distinct, and the authenticated analytics API includes a `customForms` payload.
- Communications also includes Custom Form recipients only when they explicitly select the canonical `communications_consent` field (with legacy Workshop and School Outreach consent IDs supported for already-published forms). Staff, session, and form contacts are normalized and deduplicated before selection.
- The base custom-forms implementation passed its form unit suite, strict TypeScript check, ESLint run, `git diff --check`, and webpack production build before the branding/download update. The migration runner verified the required application tables after applying migration 013.
- Branding/download validation: `npm run type-check`, `npm run lint`, and the webpack production build pass; lint reports three existing `<img>` warnings in account, settings, and user-menu files. The form unit suite was not rerun for the artwork and branding changes. The package build command uses Next.js's supported webpack mode because Turbopack cannot create a worker/bind its port in this environment. Browser/device behavior and Brevo delivery remain environment-dependent.

---

## PostgreSQL Persistence Update — 2026-09-25

- Added a pooled PostgreSQL connection using `DATABASE_URL` and database health helper.
- Added repeatable SQL migration and one-time administrator seeding commands (`npm run db:migrate`, `npm run db:seed-admin`).
- Added persistent users, sessions, custom questions, and attendance tables plus migration history.
- Replaced in-memory session and attendance stores with PostgreSQL reads and transactional writes; staff sign-in now checks persisted salted password hashes.
- Connected dashboard metrics, analytics, session and participant directories, staff listing, and per-session attendance rosters to persisted records; removed hard-coded demo sign-in and check-in fallbacks.
- **Live database verified (2026-09-26):** all four SQL migrations applied; `users`, `sessions`, `session_questions`, `attendance_records`, and `schema_migrations` verified. Initial administrator account creation completed.
- Supabase TLS uses `DATABASE_SSL_CA_FILE` for verified connections. Admin seed settings can be supplied through `.env.local` or exported shell variables; passwords must be at least 14 characters.
- Validation: `npm run type-check`, `npm run lint`, and `npm run build` pass under Node.js 22.23.2. An earlier attempt under Node.js 18.19.1 was below Next.js 16's minimum supported version.

## Brevo Communications Update — 2026-09-26

- Added and applied migration `005_email_communications.sql` for staff invitations, email delivery status, and optional attendee email-update consent. The connected database verified all seven required application tables plus the migration ledger.
- Added a server-side Brevo transactional email client. Configure the private `BREVO_API_KEY` and verified `BREVO_SENDER_EMAIL` in `.env.local`; no API key is exposed to client code.
- Settings now provides role-based staff invitations with seven-day, one-time account activation links.
- Successful public check-ins trigger a branded session thank-you email with event title, date, time, venue, and a message welcoming the attendee back.
- Added the dashboard Communications page with recipient selection, direct addresses, live branded preview, confirmation before send, per-address outcomes, and database delivery logging. Bulk attendee contacts are limited to people who opted in.
- Email rendering uses the NiCE animated brand GIF, blue/emerald identity, and a professional footer. Email clients may choose to display a still frame.
- Validation: `npm run type-check`, `npm run lint`, and `npm run db:migrate` pass. No real emails were sent. Never place `BREVO_API_KEY` in a `NEXT_PUBLIC_*` variable or commit it.

## Account Profile Schema Fix — 2026-09-28

- The connected database was missing migrations `006_user_profile.sql` and `007_password_resets.sql`, despite both being present in the repository. Applied both with `npm run db:migrate`.
- Verified the `users.avatar_url` lookup used by current-user authentication and the dashboard metrics/recent-session queries against the connected database.
- Staff directory responses now include the optional profile image URL; the staff list displays it with initials as the broken-image and no-image fallback.

## Startup Redirect Loop Fix — 2026-09-28

- Middleware no longer treats the presence of any session cookie as proof of a valid login. This prevents expired or malformed cookies from bouncing between `/dashboard` and `/login` during startup.
- The auth layout now checks the authenticated user before redirecting to the dashboard. Removed redundant router refreshes after login and sign-out navigation.
- Validation: `npm run type-check` passes; `npm run lint` reports no errors and three existing image optimization warnings. Production build remains blocked by a Turbopack worker process error (`Operation not permitted`) under the current environment.

## Flyer Logo Update — 2026-09-28

- Downloaded session flyers now use the official static logo at `public/brand/logo.png` instead of the animated GIF.

## Analytics Hydration Fix — 2026-09-28

- SVG chart tooltips now render as a single text string inside `<title>`, avoiding React hydration errors caused by array children.
- Analytics timer and tab-visibility refreshes share a 30-second throttle to avoid duplicate aggregate queries.

## Attendee Submission Showcase — 2026-09-28

- Session attendee rosters now show key takeaways and feedback columns; each mouse- or keyboard-activated row opens the complete stored submission, including contact, academic, consent, custom-question, and metadata fields.
- The detail modal uses overlapping, staggered GSAP reveals and honors `prefers-reduced-motion`.
- Validation: `npm run type-check` passes; `npm run lint` has no errors and reports three existing image warnings. `npm run build` remains blocked by the environment's Turbopack worker process error.

## Destructive Action Password Confirmation — 2026-09-28

- Permanent session deletion now prompts for the administrator's password and verifies it on the server before removing the session and attendance records.
- There is no staff-account deletion action in the current application.
- Validation: `npm run type-check` passes; `npm run lint` has no errors and reports three existing image warnings. Production build remains blocked by the Turbopack worker process error in this environment.

## Modal Backdrop Fix — 2026-09-28

- Shared modals render through a document-body portal so dashboard scroll containers cannot clip the backdrop or leave the header uncovered. The overlay now uses a lighter slate tint and subtle blur.
- Validation: type-check and focused ESLint checks pass.

## Communication and Invitation Permissions — 2026-09-28

- Full communications access is granted to ADMIN, MANAGER, and STAFF; VIEWER is excluded from the navigation, route, recipient, preview, and send APIs.
- Staff invitations are restricted to ADMIN in both the settings UI and the invitation API.
- The RBAC matrix now lists the communications capability and identifies team management as administrator-only.
- Role-restricted controls remain read-only or visually disabled; a centered red access-denied dialog appears only when the user attempts the action and stays open until dismissed. This covers invitations, session creation/status changes, exports, QR generation, and Viewer communications. Server-side checks remain authoritative.
- Administrators can change another staff account’s role from the Staff Directory. The role update API is administrator-only, prevents self-role changes, and protects the last active administrator from demotion.
- All authenticated roles can view the current staff list. Non-admins receive a read-only directory without staff email addresses or account IDs; invitations and role-management controls remain admin-only.
- STAFF can create and manage session details. Administrators can edit the full session metadata and permanently delete a session with its attendance records; deletion is role-checked by the API and removes attendance rows in a database transaction.
- Added an administrator-only Activity Log settings tab. Server-side records capture the acting staff member and role, action, timestamp, related record, and relevant change details for session changes, staff role changes, invitations, communications, and account updates. Migration `008_activity_log.sql` was applied and the database check confirmed the indexed log table.
- Administrators can temporarily open a session's public check-in for 5, 10, 15, 30, or 60 minutes from its detail page, then close it early. The check-in API enforces the override while holding the session row lock; public check-in availability refreshes without caching. Migration `009_attendance_override.sql` adds the expiry timestamp and was applied.
- Removed the fabricated Resources document cards and their nonfunctional buttons; Platform Tools now links to working app sections. Removed analytics availability figures that were not backed by stored completion/rejection events, and clarified that the settings information tab contains read-only platform defaults.

## Login Usability Update — 2026-09-26

- Added an accessible eye toggle to show or hide the password and immediate pending feedback on sign-in; authentication still waits for server confirmation.

## Staff Invitation Acceptance Update — 2026-09-26

- Fixed the invite acceptance route directory so emailed `/invite/{token}` links resolve in Next.js.
- The invitation page now checks that its one-time link is valid, shows the invited email and assigned role, and lets the invitee provide their full name and set a password of at least 14 characters.
- The accept API returns invitation details only for an active, unexpired token; account activation still hashes the password and consumes the invite transactionally.

---

## Phase 10 Analytics — COMPLETE (2026-09-26)

- Replaced whole-table attendance and session downloads on the analytics screen with server-side PostgreSQL aggregations shared by the page and authenticated analytics API.
- Added authorized filters for submission date, session, academic program, year of study, and session status.
- Added unique and returning attendee counts, attendance by month/year, most-attended sessions, and recent/upcoming session summaries.
- Added per-session analytics for attendance windows, unique/returning attendees, academics, hourly check-ins, feedback counts, key-takeaway counts, and duration. Registration rates and rejected-submission totals are explicitly marked unavailable because those source records are not stored.
- Added 30-second in-place analytics refresh while the page is visible.
- Redesigned global and per-session analytics as compact visual dashboards with a 12-month time series, distribution doughnuts, percentage rings, ranked bar summaries, and shorter labels.
- Responsive analytics layout reflows filters and summary cards by viewport; the time-series SVG measures its card width so mobile labels remain legible without horizontal scrolling.
- Replaced nested SVG point tooltips with a stable SVG description to prevent a server/client hydration mismatch in React.
- Summary counters and distribution bars animate with GSAP and respect reduced motion.
- Per-session registration percentages and rejected submission totals are labeled unavailable because the database has no registration-capacity or submission-attempt source tables.
- Validation: Node.js 22.23.2; `npm run type-check`, `npm run lint`, `npm run build`, `npm run db:migrate`, and `git diff --check` pass. The production build compiled 29 routes. Read-only integration checks against the connected database passed for global aggregates, the 12-month series, a real session filter, and per-session metrics.

## Phase 11 GSAP Experience Engine — IN PROGRESS (2026-09-26)

- Reused the installed GSAP 3.15 and `@gsap/react` setup. One registry configures ScrollTrigger, Flip, Observer, MotionPathPlugin, and SplitText, plus shared durations, easing tokens, and a development debug flag.
- Added responsive motion profiles, reduced-motion hook, cleanup-aware page/scroll/stagger primitives, directional wizard transitions, selective word reveal, and a shared FLIP hook used by analytics filters.
- Made the motion visible in core workflows: dashboard sections and KPI cards enter in sequence; the active sidebar marker glides between routes; session cards respond to desktop pointer position with a restrained 3D tilt; session filters animate exiting, entering, and reflowing cards; the analytics time series draws its line and points.
- Added a root-level delegated GSAP press acknowledgement for every native button, shared Button, role=button control, and submit input. Pointer and keyboard activation respond immediately; reduced motion skips the press choreography. Async submit flows retain their existing explicit pending labels and disabled states.
- Animated the session-creation steps, its heading, mobile navigation drawer, shared modal open/close, dashboard page entrances, analytics counters/bars, and the existing Lottie wrapper. The modal retains Escape/backdrop close and traps/restores keyboard focus.
- Added reusable hover/press/gesture helpers, SVG stroke drawing without DrawSVG, desktop-only parallax and scroll progress helpers, and a MotionPath helper now used by the existing Three.js energy object.
- Added focused Node unit tests for motion tokens and responsive/reduced-motion profiles. No extra animation package was needed.
- Added reusable pinned-story and horizontal-scroll abstractions with desktop ScrollTrigger choreography, progress callbacks, reduced-motion handling, and mobile flow fallbacks.
- Added an opt-in route-exit link and used it in sidebar navigation; added collapsible Operations and Workspace sidebar sections with animated expansion.
- Independent validation on 2026-09-26: Node.js 22.23.2; `npm run type-check`, `npm run lint`, `npm run test:motion` (3 tests), and `npm run build` pass. This confirms type safety and production compilation, not browser/device behavior.
- The project owner confirms the wired motion works in the current product. Browser/device and screen-reader reviews remain unperformed; the motion unit tests cover tokens/profiles rather than rendered interactions. Phase 11 stays in progress until runtime interaction validation is complete.
- See [motion guidelines](design/motion-guidelines.md) for client boundaries, lifecycle, integration, and usage rules.

- The public check-in success page now uses a scoped 1.4-second GSAP timeline to sequence the card, brand, orbital illustration, success mark, message, and footer. Reduced-motion users see the same content without the choreography.
- Added a reusable reduced-motion-aware `DoorReveal` for verified session and attendee form cards and staff sign-in. The dashboard now keeps its content visible without relying on client-side entrance animations.
- The staff sign-in orbital animation now floats transparently above the card without adding layout height or intercepting pointer input.
- Added dashboard-specific loading and retryable error states. The overview renders live aggregate counts and five recent sessions without loading every attendee record into the page; the monthly count uses `Africa/Kigali`. Metric and session failures now degrade independently, use unavailable markers instead of false zeroes, and leave the rest of the dashboard visible.
- Added `FormSectionReveal` and `FormFieldsMotion` to the public attendance form, with one-time scroll entrances for its three sections and a subtle focused-field lift. Wired the same focus feedback into staff sign-in. Lottie illustrations now use ScrollTrigger for their entrance while keeping their existing viewport-lazy loading and playback lifecycle.

## Phase 12 Lottie System — IN PROGRESS (2026-09-26)

- Added lazy-loaded LottieFiles React playback and NiCE-colored success, loading, empty, and error animations.
- Added static SVG fallbacks that remain available when motion is reduced or playback cannot load. Integrated success and check-in verification states, plus analytics empty/error states.
- The shared player now waits until it enters the viewport before fetching its JSON, validates the Lottie document shape before creating a player, pauses when the tab is hidden or the illustration leaves view, and resumes when visible. Aborted fetches and invalid/missing files retain the SVG fallback without surfacing cancellation errors.
- GSAP choreographs the success-screen entrance and Lottie wrapper; DotLottie owns its vector-frame playback. The renderers animate separate properties, with a reduced-motion fallback.
- Enlarged the check-in success mark to an 80px overlay so its two-second orbit/check animation reads clearly on the success confirmation.
- Remaining validation: visually inspect all four states in desktop/mobile browsers and confirm one-shot success/error playback timing with product owners.

## Phase 13 Three.js Experience Layer — IN PROGRESS (2026-09-26)

- Added a reusable Three.js core for WebGL capability checks, adaptive renderer/camera setup, orbit rings, nucleus/particles, and GSAP pulse/motion-path choreography.
- Added a lazy NiCE Energy Object on the attendance success state. It defers loading until visible, uses a static SVG fallback for reduced-motion/low-capability environments, caps device pixel ratio, pauses off-screen/hidden rendering, and disposes GPU resources on unmount.
- Hardened scene startup and teardown: renderer/observer setup failures dispose partially-created GPU resources and return to the SVG motif; runtime WebGL context loss/render errors also switch back to the static illustration. GSAP timelines are explicitly killed as part of cleanup.
- Enlarged the success-screen orbital scene to 176px and shortened its full orbit rotation from about 42 seconds to about 20 seconds. Capability fallback now targets very-low-end devices (2 CPU cores or 2GB memory) so more phones can use the small scene.
- No educational reactor/fission simulation has been added; scientific claims and visualization accuracy need review before that public experience is built.
- Validation on 2026-09-26 with Node.js 22.23.2: `npx tsc --noEmit --incremental false`, `npm run lint`, `git diff --check`, and `npm run build` pass. The build compiled and generated all 29 routes; it reports the existing Next.js middleware-to-proxy deprecation warning.
- Remaining validation: exercise context loss and WebGL-disabled fallback, inspect runtime frame rate and visual quality on iOS Safari/Android Chrome, and review accessible naming with screen readers. Phases 12–13 stay in progress until those runtime checks are complete.

## Session Loading Motion (2026-09-28)

- Replaced the plain session-loading text on session detail and QR pages with a centered NiCE animated logo loader.
- GSAP runs the logo entrance, floating motion, opposing orbit rotations, signal pulse, and progress reveal in parallel. `gsap.matchMedia()` disables continuous motion when reduced motion is requested, and the shared `useGSAP` context handles teardown.
- Session fetch failures remain visible as an accessible alert instead of leaving the loading animation running.
- Validation: `npm run type-check` passed; `npm run lint` passed with three existing `<img>` optimization warnings elsewhere in the project; `git diff --check` passed.

## Analytics Database Connection Pressure (2026-09-28)

- Global and per-session analytics previously issued seven and four independent pool queries concurrently. Each query checked out its own PostgreSQL connection, so concurrent page/API refreshes could exhaust a hosted database's connection allowance and fail the Server Component render (surfacing as React error #441 in production).
- Added a shared `withConnection` helper and run each analytics query group sequentially over one checked-out client. This caps each analytics render at one pool connection without overlapping `client.query()` calls.
- Validation: `npm run type-check`, `npm run lint` (0 errors; three existing `<img>` optimization warnings), and `git diff --check` passed. `npm run build` could not complete: Next.js 16 Turbopack failed while binding a local port (`Operation not permitted`), including on the elevated retry.

## Sidebar Active Marker Alignment (2026-09-28)

- Keep the navigation group containing the current route expanded, and disable collapsing that active group so the selected link stays visible.
- Hide and reset the animated active marker whenever its target is missing or inside a collapsed group, preventing a detached blue highlight.
- Validation: `npm run type-check`, `npm run lint` (0 errors; three existing `<img>` optimization warnings), and `git diff --check` passed.

## First-Visit Product Tour (2026-09-28)

- Integrated the approved platform-wide tour across all nine sidebar sections, with a header tour button for first-time users that moves to Settings after their first tour outcome, visible Skip/Back/Next controls, keyboard navigation, live announcements, reduced-motion settings, and missing-target waiting.
- Added stable `data-tour` targets on each destination page and a loading/modal/ready-state guard for automatic startup. The server returns the signed-in user’s relevant permissions; the tour omits Communications and administrative Settings when that role lacks access and adjusts Sessions copy for read-only users.
- Added a hydration-ready marker to each target; Driver.js waits for that page-owned signal before adding spotlight classes and ARIA attributes, avoiding React hydration mismatches on the dashboard and other routes.
- Disconnected the per-step DOM observer before opening Driver.js, preventing its own spotlight mutations from reopening the same step during route handoffs. Back, Next, and Finish now use Driver.js native controls and callbacks; Skip remains a visible custom action.
- Tour position is held in tab-scoped session storage only while moving between route steps, then cleared on Skip or Finish; the server-side completion flag remains the source of truth for future visits.
- Added `users.has_completed_onboarding` and `users.onboarding_outcome`. Migration 010 marks existing accounts complete and new registrations incomplete; migration 011 saves the first outcome as `skipped` or `completed`. The authenticated API preserves that first response when the user later replays the tour from Settings.
- Added a short directional tooltip entrance, a one-shot target pulse, and a prominent NiCE-colored guide character animated with scoped GSAP reactions: greeting wave, energetic pointing, and a finishing celebration. A gentle idle bob and sparkle keep the character lively while a step is open; both stop for reduced-motion users. Finishing adds a small reduced-motion-aware confetti burst.
- External LottieFiles character candidates and their license notes are listed in [onboarding-animation-assets.md](onboarding-animation-assets.md); no third-party animation files have been added pending visual/license review.
- Validation: migration 011 applied successfully; `npm run type-check`, `npm run lint` (0 errors; three existing `<img>` optimization warnings), `git diff --check`, and `npm run build` passed. Next.js reported its existing middleware convention deprecation warning.
- Hydration fix validation: `npm run type-check`, `npm run lint`, `git diff --check`, and `npm run build` passed.

## Responsive Attendance, Dialog, and Tour Cards (2026-09-29)

- Session attendance now switches to stacked attendee cards below 1280px and a fixed-layout table at 1280px and above. Long contact and response values wrap inside defined columns, and the cards/table rows open the existing full-submission modal.
- Added scroll-triggered GSAP row reveals, SplitText heading entrance, CustomEase timing, and GSAP Flip from the selected attendee into the modal. The modal, showcase details, and roster reveals honor reduced-motion preferences.
- Added a low-density Three.js ambient particle layer that initializes on approach, pauses off-screen, and is skipped for reduced-motion users. Existing lazy Lottie wrappers provide roster loading, empty, and verified states.
- Constrained modal and alert dialogs to the dynamic viewport, added safe-area padding and wrapping for long content, and made the account error notice fit mobile widths.
- Made Driver.js tour popovers scale to the viewport width and height, with smaller guide artwork and controls on narrow or short screens.
- Motion could not be added: npm registry requests repeatedly failed with `ECONNRESET`, including the approved install retry. The roster/modal transitions use the existing GSAP and Flip dependencies until Motion can be installed.
- Validation: `npm run type-check` and the Node 22 production build passed; `npm run lint` has no errors (three existing image optimization warnings); `git diff --check` passed. Next.js reports its existing middleware convention deprecation warning.

## Password Policy and Visibility (2026-09-29)

- Unified new-password creation and change rules across invitations, password reset, account settings, and initial administrator seeding: at least 6 characters, uppercase and lowercase letters, a number, and a symbol (maximum 200 characters). Server endpoints enforce the same policy.
- Added live password requirement and confirmation feedback while typing, and reusable show/hide eye controls on password creation, confirmation, and account-change fields. Sign-in and sensitive-action confirmation fields retain their existing visibility controls.
- Validation: `npm run type-check` and the Node 22 production build passed; `npm run lint` has no errors (three existing image optimization warnings); `git diff --check` passed. Next.js reports its existing middleware convention deprecation warning.

## Private API Response Hardening (2026-09-29)

- Staff directory access remains authenticated; only administrators with `users:manage` receive staff emails and account timestamps. Other signed-in roles receive the limited directory fields needed by their UI.
- Added `Cache-Control: private, no-store` to staff directory and current-session API responses so user-specific data is not retained by browser or intermediary caches.
- New JWTs carry only the user ID and expiry instead of the user's name, email, and role; the server re-reads current account data and role from PostgreSQL on each request. Older session tokens remain readable during rollout.
- Removed the production fallback to a hard-coded JWT signing secret. Production must configure a private `AUTH_SECRET` (or `NEXTAUTH_SECRET`) of at least 32 characters; without one, token creation fails closed and sessions cannot be verified. Configure the secret in the deployment environment before rollout; users may need to sign in again when rotating from the old fallback.
- Static JavaScript/CSS chunks and public brand assets are expected to be publicly downloadable and must not contain credentials or private records. HTTPS protects requests in transit on public Wi-Fi; it does not protect a compromised device, browser extension, or stolen signed-in session.
- Validation not run in this turn.

---

## Phase Tracker

| Phase | Description | Status | Completion Target |
|---|---|---|---|
| **Phase 01** | Foundation (Stack, Tokens, Lint, Layout, Types, Animated Logo, Branded Flyer) | **DONE** | Complete (Build & Lint 0 errors) |
| **Phase 02** | Authentication & RBAC (Admin, Manager, Staff, Viewer) | **In Progress** | Current |
| **Phase 03** | Database (PostgreSQL, Migrations, Seeds) | **DONE** | Complete (live tables verified 2026-09-26) |
| **Phase 04** | Dashboard Shell (Sidebar, Header, Overview, Stats) | Pending | - |
| **Phase 05** | Session Management (CRUD, Status, Scheduling) | Pending | - |
| **Phase 06** | Form Builder (Custom Questions & Configuration) | Pending | - |
| **Phase 07** | Public Attendance (`/attend/[token]`, Dynamic Form, Validation) | Pending | - |
| **Phase 08** | QR System (Vector SVG, PNG, Branded Poster) | Pending | - |
| **Phase 09** | Attendee Management (Table, Search, Filter, Details, Export) | Pending | - |
| **Phase 10** | Analytics (Real-time aggregations, Academic distributions) | **DONE** | Complete (build, live database queries, and filters verified 2026-09-26) |
| **Phase 11** | GSAP Experience Engine (Motion primitives, FLIP, Transitions) | **In Progress** | Complete after remaining motion utilities and browser/device validation |
| **Phase 12** | Lottie System (Semantic vector illustrations) | **In Progress** | - |
| **Phase 13** | Three.js Experience Layer (NiCE Energy Object, Fallback) | **In Progress** | - |
| **Phase 14** | Integration Architecture (Ecosystem compatibility) | Pending | - |
| **Phase 15** | Performance Audit & Optimization | Pending | - |
| **Phase 16** | Accessibility (WCAG 2.1 AA, Screen Reader, Reduced Motion) | Pending | - |
| **Phase 17** | Security, Rate Limiting & Privacy Audit | Pending | - |
| **Phase 18** | QA, E2E Verification & Production Readiness | Pending | - |

---

## Phase 01: Foundation Detailed Report

### Status: COMPLETE (100%)

### Delivered Deliverables:
- [x] Inspect existing repository and document architecture rules in `AGENTS.md` and `README.md`.
- [x] Configured native ESLint 9 (`eslint.config.mjs`) and Tailwind CSS with bright scientific design tokens (`globals.css`).
- [x] Established strict TypeScript domain types in `src/types/` (`user.ts`, `session.ts`, `attendance.ts`, `qr.ts`, `analytics.ts`, `api.ts`).
- [x] Built pure utility primitives in `src/utils/` (`cn.ts`, `format.ts`, `date.ts` with `Africa/Kigali` timezone, `crypto.ts`).
- [x] Built UI component library in `src/components/ui/` (`Button`, `Input`, `Card`, `Badge`, `Table`, `Modal`, `StatCard`).
- [x] Built responsive navigation shell in `src/components/navigation/` (`Sidebar`, `Header`, `UserMenu`, `NavLinks`).
- [x] Implemented Next.js API route handlers in `src/app/api/` (`sessions`, `attendance`, `qr`, `analytics`, `exports`, `auth`).
- [x] **Branded Animated GIF Integration**: Live animated GIF (`/brand/NiCE-Logo-Animated.gif`) rendered on attendee check-in (`/attend/[token]`), success page, closed session page, QR display flyer, dashboard header, sessions page, attendance log, analytics page, and staff login.
- [x] **High-Resolution Branded Flyer Engine**: Off-screen HTML5 Canvas generator (`src/lib/qr/flyer-generator.ts`) generating 1200×1650 print-ready flyer with official logo, title, metadata badges, high-contrast QR code, and scanning footnotes.
- [x] **Print Media Styling**: Configured clean `@media print` rules for A4 poster printing without navigation chrome.
- [x] **Quality Gate**: `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors, 0 warnings), `npm run build` (27/27 routes compiled successfully).
