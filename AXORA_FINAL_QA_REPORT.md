# AXORA final QA audit

Audit date: 24 November 2026. This report records new source inspection, development-browser measurements and regression execution; earlier completion claims were not treated as evidence.

## Corrections made during this audit

1. **Route-dependent dock hydration:** the mobile dock used a separate root Suspense boundary and pathname read. A development-browser transition produced a recoverable DOM hydration failure on the application route. The dock now shares the persistent public shell and receives that shell's pathname. Hidden routes, tab labels, active states and body-class cleanup are preserved. Files: `src/app/layout.tsx`, `src/components/cinematic/PublicSiteShell.tsx`, `src/components/site/MobileTabBar.tsx`.
2. **Reduced-motion footer hydration:** Motion's cached preference could be `true` on a later client render while SSR output used `false`, changing both attributes and initial opacity/transform. The full React diagnostic identified `AnimatedCloudFooter`. Added an SSR-stable `useSyncExternalStore` preference hook; the existing CSS reduced-motion fallback handles first paint. Cloud art, movement values and hand animation remain unchanged. Files: `src/hooks/useReducedMotionPreference.ts`, `src/components/cinematic/AnimatedCloudFooter.tsx`.
3. **Glass silently absent in Chrome:** standard `backdrop-filter` followed by the WebKit declaration was optimized into only the prefixed property. A compiler reproduction and runtime CSSOM inspection confirmed this. Ordered the prefix before the standard property, preserving both in emitted CSS. The header now computes `blur(12px) saturate(1.15)` in Chrome. Files: `src/styles/axora-system.css`, `src/app/cinematic.css`, `src/app/admin-refinement.css`.
4. **Preview clipping geometry:** the builder's scrolling preview viewport had no outer radius, allowing the visible scroll boundary to cut the preview into square lower corners. Added a 24px radius to that actual scroller. No global overflow suppression was added. File: `src/styles/axora-system.css`.
5. **Above-fold image loading:** the development console identified the existing coffee preview image as a possible LCP image being lazy loaded. Set `loading="eager"` on that image; no asset bytes or composition changed. File: `src/components/home/HomeHero.tsx`.
6. **Leading catalog image and deprecated API:** only the first visible catalog card now requests its image eagerly; other cards remain lazy. The gallery uses Next.js 16's `preload` prop in place of deprecated `priority`. Verified the actual published catalog image has `loading="eager"`. Files: `src/components/templates/TemplateCard.tsx`, `src/components/templates/Catalog.tsx`, `src/components/templates/Gallery.tsx`.

## Requirement verification

Initial status reflects this audit's first direct inspection or runtime evidence. An initial PASS means the earlier implementation survived fresh inspection; it does not mean it was accepted from a prior report.

| # | Requirement | Initial | Root cause / correction and files | Verification and evidence | Final |
|---|---|---|---|---|---|
| 1 | Process section transparent, no upper/lower border | PASS | No further section change required | Computed background transparent, borders 0px, backdrop `none`; section screenshots and full-page traversal | PASS |
| 2 | Redundant section glass removed across public pages | PASS | Reviewed section sources, functional form/card exclusions and shared selectors | Automatically discovered public index routes; computed wide-section surfaces after full scrolling; published detail-link inspection | PASS |
| 3 | Legitimate component glass retained | FAIL | CSS optimizer dropped standard property; corrected declaration order in the three style files above | CSS optimizer reproduction, CSSOM, header blur assertion; live material/fallback lifecycle JSON | PASS |
| 4 | No document gap after Home footer | PASS | No new footer spacing change required | Footer bottom compared with document scroll height at every viewport after settled layout | PASS |
| 5 | Consistent content spacing | PASS | Existing shared gutter/section system retained | Container padding, component bounds, nested overflow, full-page scrolling and mobile/desktop screenshots | PASS |
| 6 | One consistent header on every public page | PASS | Shell remains sole header owner; dock moved into same owner | Header count, dimensions, offsets and radius compared between routes at each width | PASS |
| 7 | Builder contextual controls preserved | PASS | Toolbar remains below primary header | Browser test exercises device selection, reset dialog, preview and order handoff | PASS |
| 8 | Logo navigates Home | PASS | Canonical Next Link retained | Monogram SVG click from public pages on mobile/desktop; repeated route regression | PASS |
| 9 | Wordmark navigates Home | PASS | Same complete lockup link retained | Wordmark SVG click from public pages on mobile/desktop; keyboard/menu regression coverage | PASS |
| 10 | Coherent rounded geometry | PARTIAL | Rounded the preview scroller in `axora-system.css` | Parent/control radius inspection and builder screenshots; no new decorative wrapper | PASS |
| 11 | Builder sidebar has no unintended overflow | PASS | Existing constrained columns and inner-icon rotation retained | Nested `scrollWidth/clientWidth` assertions, option controls and screenshots across widths | PASS |
| 12 | Header retains top/side clearance | PASS | Existing responsive offsets retained | Actual bounding rectangles at all requested widths and after page traversal | PASS |
| 13 | Protected artwork/animation unchanged | UNVERIFIED | No protected asset or hand implementation edited | 11 SHA-256 records, Git blob equality, and exact protected composition-rule comparison in `protected-assets.json` | PASS |
| 14 | Existing customer/admin functionality intact | REGRESSION | Corrected dock/footer hydration; added actual notification detail/settings fixture coverage | Nine distinct browser regressions plus 25 isolated business/security tests; valid live provider/customer-token states are not available | UNVERIFIED |
| 15 | Applicable checks and production build pass | UNVERIFIED | Added regression coverage and reran applicable commands | Build, lint, standalone typecheck, isolated tests and fixture browser suite; final command results below | PASS |

## Test environment and coverage

- Development server: `npm run dev -- --port 43114`, using existing `.next-hands-qa` output isolation. Public data is the application's configured data, not substituted records.
- Public routes are discovered from `src/app/**/page.tsx`, excluding admin/dev/API routes and parameterized paths without a concrete record. Linked published details are discovered from the actual DOM. Parameterized customer payment/download states are separately classified as requiring valid tokens.
- Viewports: 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px. Every index page is walked from top to bottom. Both brand targets are clicked on every index route at mobile and desktop sizes.
- Chrome is the available executable. Previous Firefox/WebKit launch checks found no installed executables; native Safari and physical-device safe-area behavior remain unverified.
- Administrative tests use local disposable PGlite/services. The notification fixture loads the application's actual table definition and seeds one clearly labeled QA notification. No real production record is modified, and synthetic fixture content is never substituted into the public site.

## Reusable regression assets

- `scripts/audit-final-ui.mjs`: route discovery, full-page traversal, header consistency/material, page/panel overflow, footer boundary, section styles, padding, logo targets, console/network diagnostics and screenshots. `AXORA_QA_URL` selects the local server; `--final` writes final evidence.
- `scripts/check-protected-assets.mjs`: SHA-256/Git comparison for protected artwork and animation plus composition-rule equality.
- `scripts/verify-visual-lifecycle.mjs`: actual desktop WebGL canvas, mobile static fallback, offscreen unmount and context-loss fallback.
- `tests/ecosystem/browser/public.spec.ts`: hydration/glass/dock routing, builder selection/preview/reset/handoff, contact and login field validation without writes.
- `tests/ecosystem/browser/admin.spec.ts`: added notification detail and actual preferences navigation; existing authenticated admin/security checks remain.
- `tests/ecosystem/service-fixture.ts`: disposable notification data/schema support only.

Screenshots are evidence captures for local comparison, not automatically approved pixel-diff baselines. Initial checkpoints are retained under `artifacts/final-qa/initial`; final measurements and screenshots are under `artifacts/final-qa/final`. Lifecycle and protected-asset evidence sit alongside those directories.

## Diagnostic handling

Initial checks surfaced real hydration and missing-glass defects. Separate test-harness races were also corrected: layout measurements now wait for page load and settled scroll frames; context-loss is dispatched after renderer initialization; development route assertions use the normal navigation timeout. No application errors were suppressed, no layout overflow was globally hidden, and no screenshot baseline was approved to bypass a failure.

Motion's development message announcing deliberately enabled reduced motion is informational, not a React or WebGL failure. Next's image advisories for the lazily loaded decorative footer and shared product thumbnail after scripted scrolling, plus a fixed-background sizing advisory during resizing, are retained as advisories rather than hidden. The footer is intentionally not eagerly downloaded on every long page just to silence the scrolling heuristic. Background geometry is preserved. These notices are not field Core Web Vitals measurements. Full console/network results are retained so that this distinction can be audited.

## Limits

Requirement 14 remains UNVERIFIED as a complete end-to-end production claim: no authorized live customer tokens, real provider test transaction, valid production password, email delivery sandbox or every possible administrative role/state is available. The available local state, authorization, billing and browser regressions were executed; these do not establish that every external production integration is operational. The email-delivery script was not invoked because it can send real messages. No push, deployment, database migration or real order submission was performed.

## Final command results and status counts

- Default production build: passed, 62 static outputs, including TypeScript validation.
- Standalone `npm run typecheck`: passed.
- `npm run lint`: passed, zero errors and four pre-existing unused-variable warnings (three in icon tooling, one in protected hands code). No lint rule was weakened to remove them.
- `npm run test:ecosystem`: 25 tests passed, zero failed, using disposable databases/services.
- `npm run test:ecosystem:e2e`: eight tests passed after the runtime fixes. A subsequent public-suite run passed all four public tests, including the added mobile-menu/keyboard test. Together these establish nine distinct passing browser regressions: five admin/security and four public.
- Development route audit: 140 index-route/viewport combinations passed, zero layout/runtime/hydration failures. Every page was scrolled end to end. Zero console errors and zero failed browser network requests. All header/material/section/padding/nested-overflow assertions passed; the largest footer boundary difference was 0.5px from fractional layout rounding.
- Live visual lifecycle: desktop canvas present, mobile static fallback, offscreen canvas unmounted and context-loss fallback all passed; no runtime errors or console messages in that focused run.
- Desktop sidebar bottom: reachable by vertical scrolling; `clientWidth=358`, `scrollWidth=358`, no horizontal overflow; preview radius 24px. Evidence: `builder-bottom.json` and screenshot.
- Protected assets: 11 files match Git; protected composition rules match; SHA-256 values recorded. Audit snapshots also confirm no changes during verification.
- Published detail matrix: all ten requested widths passed, including both logo targets, header material/geometry and document overflow. This adds ten unique route/viewport checks to the 140 index checks: **150 total, zero failed**. Evidence: `artifacts/final-qa/details.json`.

Index routes tested: `/`, `/blog`, `/builder`, `/bundles`, `/compare`, `/contact`, `/english-words`, `/favorites`, `/learn`, `/order`, `/portfolio`, `/privacy`, `/services`, `/templates`. The actual published detail found in the rendered links is `/templates/jhlk`; no invented slug or token was used.

Screenshot evidence includes mobile/desktop Home, Templates, Builder, application, contact, process and footer; full-page Home captures; the live material, sidebar bottom and published template detail. Files are under `artifacts/final-qa`. No automatic visual baseline approval occurred.

**Final requirement counts: PASS 14; FAIL 0; PARTIAL 0; REGRESSION 0; UNVERIFIED 1.** Requirement 14's local scenarios pass and the observed hydration regressions are corrected; its complete live-production claim remains unverified for the reasons above. No known failure remains in the available local test coverage.
