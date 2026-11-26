# AXORA UI correction report

## Root causes and corrections

- **Section panels:** Process and featured templates explicitly used `border-y border-line bg-surface`; service/contact/why sections used a full-width `bg-band`; the English Words introduction and several page introductions/CTAs added decorative panel wrappers. Removed inappropriate backgrounds, borders, aurora elements and panel classes at their source. Process tabs, italic heading, descriptions, three numbered/icon steps and connecting lines remain. Form, purchase, product, filter, dialog and navigation surfaces remain functional and styled.
- **Shared header:** Builder previously omitted `SiteHeader` and rendered its own primary bar. Order/payment pages requested compact variants; privacy/product details requested a mobile replacement; library helpers also rendered headers. The persistent `PublicSiteShell` now owns exactly one canonical header, outside route content. Page-owned instances and visual variants were removed. Admin and development routes retain their separate chrome. Route URLs are unchanged.
- **Logo navigation:** The entire canonical SVG lockup remains inside one named Next.js home link, with both monogram and wordmark clickable. No overlay or canvas intercepts it. Mobile-menu brand navigation still closes its dialog. Active navigation is derived centrally from pathname.
- **Builder toolbar:** Preserved device selection, pixel-width display, theme control, reset confirmation and order handoff as a named contextual region below the primary header. BuilderProvider and all state/commit/upload logic remain unchanged.
- **Sidebar overflow:** Baseline Chrome measurement found `clientWidth=379`, `scrollWidth=386`. The actual offenders were the 32px collapse containers, whose 45-degree rotation produced 45.25px transformed boxes extending past the sidebar. The container now stays still and circular; only the inner icon rotates. Added sidebar padding, constrained grid/flex children and form fields, responsive palette columns, a readable single panel surface and rounded geometry. No global horizontal-overflow suppression was introduced.
- **Cascade and tablet gutters:** The broad cinematic glass selector had greater specificity than transparent accordion rules, so the inner square backgrounds survived earlier styling. Removed accordion groups from that broad selector. At 768px, Templates and Services filter rows also overflowed by about 8px because their negative margins used the old 4vw gutter while their containers used the centralized gutter. Updated both rows at their source to use `--public-gutter` for padding and negative margins.
- **Footer gap:** The footer had a desktop minimum height of 680–980px even when content was shorter, plus mobile trailing dock-compensation padding. Removed that minimum and trailing empty compensation. Functional legal links retain clearance before the final decorative wordmark; the wordmark ends the document. Dock bottom offset and safe area are separate and unchanged. Body padding remains zero.
- **Spacing and geometry:** Public pages share a responsive 16–40px gutter and existing fluid section rhythm. Builder toolbar/sidebar/preview use explicit gaps, internal padding and 14/20/24px control/panel radii. The global `bg-surface` utility was not redefined. Its accidental inclusion in the broad cinematic glass selector was removed, allowing components to opt into glass intentionally.

## Modified files

- Shared navigation/layout: `src/components/cinematic/PublicSiteShell.tsx`, `src/components/site/SiteHeader.tsx`, `src/components/site/PageFrame.tsx`, `src/components/site/SiteFooter.tsx`.
- Builder: `src/app/builder/page.tsx`, `src/components/builder/Builder.tsx`.
- Section sources: `src/components/home/Process.tsx`, `src/components/home/WhyAxora.tsx`, `src/components/content/LibraryPages.tsx`, `src/app/page.tsx`, `src/app/services/page.tsx`, `src/app/contact/page.tsx`, `src/app/templates/page.tsx`.
- Removed page-owned header calls/imports: public home, templates/detail/not-found, order/payment, privacy, services, contact, English Words and root not-found pages, plus the shared library helpers listed above.
- Shared styling: `src/app/cinematic.css`, `src/styles/axora-system.css`.
- Shared edge-to-edge filter rows: `src/components/templates/Catalog.tsx`, `src/components/services/SiteTypes.tsx`.
- Reproducible QA: `scripts/verify-global-ui.mjs`, screenshots and JSON under `artifacts/global-ui-fix/`.

## Preservation and audit

Inspected current source/diff and Git history, including the previous cinematic UI commit `87c5610`. Original background/dotted artwork files, hands assets, rig, animation and background composition were not edited. Brand geometry/assets, database schema, authentication, server actions, prices and business logic were not changed. No dependencies, effects, production data or fabricated records were added. Nothing was pushed or deployed.

Relevant installed Next.js guides for client boundaries and shared layouts were consulted. The existing local Sites workflow was followed without publishing.

## Verification

- Production build: passed, 62 static outputs.
- Existing isolated ecosystem/business tests: 25 passed.
- Existing authenticated browser suite: 4 passed, covering preference persistence, responsive admin chrome, Factory intake, and denied anonymous/cross-origin operations.
- Final lint/typecheck and public route matrix: see validation addendum below.

The public checker measures one identical header per viewport across routes, document and nested sidebar overflow, footer/document boundary, transparent process styling, brand navigation, process tabs, and builder selection/preview/device/collapse/reset/order-handoff behavior. Screenshots cover home, templates, builder, application, process and footer at mobile and desktop sizes.

No production order/payment is submitted by the visual checks. Published detail routes require actual published data; token-protected payment/download states require valid customer tokens. These are not fabricated. Chrome is available; Firefox/WebKit executables were unavailable in the earlier environment check. Native Safari and physical-device safe-area behavior are not verified.

## Final validation addendum

- Final production build passed, including strict TypeScript validation and 62 static outputs. Standalone typecheck passed. Lint passed with zero errors and four pre-existing unused-variable warnings in icon tooling and hands code.
- Chrome route matrix: **150 checks passed, zero failures**. Fourteen public index/workspace/form routes were checked at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px. One actual linked published template detail was discovered and checked at all ten widths as well.
- Each route had exactly one public header, with identical dimensions and placement within its viewport size. Both SVG portions of the brand were clicked across the matrix and returned to Home. Keyboard Enter navigation and mobile-menu brand navigation/close were also exercised.
- Document overflow and nested builder-sidebar overflow checks passed. Footer/document boundary gap was zero within rounding tolerance at every size. Process wrapper background was transparent, borders were zero and backdrop filter was `none`; both tracks rendered their correct three steps.
- Builder interactions passed: business type, style, palette, custom text, live preview, all three device controls, accordion collapse/reopen, order handoff, configuration persistence across navigation, reset cancellation and reset confirmation.
- Earlier test-selector failures were corrected to account for screen-reader step prefixes and field labels containing character counters; isolated browser inspection confirmed the UI behaviors themselves worked. Genuine tablet overflow failures were fixed at their source before the clean final run.
- Screenshots were inspected for process, mobile builder, desktop header/workspace and footer. Machine-readable results: `artifacts/global-ui-fix/results.json`; screenshots in the same directory. Existing fixture suites passed: 25 isolated business tests and 4 authenticated browser tests. These checks do not establish live provider availability or token-protected customer states without valid customer credentials.
