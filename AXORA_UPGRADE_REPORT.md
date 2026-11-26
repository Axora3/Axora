# AXORA upgrade report

## Initial condition and preservation

The checkout uses Next.js 16.4.6 App Router, React 19.3.0, TypeScript strict mode, Tailwind 4, Supabase, Motion, GSAP and Three.js 0.170.0. The repository already contained extensive uncommitted homepage and admin work, including product previews, calendar controls, revenue charts, admin search, mobile dock and notifications. Those changes were retained. They are not attributed to this implementation.

The existing cinematic shell, background image, articulated hands source, artwork, animation and cloud implementation were left untouched. Existing routes, server actions, authentication, authorization, product data, prices and database schema were preserved. No production writes, push or deployment were performed.

Relevant bundled Next.js guides were read for client boundaries, dynamic imports and icon metadata before implementation.

Baseline type checking passed. Baseline build failed because sandbox networking could not fetch the existing Google fonts. Baseline lint scanned old `.next-*` output and artifact scripts, producing 2,332 errors and 26,938 warnings; this was a tooling scope defect rather than an application error count.

## Design and implementation

- Created Aperture, Summit and Nexus vector logo concepts; selected Aperture for its offset crossbar and open silhouette. Added a custom path-based wordmark and horizontal, light, dark, monochrome, monogram, metal, favicon, Apple and social assets.
- Replaced the generic letter-A icon in shared branding and admin with the canonical monogram. Public navigation and footer now use the custom vector lockup. Public header spacing, active state and material were refined without changing destinations or menu behavior.
- Added a foreground design system with restrained panel radii, semantic integration with existing tokens, consistent spacing, fluid studio typography, focus states, transparency and forced-colors fallbacks. Public content surfaces no longer all receive the same heavy blur treatment.
- Added a distinct studio introduction between the product introduction and services. Its localized metal monogram and navy field share one lazy-loaded R3F canvas. The original hero content and product previews remain.
- Added reusable glass surface/button/navigation primitives and a header optical filter. This is progressive SVG backdrop displacement, not the original library's full WebGL background-refraction engine. Browser support varies and the CSS material remains the fallback.
- Added actual local notification preferences in authenticated settings. The preference filters the header preview to unread items; all notifications remain available in the existing centre. The popover links directly to preferences. Notification rows already linked to authenticated detail routes; this behavior was retained.
- Fixed lint ignore scope for generated `.next-*` directories and disposable artifacts without suppressing application rules.

## External research and integration

All four repositories were shallow-cloned into `%TEMP%/axora-research`, outside application source. Their README, package configuration where present, relevant renderer/shader implementations, and license files were inspected.

| Repository | Findings | Decision |
| --- | --- | --- |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | MIT; React major pairing; core render-loop subscriptions and renderer release/disposal | Install published `@react-three/fiber@9.8.2`; peer range `>=19 <19.4` accepts React 19.3; existing Three 0.170 satisfies `>=0.156` |
| [Liquid Glass JS](https://github.com/dashersw/liquid-glass-js) | MIT; shape normals, distance-based refraction/rim, nested sampling; html2canvas body capture and imperative DOM architecture | No source copied or dependency added. Independently implement restrained optical edge/displacement fallback; avoid page capture and uncontrolled mutation |
| [Shader Gradient](https://github.com/ruucm/shadergradient) | Core package declares MIT; R3F renderer, viewport mount, pixel-density controls; broad renderer/control dependency surface | Study viewport/canvas architecture; use an original small GLSL field sharing the brand canvas. Do not add the full package or its controls |
| [Paper liquid-logo](https://github.com/paper-design/liquid-logo) | PolyForm Shield 1.0.0; uploaded artwork converted to a mask with beveled edges, WebGL2 shader uniforms and time-driven material | Research only; no source copied. Original geometric extrusion and analytic silver shader preserve the canonical silhouette without importing the demo |

The new scene uses no remote textures or HDR assets. R3F owns the scene resources and disposes declarative geometry/materials on unmount. The viewport hook disconnects observers and removes media/visibility listeners. Offscreen/hidden/reduced-motion/small-device conditions unmount the scene. A boundary and context-loss path leave the static vector visible. Existing hands continue using their existing renderer; the new effect adds only one localized context while visible.

Added dependencies: `@react-three/fiber@9.8.2`; development `@types/three@0.170.0`. No forced peer overrides. Installation audit reported zero vulnerabilities. No repository demos or nested Git metadata were copied into the app. Fiber’s full upstream MIT license is preserved in vendor/react-three-fiber/LICENSE because its npm tarball declares MIT but omits the license file. Attribution is recorded in THIRD_PARTY_NOTICES.md.

Design craft guidance: unslop by Damir Sokolovsky, CC BY 4.0, https://heydamir.design/unslop. Its guidance was adapted under the user's explicit preference for a selective metal brand treatment.

## Files changed by this work

New: `src/components/brand/*`, `src/components/glass/*`, `src/components/three/BrandScene.tsx`, `src/components/shaders/ShaderGradient.tsx`, `src/hooks/useVisualActivity.ts`, `src/styles/axora-system.css`, `src/components/admin/NotificationPreferences.tsx`, `public/brand/*`, `scripts/generate-axora-brand.mjs`, `scripts/verify-axora-design.mjs`, and these two reports.

Updated: package files, ESLint config, root layout, homepage composition, icon and OG metadata artwork, shared icons, public header/footer, admin brand, notification preview, authenticated settings and third-party notices. Existing modified files were edited narrowly in place.

## Verification and limits

Production build: passed after allowing network access for existing Google Fonts; 62 static page outputs generated. Typecheck passed. Existing ecosystem tests: 25 passed, zero failed after rerunning outside the sandbox profile restriction (`uv_os_get_passwd ENOMEM` prevented the first test attempt from starting). Lint: zero errors, four existing unused-variable warnings in icon-generation and hands sources.

Responsive browser matrix and screenshots are produced by `node scripts/verify-axora-design.mjs`, using installed Chrome against local port 43110. Results are stored in `artifacts/axora-upgrade/responsive-results.json`. See final validation addendum below for the latest run.

No baseline field Core Web Vitals measurements were available. No LCP/CLS/INP compliance claim is made. Static fallback, capped DPR, code splitting and viewport suspension reduce new rendering cost, but real mobile hardware and production traffic measurement remain necessary.

This implementation provides a shared public visual refinement and focused admin additions. It does not claim a complete per-screen redesign or authenticated manual verification of every production workflow. The full Shader Gradient package and Paper demo are intentionally not installed. Glass does not reproduce every optical behavior of the researched WebGL library. Browser screenshots and fixture tests cannot establish live payment/email provider availability or production authorization for all roles.

## Final validation addendum

- Final production build: passed; 62 static outputs. Source typecheck: passed. Lint: zero errors, four pre-existing warnings.
- Existing ecosystem suite: 25 tests passed. Existing browser integration suite: three tests passed, covering responsive authenticated ecosystem sections, Factory intake, and denied anonymous/cross-origin operations.
- Added browser integration: notification preference survives reload; authenticated settings fits all nine requested widths. Passed.
- Final public/login matrix: 63 route/viewport combinations across 320, 360, 375, 390, 430, 768, 1024, 1440 and 1920px, plus one live material check. Zero failed statuses, page exceptions or horizontal overflows. The live material mounted one canvas. This verifies layout and runtime behavior, not WCAG certification or field performance.
- The initial matrix included the intentionally production-disabled `/dev/admin-preview`; its expected 404 was removed from production UI verification. A transient 4px login overflow at 320px led to explicit `min-width: 0; width: 100%` sizing on both form inputs. The corrected final matrix passes.
- Screenshot files and machine-readable results are in `artifacts/axora-upgrade`. Authenticated admin screenshots use disposable fixture data; public catalog requests in the first sandbox preview failed to connect and displayed the existing explicit error state rather than fabricated data.
- Additional overlay primitives use existing Radix for dismiss/focus/keyboard/collision behavior. These are available for incremental adoption; existing working menus were preserved.

## Precision glass cleanup follow-up

Targeted refinement; no asset, hands animation, route, database or authentication changes.

Root causes and fixes:

- Header placement had three competing definitions, including a late `top: 0; margin: 0` reset. Removed the competing outer-header rules and consolidated placement/material in `src/styles/axora-system.css`: 20px desktop, 16px tablet and 12px mobile, or the larger safe-area inset. The header uses a continuous 32px silhouette and one CSS optical surface.
- The mobile dock retained legacy full-width/bottom-zero utilities and internal safe-area padding alongside floating CSS. Removed those utilities. Dock dimensions now have one owner: 68px high, 28px outer radius, 22px active radius, 12px horizontal inset, and `max(10px, safe-area-inset-bottom)` bottom positioning. Removed the nested active icon fill while preserving tabs, icons, labels, links and active route matching.
- Body padding reserved 68px plus safe area outside the footer, which independently reserved 96px plus safe area. Removed body padding and reserve the exact dock height, bottom offset and 16px clearance inside the footer. No additional strip is appended to the document.
- Removed the header's expanded SVG displacement-filter region, which could produce rectangular compositor edges. Navigation uses a single 12px CSS backdrop blur with a controlled dark tint and thin inner highlight. Removed redundant blur from public buttons and the opaque mobile-menu header.
- Removed the mobile menu's animated decorative light layer. Rounded the studio shader container and its inner material viewport together. Restored rounded footer-panel geometry. Removed additional CSS dots from the public canvas surface. Inspection of the actual original background confirmed the main dot pattern is baked into that image; it remains unchanged.

Files changed in this follow-up: `src/app/globals.css`, `src/app/cinematic.css`, `src/styles/axora-system.css`, `src/components/site/MobileTabBar.tsx`, `src/components/site/SiteHeader.tsx`, `src/components/site/MobileNav.tsx`, `scripts/verify-glass-cleanup.mjs`, and this report.

Verification: production build passed (62 static outputs); typecheck passed; lint passed with the same four pre-existing unused-variable warnings. Chrome checks passed at all nine requested widths, at page top and footer: no horizontal overflow, header top clearance retained on scroll, zero body bottom padding, dock dimensions/offsets correct, and no runtime page errors. Mobile menu open/Escape-close and template-tab navigation/active synchronization passed. Screenshots were visually inspected at 390px and 1440px. Results and screenshots: `artifacts/glass-cleanup/`. Firefox and WebKit launch attempts found no installed executables; Safari itself was not tested. Physical device safe-area behavior remains unverified.
