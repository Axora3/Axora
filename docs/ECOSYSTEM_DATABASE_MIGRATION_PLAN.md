# Database migration plan

Migration: supabase/migrations/20261111000000_ecosystem_integration.sql. Not applied to the configured live database. Existing migrations/schema were inspected first; read-only visibility checks passed for ten existing tables/views without retrieving customer records. That is not a production RLS or schema-drift certification.

The additive migration creates ecosystem customers/sites/private Sheets mappings/billing grants/plans/subscriptions/invoices/payments/provider events/tasks/command keys/remote registry/audit. Existing website_orders, website_projects, auth.users and admin_users are referenced with foreign keys; remote dashboard IDs are external references, not cross-database foreign keys. Existing table schemas and legacy payment flows are preserved.

Service-only RPCs implement command recording, leased task claims, fenced receipt finalization, verified payment settlement and scheduled status reconciliation. Authenticated roles receive only RLS-filtered reads; private tables are administrator-only. Customer reads require a linked auth identity. There is no browser write/settlement permission. Audit rows reject update/delete. Unique keys constrain mappings, commands, invoices and provider events; trial timestamps and plan amounts have constraints.

1. Back up and review actual staging schema/functions/roles, including is_admin and prerequisite migrations. Resolve drift before applying.
2. Apply all prerequisite migrations, then this migration in staging through the normal Supabase migration process. Do not run the repository's apply-all helper blindly against production.
3. Repeat actual Supabase Auth/RLS checks with admin and customers A/B, including denied foreign-site reads and service RPC execution. PGlite tests do not replace hosted-role validation.
4. Configure separate staging service credentials, verify remote contracts/idempotency, test delivery and verified payment replay, then approve a scheduled production rollout.
5. Start worker only after migration and service readiness. Confirm policies, indexes, task leases, audits and private mapping access.

Rollback strategy: disable new integration endpoints/navigation and stop scheduled workers first; preserve ledger, audit, customer sites and spreadsheet data. Do not delete financial records or automatically down-migrate new tables. Reconcile uncertain remote effects before retrying. No live migration or production deployment was performed in this task.
