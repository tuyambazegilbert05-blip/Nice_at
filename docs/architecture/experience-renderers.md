# Experience Renderer Architecture

Phase 12 and Phase 13 add optional illustration renderers to the attendance product. React owns state and lifecycle, GSAP coordinates the surrounding interface, DotLottie owns vector playback, and Three.js owns WebGL rendering. The product must remain usable when either renderer is unavailable.

## Lottie

Use the semantic exports in `src/lottie/` (`SuccessCheckmark`, `LoadingSpinner`, `EmptyStateAnimation`, and `ErrorAlertAnimation`) or `LottieIllustration` for a new state. Keep a static SVG behind the player so a missing asset, reduced-motion preference, failed parse, or unavailable player still communicates the state.

The shared player defers the small JSON request until it is visible, checks the document shape, and cancels pending requests when it leaves the page. Playback pauses offscreen and when the tab is hidden. One-shot states play once by default; loading loops unless `loop` is explicitly overridden. Keep explanatory text outside the image so meaning does not depend on animation.

GSAP may animate the wrapper’s entrance and placement. DotLottie owns the canvas animation. Do not use GSAP to animate the player’s internal frames.

## Three.js

Use `EnergyObjectLoader` for the progressive-enhancement NiCE orbital motif. It performs capability and motion checks before importing the scene. Low-capability devices, reduced-motion users, unavailable observers, and failed WebGL setup get the SVG fallback without affecting attendance functionality.

The scene pauses GSAP and rendering while offscreen or while the document is hidden, caps renderer pixel ratio, and disposes observers, timelines, geometries, materials, and the WebGL context on teardown. A lost context or runtime render error returns to the SVG fallback. Keep Three.js scene code in `src/three/scenes/`; do not initialize WebGL during server rendering.

The current orbital motif is a branded illustration, not an educational model of fission or a reactor. Any scientific storytelling needs subject-matter review and accessible text before it is presented as an explanation.

## Validation boundary

Type checking and production compilation verify code integration, not browser rendering, GPU recovery, frame rate, or screen-reader behavior. Review the rendered states on desktop and mobile, with reduced motion, with WebGL disabled, and with a lost WebGL context before marking these phases complete.
