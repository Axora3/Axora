# Ecosystem integration QA

Date: 2026-11-11. Repository: Axora3/Axora. Overall: NOT production_ready. All remote-service successes below use explicitly synthetic local fixtures unless stated otherwise. No production migration, payment, provisioning or deployment was performed.

| Check | Result | Evidence and limits |
|---|---|---|
| Existing schema inspection | Passed read-only visibility | Ten existing configured Supabase tables/views visible; no customer records retrieved. Not hosted RLS certification. |
| TypeScript | Passed | npm run typecheck; strict existing configuration. |
| ESLint | Passed with existing warnings | npm run lint: zero errors; three pre-existing unused-variable warnings in regen-icons generator scripts. Generated QA build/report directories are excluded. |
| Production build | Passed | npm run build using the normal .next directory; existing and new admin/API routes compile. No deployment performed. |
| Domain/security/database/HTTP integration tests | 20 passed, zero failed | npm run test:ecosystem. Actual additive SQL migration and RLS execute in disposable PGlite PostgreSQL; Supabase JS calls local HTTP fixtures. |
| Browser flows | 3 passed | npm run test:ecosystem:e2e against a production QA build, synthetic authenticated Supabase fixture and local service fixtures. |
| Responsive | Passed scoped checks | Ecosystem console at 375, 768 and 1440 pixels; no horizontal document overflow. Desktop/mobile screenshots inspected; Mongolian text, existing green design and admin navigation retained. Not a full-device audit of every legacy route. |
| Browser credentials | Passed scoped scan | 59 production static files scanned; zero files contained configured private environment values. Does not replace runtime/network penetration testing. |
| Runtime dependency audit | Passed | npm audit --omit=dev --audit-level=moderate: zero reported vulnerabilities at check time. |
| Real Factory/AI/preview delivery | Unverified | Actual deployment/credentials and administrator acceptance required. No fake coding/deployment results. |
| Real dashboard provisioning | Blocked | Required service-authenticated site/access/health/policy endpoints are absent in the independent dashboard. User restricted modifications to Axora. |
| Real Sheets CRUD/site refresh | Unverified | No live spreadsheet writes or customer-site changes; separate adapter and dashboard contract implementation needed. |
| Real payment settlement | Unverified | Custom HTTP adapter tested with fixtures; real provider bridge, merchant credentials and signed event acceptance required. |

## Verified behavior

- Order registration and preview receipts cannot start the trial. A bound delivered Factory receipt starts one immutable 30-day trial; duplicate receipt does not restart it. Access/invoice commands before delivery fail.
- PostgreSQL customer A cannot read customer B's subscription, private mappings/tasks, write payments or execute service settlement. Admin/service boundaries and append-only audit are exercised. Hosted Supabase RLS still requires staging verification.
- Cross-site Factory/dashboard receipts are rejected; private spreadsheet IDs cannot silently be reassigned. Active dashboard access requires identity proof; live identity reconciliation remains a deployment gate.
- Fixed server-side invoice pricing, matching provider merchant/payment/invoice/amount/currency/time, signed notices, forged/stale signatures and duplicate settlement are checked. Duplicate events/payments do not extend coverage again. Trial is retained for prepaid plans.
- Cancellation/overdue/suspension policies preserve site records and data. Calendar-month arithmetic handles leap/month-end boundaries.
- Actual processor flow through HTTP fixtures covers intake, generation, preview, approval/confirmation, dashboard invite, scoped billing reads, invoice creation and verified settlement. Dashboard 404 produces a blocked task and no fabricated access.
- Browser checks render every ecosystem section, register/review/submit an order, show blocked dashboard provisioning, and reject anonymous/cross-origin admin writes. Missing backend state displays errors instead of demo data.
- Private-key/service-role material is rejected from Factory specifications. Normal customer content remains accepted.

## Remaining acceptance gates and prioritized roadmap

1. Critical: review/apply migration in staging and repeat actual Supabase Auth/RLS tests with admin, customer A and customer B. Do not enable live worker before this.
2. High: separately authorize/implement the dashboard service endpoints, durable idempotency and identity verification; test correct site mapping, Google Sheets CRUD, quota/network failures and customer website revalidation end to end.
3. High: connect real Factory deployment, approve verified templates, run actual coding/QA/preview and confirm delivery. Verify only confirmed delivery starts trial and dashboard access.
4. High: onboard a real payment provider/bridge; validate merchant verification, signed retries, reconciliation, refunds/chargebacks and renewal policy. Automatic recurring charging is not implemented.
5. Medium: verify applied suspension receipts, job scheduling/monitoring, task exhaustion/manual recovery, secret rotation, pagination and load capacity. Current summaries are bounded, not a complete large-scale operations UI.
6. Release only after real cross-application tests and explicit production rollout approval. Keep production_ready false until every required live gate passes.

Reproduce using the commands above. Local logs ecosystem-*.log and generated test-results screenshots are ignored artifacts; committed tests/configuration are the reproducible evidence. The worker CLI exists; its production invocation was intentionally not executed against live Supabase. Existing legacy manual one-time payment actions are preserved and must not be used to mark new subscription invoices paid.
