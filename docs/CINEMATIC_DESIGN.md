# Cinematic public shell

## Assets

- `global-background-rotated.webp`: the original `f489b4df3c9b3f48de6541ea675d73f8.jpg`, rotated exactly 90 degrees clockwise to 1308 × 736 and exported losslessly to preserve the halftone dots. The portrait source remains unchanged.
- `footer-clouds.webp`: the supplied `Cinematic Amber Cloud Bank Overlay.png`, optimized to WebP with alpha preserved (1672 × 941). Its upper center is transparent; no screenshot UI, branding, or text was included. The original upload remains unchanged.
- The existing transparent painted hand assets and articulated Three.js rig are reused in grayscale, with a deliberate final fingertip gap.

To re-export the background in the other direction, use `sharp(source).rotate(270).webp({ lossless: true })` in place of `.rotate(90)`. Rotation is baked into the asset, not performed during rendering.

## Components and layers

`PublicSiteShell` persists outside route templates, excludes `/admin` and `/dev`, and preserves the independent `.ax-light` customer preview palette. `GlobalBackground` uses the rotated image through `next/image`, fixed and centered with cover sizing. `AnimatedCloudFooter` replaces the static cloud layer in the shared `SiteFooter`, preserving all existing AXORA text and links.

Layer order: background and dark overlay 0, fixed hands 2, page content and foreground footer clouds 3, interactive footer content 4, existing navigation/dialog layers 30–100. The footer itself must not create a stacking context (no isolation, transform, or opacity). Its decorative cloud layer disables pointer events and fades at its upper edge. A stationary radial mask opens over the hand rig’s viewport fingertip anchor (60% desktop / 68% mobile), keeping the fingertips visible while clouds cover the lower hands. The global hand layer remains unchanged and survives public navigation.

Shared public glass tokens reach portaled dialogs. Theme settings remain available for admin and previews; public chrome intentionally uses the cinematic dark palette. No routes, request handlers, authentication, data access, or builder configuration logic were replaced.

## Verification (2026-11-23)

- Production build passed, including all 61 generated pages. TypeScript and source lint passed.
- `npm run lint -- --ignore-pattern '.next-*/**'` passed with four existing unused-variable warnings. The exclusion prevents linting generated QA build artifacts.
- Production browser checks passed at 375, 768, 1440, and 1920px: no horizontal overflow, cloud image loaded, footer links clickable, hands ready with a positive fingertip gap (before the foreground-cloud update), final fingertip gap positive (16.875–48px).
- Scroll reversal returned hand progress to 0. Public client navigation preserved the same background and hand DOM nodes, with one active cloud layer and one hand instance. Reduced motion was verified. No browser page errors occurred.
- The exported background matches the clockwise-rotated source pixels exactly, and the exported cloud alpha matches the supplied PNG alpha exactly.
- Screenshots: `docs/cloud-footer-375.png` and `docs/cloud-footer-1440.png`. Backend submissions and every nested data route were not re-tested because their behavior was unchanged.


## Foreground cloud motion

`AnimatedCloudFooter.tsx` uses Motion `useScroll` from footer entry to footer-bottom arrival, `useSpring` (65 stiffness / 24 damping), and `useTransform` for a 150px to -24px rise and gradual opacity ramp. A separate CSS layer loops a 20px horizontal / 10px vertical drift over 24 seconds. In-view detection pauses ambient animation offscreen. Reduced motion disables drift and scroll transforms, retaining the fixed composition and fingertip opening. Existing hand animation and assets are unchanged.

### Foreground verification

Fresh production build and default production rebuild passed (61 generated pages); a stale Turbopack CSS cache was removed before the default rebuild. TypeScript passed. Lint passed with the same four existing unused-variable warnings, excluding generated `.next-*` build output.

Production browser checks at 375/768/1440/1920px verified hands/clouds/footer UI z-indices 2/3/4, gradual entry opacity and vertical displacement, changing ambient transforms, offscreen pause, positive fingertip gaps, clickable footer links, and no horizontal overflow. Reduced motion produced no cloud transforms. Desktop/mobile screenshots: `docs/animated-cloud-footer-1440.png`, `docs/animated-cloud-footer-375.png`.

All 14 existing top-level public routes returned HTTP 200 without horizontal overflow. Shared-footer pages have one active cloud layer; builder and order keep their existing footer-free workspace layouts. Nested pages reuse the same shared footer. No backend submissions were exercised.


Latest interaction update: at the user’s request, the final fingertip gap is now zero. The existing hands ease into contact at scroll progress 1 and separate again when scrolling upward.


Responsive footer repair: public cinematic styles now live in `src/app/cinematic.css`, imported after Tailwind globals so plain CSS edits avoid the stale Tailwind loader output. Below 700px the panel has 16px outer gutters, a full-width brand, and a two-by-two layout of navigation/contact groups. Mobile bottom spacing clears the fixed tab bar. Verified widths: 320, 375, 430, 520, 699, 768, 1440px; no horizontal overflow. Typecheck and changed-file lint passed.

## Premium UI refinement

Public blue/navy/neutral glass tokens and a 12/16/20/24/28px radius hierarchy are defined in `src/app/cinematic.css`. Shared cards, controls, pills, portaled menus/dialogs, active navigation and footer panels use them. The mobile tab bar retains its routes/labels but now has a floating rounded glass dock. Glass blur and panel opacity were reduced for recognizable imagery; hover movement stays subtle and respects reduced motion.

The public logo now uses a cool neutral accent while admin keeps its existing fallback. Decorative yellow chart/browser-frame accents and Open Graph gold highlights were replaced with slate/soft blue. Customer-controlled builder palettes, product artwork, semantic warning states, and the orange cloud image are intentionally retained. The Next.js development status badge is disabled through the documented `devIndicators: false` setting; compile/runtime errors remain visible.

Verification: TypeScript and production build passed (61 generated pages). Lint excluding generated `.next-*` folders passed with the same four existing unused-variable warnings. Browser layout checks passed at 375/768/1440/1920px without horizontal overflow or page errors. Footer foreground layers and mobile dock radii were checked. Backend submissions were not exercised.

Production route verification: all 14 top-level public routes returned HTTP 200 with no mobile horizontal overflow or browser page errors. Public logo computed color is rgb(214, 228, 255). Desktop More menu and mobile navigation open correctly; Escape closes them after their exit animation. Production screenshots: `docs/refined-footer-375.png` and `docs/refined-footer-1440.png`.

## Reference header

Only shared header/navigation styling and its mobile drawer were refined. Desktop uses a 64px dark full-width glass bar with left AXORA branding, centered text navigation, restrained active pills, and a white builder CTA; mobile/tablet use 56px. Existing routes, labels, More links, theme controls, compact/back destinations and menu handlers remain. Arrow/chevron icons were removed from header/back links and menu entries. Footer, hand rig, background, cloud animation and backend logic were unchanged.

Browser checks at 375/768/1100/1440/1920px showed no horizontal overflow and no arrow/chevron SVG references in the header or mobile drawer. More dropdown and mobile menu opened successfully; keyboard Escape worked. TypeScript and changed-file lint passed. Screenshot: `docs/reference-header-1440.png`.

## Spatial glass mobile navigation

`MobileNav.tsx` now uses an isolated 100dvh opaque navy overlay with a compact floating header, a six-column asymmetric primary tile composition, a secondary link grid and in-flow CTAs. The scrollable menu area is separate from the header; 44px minimum touch targets and safe-area padding are retained. Small spring reveals are staggered, CTAs appear last, and a CSS ambient blue light moves over 22 seconds. Reduced motion removes the ambient animation and reveal transforms.

The previous bleed-through came from the translucent band background and low overlay layer. The new overlay has its own solid base and z-index 110. While open, public content/header/dock become inert, the dock is hidden, and the existing dialog hook locks page scrolling/traps focus. Close restores inert state, page scrolling and opener focus. All routes and desktop navigation remain unchanged; there are no arrow/chevron icons.

Verified at 320/375/430/768px with no horizontal overflow, all five primary tiles visible and readable, page scroll locked, dock hidden, and Escape closing/restoring focus. Build and TypeScript passed. Screenshot: `docs/spatial-navigation-375.png`.
