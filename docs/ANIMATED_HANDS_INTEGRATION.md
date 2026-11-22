# Animated hands integration

The existing homepage hero now includes a decorative, transparent hand scene. Original content, typography, colors, spacing, header, sections and global backgrounds remain intact. Other routes do not mount the scene.

## Implementation

- Entry: src/components/background/AnimatedHandsBackground.tsx. Lazy client import, isolated styles, pointer-events none, foreground content above decoration.
- Runtime: hands/scene.js. Three.js transparent orthographic renderer, existing painted skinned artwork and 30 finger joints. Reuses the standalone adam-touch rig/contact solver; preserves proportions and alpha contours.
- GSAP ScrollTrigger uses the document scroll, adapts to existing hero dimensions, reverses upward, and never pins or adds spacers. Contact is positioned in the existing space above the product examples.
- Mobile recalculates placement, uses lower opacity and capped DPR. Rendering occurs on demand and stops outside the hero or hidden document. Reduced-motion removes delayed scrub; system preference changes reconnect the owned timeline.
- Own timeline/trigger, resize/intersection observers, event listeners, frame, textures, geometry, material, skeleton and renderer are disposed on unmount. Async loading cancellation and context/load failure keep foreground usable.
- Exact added dependencies: three 0.170.0 and gsap 3.12.5. No global CSS or Next configuration changes.

## Verification

- Production build passed, including TypeScript and 61 generated pages. Final npm run typecheck passed.
- 18 HTTP route smoke checks returned 200 without server-error markers: see routes.json. Authenticated admin actions, payment actions and form submissions were not exercised.
- Before/after desktop DOM comparison: same foreground text, links, section order, header/title/hero bounds, typography, body background, document height and width. Earlier matched desktop captures used 1440x1000; the final desktop capture uses the normal browser viewport.
- Browser: scroll progress reached 1, all 30 finger joints moved, measured contour tip distance 0 px; upward scroll returned progress to 0.
- Mobile 390x844: width 375 CSS px plus native scrollbar, scrollWidth 375, no horizontal overflow, fingertip distance 0 px at completion. See mobile capture for the intermediate composition.
- One canvas and one owned trigger after returning home; zero hand hosts on /templates. No pin spacers. Header navigation and native FAQ disclosure worked. No captured browser warning/error logs.
- Performance safeguards inspected: lazy texture/scene loading, async rig initialization, no React animation state, demand rendering, visibility clipping and DPR limits. No production performance benchmark was run.

## Preview

http://127.0.0.1:3001/

QA output uses separate .next-hands-qa and .next-hands-build-qa directories, locally excluded from Git. No extra scroll height or standalone interface was imported.
