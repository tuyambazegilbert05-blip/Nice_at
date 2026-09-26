# NiCE Motion Guidelines

GSAP is the shared choreography layer for DOM motion. React remains responsible for UI state, CSS for layout and simple states, Lottie for semantic vector frames, and Three.js for WebGL rendering.

## Use the shared motion scale

Import durations, easings, and responsive motion profiles from `src/motion/gsap/config.ts`. Avoid local timing values unless an animation has a clear reason to differ. Current durations are `micro`, `short`, `standard`, `medium`, and `long` (0.12–0.64 seconds). Keep admin interactions short and non-blocking.

## React and cleanup

- Put DOM-dependent animation in a Client Component and use the shared `useGSAP` hook. It scopes animations and reverts them when dependencies change or a component unmounts.
- Use `gsap.matchMedia()` for viewport and `prefers-reduced-motion` conditions, and return/retain the cleanup handle.
- Do not access `window`, `document`, or SVG geometry while rendering. Keep server-rendered markup stable; let GSAP animate after hydration.
- A route transition currently animates the arriving page only. App Router navigation stays immediate; avoid blocking navigation for an exit animation.

## Reusable systems

- `PageTransition`, `ScrollReveal`, and `StaggerReveal` cover lightweight entrances.
- `DoorReveal` gives important cards and the first dashboard view a single, short perspective opening after authentication or attendance-session verification; mobile uses a smaller turn and reduced-motion users get an immediate panel.
- `FormSectionReveal` uses one-time ScrollTrigger entrances for long forms, so each section arrives as it enters view instead of the whole form animating at once. `FormFieldsMotion` adds a tiny focus lift to text fields and a matching label color cue; native focus, validation, and keyboard behavior remain in control.
- Dashboard KPI groups stagger in on entry; the navigation marker moves between active routes; session cards use a subtle pointer tilt on fine pointers; filtering uses FLIP for movement and enter/exit states; analytics time-series paths draw on entry or data refresh.
- `ButtonFeedback` delegates one immediate press/release acknowledgement across native buttons, role buttons, and submit inputs. Async actions should still expose their own truthful pending state; press feedback is not a substitute for server confirmation.
- `StepTransition` handles directional multi-step form changes.
- `useFlipLayout` captures a layout before a data/filter change and animates the new layout. Limit FLIP targets to visible, bounded result sets.
- `createScrollReveal`, `createStaggerReveal`, `createScrollProgress`, and `createParallax` live under `src/motion/scroll`. Parallax is desktop-only; mobile receives simpler motion.
- `createPinnedStory` sequences visible story steps against pinned desktop scroll progress; its mobile and reduced-motion profile leaves all steps in normal document flow.
- `createHorizontalScroll` pins and translates an overflowing desktop track; mobile and reduced-motion profiles clear transforms and preserve regular flow.
- `MotionLink` adds a short page-exit transition to opt-in same-origin navigation. Sidebar links use it; modified clicks, external links, same-route links, and reduced-motion preferences retain immediate navigation.
- `drawSvgPaths` uses SVG stroke dashes and does not depend on DrawSVG.
- `createMotionPathTween` is for purposeful paths such as the energy-object particle orbit.
- `bindHoverLift` and `bindPressFeedback` are opt-in helpers. Use `observeSectionGestures` only for intentional touch/pointer storytelling, not dashboard scrolling.

## Accessibility and performance

- Honor `prefers-reduced-motion`. Information, form state, errors, and success state must remain understandable without animation.
- Preserve keyboard focus, visible focus styles, labels, and screen-reader announcements. Animation cannot be the only state cue.
- Prefer `transform` and `opacity`; the animated analytics bar uses `scaleX`. Do not animate large tables or hundreds of nodes.
- Pause WebGL work when hidden/off-screen and keep the static fallback available.

## Coordinating other renderers

GSAP may animate the Lottie wrapper’s position, scale, opacity, and timing; DotLottie owns its internal vector frames. GSAP may control Three.js object properties and progress; Three.js owns rendering and GPU resources. Never have both systems drive the same property.

Lottie illustrations keep a static SVG underneath the player, defer their small JSON request until visible, reveal with GSAP as they enter the viewport, and pause offscreen or in a hidden tab. Three.js remains a progressive enhancement: use `EnergyObjectLoader` to get reduced-motion, low-capability, setup-failure, and runtime WebGL-loss fallback behavior. See [experience renderer architecture](../architecture/experience-renderers.md) for the lifecycle rules and current validation boundary.

## Current boundaries

There is no public long-form science story in the current product, so pinned and horizontal helpers are available but not forced into dashboard workflows. The project owner confirms the current wired interactions work; Phase 11 remains open pending browser/device runtime validation. Screen-reader review remains part of platform accessibility QA.
