# AXORA full audit

2026-11-24, Asia/Ulaanbaatar. Audit and fixes only; existing uncommitted changes retained. No production data writes, push, deployment, price changes or artwork regeneration.

## Architecture and scope

Next 16.4.6 App Router / React 19.3, TypeScript, Tailwind 4.3.3, npm lockfile. Public content/catalog and session-bound admin use Supabase; privileged clients are server-only. Public APIs validate bodies and use database idempotency/rate-limit guards. Admin actions recheck membership and use session/RLS clients; ecosystem actions additionally enforce same-origin and shared-service authentication. Motion/GSAP, a persistent 2D hands rig and the in-view R3F/Three metal scene implement decorative visuals.

All source paths were inventoried, with framework entrypoints retained. The runtime graph analyzed 256 JS/TS modules, 84 client entrypoints and 138 reachable client modules. No server-only module crossed the modeled client boundary; use-server action boundaries stop traversal. Compiler/linter cover application source. Semantic review concentrated on every route handler, admin action/auth boundaries, shared validation/state, database policies/RPCs, builder/order/upload flows, notifications, layout and visual lifecycle. This is not a claim of formal verification of every source statement.

## Baseline

TypeScript passed; ESLint passed with four pre-existing unused-symbol warnings (three in the icon generator, one byte-protected hands-rig parameter). Unit/database suite: 25 passed; existing browser suite: 9 passed, with production build performed by its webServer command. npm audit returned zero reported vulnerabilities. npm ls --depth=0 completed, listing six extra optional WASM-platform packages without invalid top-level peer dependencies; no forced pruning/upgrades performed.

## Findings and corrections

- AXORA-BUG-001: Хүсэлтийн урсгал тасрахад API хяналтгүй алдаа гаргасан — P2, VERIFIED.
- AXORA-BUG-002: Эвдэрсэн эсвэл хаалттай хадгалалт анкетыг унагасан — P2, VERIFIED.
- AXORA-BUG-003: Footer-ийн лого холбоос уншигдах нэргүй байсан — P2, VERIFIED.
- AXORA-BUG-004: Зарим текстийн өнгө дэвсгэрээс хангалттай ялгараагүй — P2, VERIFIED.
- AXORA-BUG-005: Утасны дугаарын шалгалт үсэгтэй утгыг зөвшөөрсөн — P2, VERIFIED.
- AXORA-BUG-006: Нооргийн эхний засвар TypeScript-ийн зөрчил үүсгэсэн — P3, VERIFIED.
- AXORA-BUG-007: Builder reset-ийн дараа хуучин лого буцаж гарсан — P2, VERIFIED.
- AXORA-BUG-008: Стандарт checklist зэрэг нэмэгдэхэд давхардсан — P2, VERIFIED.
- AXORA-BUG-009: Backend тохиргоогүй үед татах холбоос exception гаргасан — P2, VERIFIED.
- AXORA-BUG-010: English Words admin хуудсанд үндсэн агуулгын landmark байгаагүй — P3, VERIFIED.
- AXORA-BUG-011: Далд хүснэгт 320px dashboard-ийг өргөсгөсөн — P3, VERIFIED.

Ten pre-existing confirmed findings plus one temporary development TypeScript regression; severity totals: P0=0, P1=0, P2=8, P3=3, P4=0. The bug register preserves reproduction, root cause, lines, changes and evidence for all eleven.

## Routes and layout

49 distinct recorded URL states; 45/45 discovered page patterns exercised. Dynamic admin records include invalid-ID cases and a real disposable notification detail. Valid production data CRUD is not exhaustively exercised by pattern coverage. Streamed Next notFound pages can legitimately return an HTTP 200 after streaming starts; error-page content and navigation were inspected, rather than treating that framework behavior as a missing-route bug.

| Page pattern | Source | Exercised |
| --- | --- | --- |
| /admin/activity | src/app/admin/(panel)/activity/page.tsx | yes |
| /admin/content | src/app/admin/(panel)/content/page.tsx | yes |
| /admin/ecosystem | src/app/admin/(panel)/ecosystem/page.tsx | yes |
| /admin/english-words | src/app/admin/(panel)/english-words/page.tsx | yes |
| /admin/library | src/app/admin/(panel)/library/page.tsx | yes |
| /admin/marketing | src/app/admin/(panel)/marketing/page.tsx | yes |
| /admin/notifications | src/app/admin/(panel)/notifications/page.tsx | yes |
| /admin/notifications/[id] | src/app/admin/(panel)/notifications/[id]/page.tsx | yes |
| /admin/orders | src/app/admin/(panel)/orders/page.tsx | yes |
| /admin/orders/[id] | src/app/admin/(panel)/orders/[id]/page.tsx | yes |
| /admin | src/app/admin/(panel)/page.tsx | yes |
| /admin/payments | src/app/admin/(panel)/payments/page.tsx | yes |
| /admin/projects | src/app/admin/(panel)/projects/page.tsx | yes |
| /admin/projects/[id] | src/app/admin/(panel)/projects/[id]/page.tsx | yes |
| /admin/settings | src/app/admin/(panel)/settings/page.tsx | yes |
| /admin/support | src/app/admin/(panel)/support/page.tsx | yes |
| /admin/support/[id] | src/app/admin/(panel)/support/[id]/page.tsx | yes |
| /admin/template-requests | src/app/admin/(panel)/template-requests/page.tsx | yes |
| /admin/template-requests/[id] | src/app/admin/(panel)/template-requests/[id]/page.tsx | yes |
| /admin/templates/new | src/app/admin/(panel)/templates/new/page.tsx | yes |
| /admin/templates | src/app/admin/(panel)/templates/page.tsx | yes |
| /admin/templates/[id]/edit | src/app/admin/(panel)/templates/[id]/edit/page.tsx | yes |
| /admin/login | src/app/admin/login/page.tsx | yes |
| /blog | src/app/blog/page.tsx | yes |
| /blog/[slug] | src/app/blog/[slug]/page.tsx | yes |
| /builder | src/app/builder/page.tsx | yes |
| /bundles | src/app/bundles/page.tsx | yes |
| /bundles/[slug] | src/app/bundles/[slug]/page.tsx | yes |
| /compare | src/app/compare/page.tsx | yes |
| /contact | src/app/contact/page.tsx | yes |
| /dev/admin-preview | src/app/dev/admin-preview/page.tsx | yes |
| /dev/design-system | src/app/dev/design-system/page.tsx | yes |
| /english-words | src/app/english-words/page.tsx | yes |
| /favorites | src/app/favorites/page.tsx | yes |
| /learn | src/app/learn/page.tsx | yes |
| /learn/[slug] | src/app/learn/[slug]/page.tsx | yes |
| /order | src/app/order/page.tsx | yes |
| /order/pay/[token] | src/app/order/pay/[token]/page.tsx | yes |
| / | src/app/page.tsx | yes |
| /portfolio | src/app/portfolio/page.tsx | yes |
| /portfolio/[slug] | src/app/portfolio/[slug]/page.tsx | yes |
| /privacy | src/app/privacy/page.tsx | yes |
| /services | src/app/services/page.tsx | yes |
| /templates | src/app/templates/page.tsx | yes |
| /templates/[slug] | src/app/templates/[slug]/page.tsx | yes |

Public/dev/missing-content sweep: 26 URL states ×15 widths = 390 cases. Authenticated admin sweep: 240 cases. Widths: 320, 360, 375, 390, 414, 430, 640, 768, 820, 1024, 1280, 1440, 1536, 1920, 2560. No remaining document overflow, uncaught page errors or failed requests in the final public sweep. A network-idle wait timed out on a live dev preview; re-running with document readiness completed, without suppressing error/overflow observations.

## APIs, security and database

All 13 route-handler patterns inspected and exercised at least at invalid/authentication boundaries. 20 explicit boundary responses recorded, in addition to fixture customer/admin integration workflows.

| Endpoint | Methods |
| --- | --- |
| /api/admin/ecosystem/process | POST |
| /api/admin/ecosystem/registry | POST |
| /api/admin/ecosystem | GET, POST |
| /api/admin/search | GET |
| /api/contact | POST |
| /api/english-words/orders | POST |
| /api/integrations/billing/sites/[siteId]/billing | GET |
| /api/integrations/payments/custom/notice | POST |
| /api/jobs/ecosystem | POST |
| /api/orders/attachments | POST |
| /api/orders | POST |
| /api/template-requests | POST |
| /download/[token] | GET, POST |

Reviewed server key separation, validated auth.getUser, admin membership RPC, per-user notification filters, server action guards, same-origin ecosystem writes, signature freshness/HMAC, constant-time secret comparison, site/customer/payment receipt binding, output sanitization, upload grants/MIME inspection, one-time download logic and no-store headers. No confirmed P0/P1 security vulnerability was reproduced. Current npm advisory database reports 0 vulnerabilities; this is not a guarantee of security.

Actual public intake table/RPC/RLS SQL was run in disposable PGlite (hosted Storage setup excluded; core gen_random_uuid replaces the unavailable pgcrypto extension declaration). Tests cover order creation, retry/conflict, attachment ownership path, transaction rollback, private table/function access denial and limiter thresholds. Ecosystem migration tests cover delivery/trials, settlement idempotency, authorization/RLS and external receipt binding. Production policies/storage deployment were not queried or changed. English Words shared remote membership schema is not present here; its live operations remain a coverage limit.

Production client scan: 70 files, 2 configured private secret values checked internally, zero matches. Values were never printed or copied into reports. This scan is limited to locally configured secrets and tested build output.

## Visuals, accessibility and performance

Existing background/dotted artwork/hands, animation composition, logo vectors and 24 public/source visual checksums remain identical. Eleven protected files also match the existing guard, and all 72 external archive entries verify. Mobile cloud offset retained. No full-width glass/duplicate public header was introduced; builder toolbar, dock rules, focus and fallback behavior remain tested.

38 common before/after screenshot pairs have identical dimensions. New text-contrast changes are intentional accessibility corrections, not a redesign. A contact sheet was visually reviewed; exact screenshot pixel equality is not asserted because of font rasterization and animation. Baseline and final screenshots are retained.

Axe-core WCAG-tag checks on six representative routes at 390/1440 identified and then cleared the recorded contrast and link-name defects. The production regression checks names/labels/buttons/contrast. Other pages received route/layout checks, not a full screen-reader or manual WCAG audit.

Chromium and WebKit passed core compatibility workflows at five sizes. Firefox installed, but launch fails with spawn UNKNOWN. Normal WebGL rendered one brand canvas; context-loss removed it and preserved the vector fallback. WebGL-disabled mode displayed the vector fallback without uncaught page errors. These are local Chrome checks, not physical-GPU certification.

Local performance: six production samples recorded in performance.json, no throttling, reduced motion. Mobile LCP 408–708ms; desktop 352–616ms; six CLS values 0. An initial simultaneous-build sample was 4048ms/CLS 0.003 on desktop and is retained separately; do not infer field improvement from these variable lab runs. Initial transferred JS was about 610KB mobile /548KB desktop. Field INP, real-user CWV, slow-device/network distributions and production query plans remain unavailable.

## Remaining risks and limits

Existing AdminShell ↔ AdminTopBar runtime import cycle confirmed by AST graph. It is functioning in tested paths, with no reproduced initialization failure, and was preserved rather than treating every cycle as a broken feature.

No remaining locally reproduced registered bug is unresolved. This does not mean zero undiscovered bugs or complete production readiness. Hosted storage transport, real mail/payment delivery, all business-data CRUD permutations, production migrations/English Words membership, physical devices and assistive technologies need an authorized staging/live verification environment. No aggressive live security test or real customer submission occurred. No test assertions were weakened to conceal failures: a cached-route selector was scoped to the visible active input following installed Next Activity documentation; all value assertions remain.

## Files and evidence

Application changes:

- src/lib/server/http.ts
- src/lib/order/draft.ts
- src/components/order/OrderForm.tsx
- src/components/site/SiteFooter.tsx
- src/components/home/foreground.css
- src/app/cinematic.css
- src/app/admin-refinement.css
- src/lib/requests/validation.ts
- src/lib/order/questions.ts
- src/lib/requests/phone.ts
- src/components/builder/BuilderProvider.tsx
- src/app/admin/project-actions.ts
- src/lib/admin/standard-checklist.ts
- src/app/download/[token]/route.ts
- src/app/admin/(panel)/english-words/page.tsx
- src/app/admin/(panel)/error.tsx
- src/components/admin/DashboardInsights.tsx

Tests:

- tests/ecosystem/http-boundaries.test.ts
- tests/ecosystem/order-draft.test.ts
- tests/ecosystem/contact-validation.test.ts
- tests/ecosystem/standard-checklist.test.ts
- tests/ecosystem/download-availability.test.ts
- tests/ecosystem/public-intake-database.test.ts
- tests/ecosystem/browser/audit.spec.ts
- tests/ecosystem/browser/fixture-auth.ts
- tests/ecosystem/service-fixture.ts
- tests/ecosystem/browser/public.spec.ts

Reports: AXORA_BUG_REGISTER.md, AXORA_FULL_AUDIT_REPORT.md, AXORA_TEST_REPORT.md, AXORA_BUG_FIX_REPORT_MN.md, AXORA_AUDIT_SUMMARY.json. Read-only diagnostics, synthetic fixtures, logs and screenshots are under artifacts/full-audit. No production secrets or database dumps were saved.
