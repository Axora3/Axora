# AXORA test report

2026-11-24. Final results are actual local executions.

| Command/check | Baseline | Final | Exit |
| --- | --- | --- | ---: |
| npm run typecheck | passed | passed (next typegen + tsc) | 0 |
| npm run lint | 0 errors, 4 warnings | same | 0 |
| npm run test:ecosystem | 25 passed | 35 passed, 0 failed/skipped | 0 |
| npm run test:ecosystem:e2e | 9 passed | 19 passed, 0 failed/skipped | 0 |
| npm run build via e2e webServer | passed | passed after final source changes | 0 |
| AXORA_DIST_DIR=.next-full-audit-build npm run build | not a baseline command | independent local-config build passed before the final small fallback/wrapper corrections; final fixture build recompiled those | 0 |
| npm audit --json | zero advisories | zero advisories; versions unchanged | 0 |
| npm ls --depth=0 | completed, 6 optional extras | package versions unchanged | 0 |
| protected assets + archive checks | existing baseline | 24 visuals /11 protected files + composition /72 archived copies match | 0 |
| git diff --check | not recorded initially | passed | 0 |

**Total formal tests: 54 passed, 0 failed, 0 skipped.** Ten new unit/database tests and ten new browser tests; six new unit-test files, one browser suite and one shared fixture-auth helper. Fixtures were extended only inside tests, including actual contact-table SQL and notification PATCH persistence. Production code was not replaced by mocks.

## Unit/database cases

Existing 25 tests cover calendar/revenue buckets, billing rules, receipt binding, disposable ecosystem migration, RLS and lifecycle/settlement idempotency. New cases cover:

- Interrupted JSON streams, malformed/oversized bodies.
- Valid/damaged order drafts, consent stripping, blocked storage getter and malformed JSON.
- Bad phone syntax and supported local/international formatted numbers.
- Concurrent standard checklists: one success, one 23505, exactly seven rows.
- Unconfigured download GET/POST, invalid token and cross-origin denial.
- Actual initial order/intake SQL: create/retry/conflict, attachment path binding, rollback, private permissions and rate limits.

## Browser/integration cases

The nine existing tests and ten added tests exercise header/dock/menu/home navigation, hydration, auth denial, fixture registration/Factory intake, builder live preview and reset, dialog focus, contact/login validation, order draft storage failure, both stale-logo race branches, twenty Builder type/style combinations across six palettes, three device previews, Cyrillic persistence and transfer to the order form, thirteen handler boundaries, contact database create/duplicate/conflict/validation, notification read state/badge persistence, all admin list pages at fifteen widths, representative axe checks and all private dynamic route invalid identifiers.

The component count is **unavailable**, because no per-component instrumentation was installed. Explicitly exercised integrations include SiteHeader, MobileNav, MobileTabBar, SiteFooter, Builder, BuilderProvider, DemoPreview, OrderForm, ContactForm, LoginForm, AdminShell, AdminNotifications, NotificationPreferences, NotificationReadControl, chart/table rendering and EcosystemConsole. Statement/branch coverage percentages are **not measured**. Route-pattern coverage is not code coverage.

## Routes/responsiveness and visuals

Recorded URLs: 49; page patterns exercised: 45/45, including missing/invalid data states. 390 public/dev +240 authenticated admin =630 layout observations. No final overflow; no uncaught public/admin matrix errors. All before/after common screenshots (38) have matching dimensions. No claim of pixel-perfect identity, exhaustive option combinations, all data-bearing admin CRUD or full manual visual inspection of every element.

## Accessibility and engines

Axe-core automatic tagged checks: six routes ×two widths, recorded defects corrected; final specific rule regressions passed. Chromium and WebKit core workflows passed; Firefox binary installed but process launch fails with spawn UNKNOWN. No physical mobile devices, assistive technology sessions or complete WCAG conformance assessment. WebGL normal/disabled/context-loss checks passed in Chrome.

## Performance

- 390px run 1: LCP 708ms, CLS 0, transferred JS 610411 bytes.
- 390px run 2: LCP 416ms, CLS 0, transferred JS 610411 bytes.
- 390px run 3: LCP 408ms, CLS 0, transferred JS 610411 bytes.
- 1440px run 1: LCP 616ms, CLS 0, transferred JS 548338 bytes.
- 1440px run 2: LCP 612ms, CLS 0, transferred JS 548338 bytes.
- 1440px run 3: LCP 352ms, CLS 0, transferred JS 548338 bytes.

Production fixture build, local unthrottled Chrome, reduced motion, concurrent QA. Initial high-load desktop LCP 4048ms is retained in runtime-probes-initial.json; later samples do not constitute a field performance guarantee. INP is unavailable.

## Failure history and corrections

Intentional red tests reproduced stream failure, phone validation, unconfigured download, damaged/blocked storage and stale logo. A draft-type implementation initially caused TS2322 (registered 006), then passed. The expanded admin sweep found a missing landmark (010), then a hidden-table overflow (011), both fixed and rechecked. An existing Builder selector matched visible plus Next Activity-cached hidden inputs; installed framework documentation confirms this behavior, so only the active-control selector changed, keeping its expected persisted value. A new public-intake test initially supplied invalid attachment field q16; the fixture was corrected to the schema's logo field q22, with no production constraint changes. A live dev network-idle wait timed out; document-ready traversal completed and retained all error/overflow observations. Firefox's launch failure is an environment limitation, not a passed engine test.

Raw evidence: final-unit.log, final-e2e.log, final-types.log, final-lint.log, production-build.log, api-results.json, admin-layouts.json, admin-dynamic-routes.json, routes-before.json, routes-after.json, accessibility.json, accessibility-after.json, compatibility.json, source-graph.json, performance.json, client-secret-scan.json, visual-layout-comparison.json and screenshots under artifacts/full-audit.

## Evidence retention note

Initial red-test observations are summarized from captured tool output in initial-reproductions.json. The first draft recheck reused its before filenames; those recheck files were relabeled as after, and the original draft before screenshots are unavailable. The original error messages remain documented; no screenshot is represented as before when it was captured after correction.
