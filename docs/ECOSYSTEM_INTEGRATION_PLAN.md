# AXORA ecosystem integration plan and gaps

2026-11-11. Scope: Axora3/Axora only. Preserve the existing Next.js 16 application, digital-template catalogue, questionnaire, admin workflow and legacy one-time payment/download flow. Other repositories are read-only dependencies for this task.

## Inspection evidence

- Existing Supabase migrations define website_orders, website_projects, admin_users/is_admin, template_requests, admin_audit_log, manual one-time order/template payments and single-use downloads. Do not reuse digital-product templates as the Factory website-template registry.
- Read-only configured Supabase visibility check passed for website_orders, template_requests, templates, website_projects, project_milestones, contact_messages, admin_notifications, admin_project_overview, site_content and admin_audit_log. It returned no customer records and does not certify RLS or function versions.
- Admin session queries already use authenticated Supabase clients and is_admin RLS. Preserve that guard and existing visual components/navigation.
- Factory supports authenticated intake, options, generation, state polling, approval and confirmation. Its deterministic requirement/matching/design logic remains there. AXORA only translates/reviews protocol answers and mirrors linked results.
- The dashboard has no service-authenticated site/access provisioning API. User explicitly limited changes to Axora. Implement an authenticated HTTP contract adapter and retryable tasks; 404/unconfigured/unverified receipts must remain blocked, never reported as provisioned.
- Existing dashboard billing adapter expects GET /sites/:site_id/billing with a server bearer token. Implement that authoritative read contract in Axora.
- Existing legacy one-time payments permit manual confirmation. New recurring subscription payments use a separate ledger and only verified provider events can mark them paid. Do not route new subscriptions through legacy manual actions.

## Incremental implementation

1. Add isolated ecosystem protocol/domain contracts, deterministic subscription periods and provider verification adapter. No Factory ranking/requirement inference is copied into Axora.
2. Add an additive migration for customers, linked sites/projects, Factory mirrors, requirements, durable integration tasks, subscription plans/periods, verified payment events and audits. Use FKs, unique idempotency, indexes, RLS and service-only transactional RPCs. Do not apply it to the live database during this task.
3. Connect Factory through authenticated bounded server requests and idempotent tasks. Poll only locally linked orders/projects; verify site/customer/order bindings before recording results. Only an authoritative delivered confirmation timestamp starts one trial.
4. Add separate dashboard site preparation (before website QA; no customer access) and access provisioning (after confirmed delivery). Track private spreadsheet mapping, health, sync, retries and actual access receipt. Missing remote endpoint stays explicitly blocked.
5. Add recurring invoice creation, signed provider notices plus server-side payment lookup, atomic settlement/replay protection, cancellation/renewal/overdue and configurable write-suspension policy. No deletion of websites/data and no fake gateway success.
6. Extend existing admin UI with ecosystem customers/orders/projects/templates/jobs/providers/QA/preview/delivery/access/Sheets/subscriptions/payments/audit views using current design components. Preserve all existing routes.
7. Test protocol, failure/replay/tenant and delivery-trial/payment invariants, disposable PostgreSQL migration/RLS where available, API/build/UI checks. Separate fixtures from live results and document deployment/remote dependencies.

## Delivery and integration boundaries

Factory/Google site preparation may be needed before generation QA. Customer dashboard membership/access is granted only after actual confirmed delivery. A preview, build, order submission or coding run must never start the trial. AXORA owns billing status, verified payment history and cancellation policy; the Factory never receives billing authority. Google credentials stay in the dashboard/backend; AXORA tracks server-side mapping and health only.
