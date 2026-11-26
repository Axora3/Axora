# AXORA order workflow — verification

2026-11-25 intake follow-up: live read-only diagnosis confirmed PGRST205 on the missing quotation settings table. Saved intake now succeeds with a durable pending marker and attachment response, and the worker recovers the quote after settings become available. New recovery + existing normal intake targeted browser tests: **2 passed**, production build succeeded; TypeScript and targeted lint passed. See `AXORA_ORDER_INTAKE_RECOVERY_REPORT_MN.md` and AXORA-BUG-023. Earlier full-suite results below remain the historical baseline, not a claim that all browser suites were repeated for this narrow follow-up.

Date: 2026-11-25. Only disposable local databases, synthetic accounts and a loopback SMTP capture server were used. No production migration, real payment or customer email was performed.

## Automated results

| Check | Result |
|---|---|
| `npm run test:ecosystem` | 39 passed, 0 failed |
| `npx playwright test -c playwright.orders.config.ts` | 4 passed, 0 failed; production build succeeded |
| `npm run test:ecosystem:e2e` | 19 passed, 0 failed; production build succeeded |
| `npm run lint` | 0 errors, 4 pre-existing warnings |
| `npm run typecheck` | Passed (Next route generation and TypeScript) |
| `node scripts/check-protected-assets.mjs` | 11 protected files unchanged; composition unchanged |
| `node artifacts/cleanup/verify-archive.cjs` | 72 archived files / 21,168,799 bytes verified; 24 protected assets unchanged |
| `node artifacts/order-workflow/style-check.cjs` | Navy skeleton, no reduced-motion animation, thin scrollbar, forced-colors fallback passed |
| Firefox launch | Unavailable: `browserType.launch: spawn UNKNOWN`; not counted as a passing browser |

The four new browser tests cover: (1) responsive Builder/menu/catalog in Chromium and WebKit; (2) the real admin/customer lifecycle and five actual SMTP-accepted messages captured locally; (3) persisted editable owner policy; (4) real order intake API, safe duplicate retry, private tracking response and cross-origin rejection. The final full suite passed all four. After adding SMTP failure/retry coverage and refreshing the admin DTO after the email worker, the affected lifecycle test was re-run with a new production build: 1 passed. A forced local SMTP 451 failure became visible as failed, admin retry succeeded on attempt 2, and exactly five unique messages were received across the complete flow.

There are 62 distinct main tests (39 unit/database + 19 existing browser + 4 new browser); targeted re-runs are not counted twice.

## Pricing and SQL coverage

- Starter / Business / Premium prices, page limits and maximum planning durations; all 12 individual addon prices/durations.
- Additional pages, explicit package override, included functions and duplicate selections.
- Rush applies to one-time development only; monthly maintenance remains separate; configured discount; unknown/custom requirements and unknown extra-revision duration require review.
- Forged item totals are ignored; quantity/price/aggregate bounds and discount validation.
- Ulaanbaatar date boundary, weekends, upper package effort, FIFO workload, parallel capacity, buffer, unknown workload conservative handling.
- Actual additive migrations on PGlite PostgreSQL, replay without overwriting settings, shared catalog validation regression.
- Atomic draft → sent → customer acceptance; immutable accepted snapshot; settings changes do not reprice it.
- Customer revision message visible to admin, rejection, newer quote version and stale acceptance rejection.
- Legacy manual quote converted only on customer decision, with expected amount validation.
- Bank-not-verified rejection; reported transfer remains unpaid; exact amount and schedule revision checks; one project created on verification.
- Actual start, actual completion, separate delivery and approved deadline change; six transactional outbox events in the SQL scenario. Browser scenario has five without the optional deadline-change event.
- Payment review feedback, corrected transfer report, recorded remaining effort/priority, cancellation and rejection of commands after cancellation.
- Idempotency payload conflict, anonymous permission denial, non-admin command denial, RLS private rows, direct managed-order payment/project bypass rejection.
- Outbox claim lease, no concurrent duplicate claim, wrong lease rejection, expired/uncertain sending quarantined for explicit review.

SMTP Inbox/deliverability at a real provider is not claimed. The local browser test asserts five received messages and five unique deterministic Message-IDs. SQL tests cover the ambiguous-delivery lease path. Real bank settlement and receipt reconciliation remain manual admin operations.

## Responsive evidence

`artifacts/order-workflow/after-ui.json` contains measured DOM geometry for Chromium widths 320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920; WebKit widths 390, 1024, 1440. All use a 1000px-high viewport. Every tested width had no root horizontal overflow.

At 1440px and 1920px the original Builder produced a 2160px document. After correction, desktop documents are 1000px, workspace bottoms 964–968px, with separate native panel scroll. Mobile content remains vertically scrollable.

Desktop dropdown right edge aligns with its trigger (≤2px tolerance), sits at least 8px below it, remains inside the viewport, and handles End/Escape/focus. Catalog's six fixture products filter to three free products through both desktop fieldsets and mobile sheet.

Before: `artifacts/order-workflow/baseline-ui.json`, `builder-before-*.png`, `dropdown-before.png`.

After: `artifacts/order-workflow/after/builder-{chromium,webkit}-{390,1440}.png`, `dropdown-{chromium,webkit}.png`. Both desktop screenshots were visually reviewed. `style-check.json` confirms #162031/#29384d skeleton tokens, `animation:none` under reduced motion, `scrollbar-width:thin`, and `auto` colors/width under forced colors.

## Debugging and limitations

Intermediate failures were corrected before final verification: missing fixture Storage scaffolding, invalid fixture consent/schema fields, fixture-only module/channel/selector/breakpoint issues, explicit workload SELECT permission, asynchronous handover test race, and a real locale hydration mismatch. These intermediate failures are not reported as passing tests.

Confirmed product issues are individually recorded as AXORA-BUG-012–022 in `AXORA_BUG_REGISTER.md`; entries 001–011 remain intact. A new catalog SQL guard migration uses `array_append` to preserve meaningful `publish_requirements` validation instead of PostgreSQL 22P02. The new unnumbered quotation fields are included in the admin prompt without an `undefined.` prefix.

Local sandbox Node lookup returned `uv_os_get_passwd ENOMEM`; the same local checks were run successfully with approved process execution. This was an execution-environment limitation, not an application memory diagnosis.

Production prerequisites: apply the two additive migrations after staging/backup review; verify real bank details in Admin Settings; set a public HTTPS `NEXT_PUBLIC_SITE_URL`; validate existing SMTP credentials with the intended provider; configure the worker scheduler. `DATABASE_URL` and `NEXT_PUBLIC_SITE_URL` were unset locally. No secret values appear in these artifacts.
