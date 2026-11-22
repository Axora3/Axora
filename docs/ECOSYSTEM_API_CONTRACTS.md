# Ecosystem API contracts

All APIs use JSON. Secrets are server-only, HTTPS is mandatory outside explicit local tests, redirects are rejected, response sizes/timeouts are bounded. Source of truth for exact validation: src/lib/ecosystem/contracts.ts and connections.ts. Illustrative field names below are contracts, not live service receipts.

## Axora endpoints

- GET /api/admin/ecosystem: authenticated administrator summary through session RLS.
- POST /api/admin/ecosystem: same-origin administrator command {action, siteId, key, data}; key is a UUID idempotency key. Actions: register, requirements, prepare_site, submit, poll, generate, approve, confirm, provision_access, retry_sheets, invoice, cancel, resume, policy, retry_task. Action-specific validation is enforced server-side. Register binds an existing website order; clients never specify spreadsheet mappings or payment amounts.
- POST /api/admin/ecosystem/process: same-origin admin tick/one task.
- POST /api/admin/ecosystem/registry: authenticated proxy for Factory registry sync/register/verify/approve. Factory remains the decision authority.
- POST /api/jobs/ecosystem: Authorization: Bearer AXORA_ECOSYSTEM_JOB_SECRET, at least 32 characters; tick/one task. Protect scheduler credentials and do not invoke concurrently without capacity planning.
- GET /api/integrations/billing/sites/:siteId/billing: Authorization: Bearer AXORA_DASHBOARD_BILLING_TOKEN, plus a site/client billing grant created by a valid dashboard access receipt. Returns {site_id, as_of, confirmed_delivery_at, subscription:{status,plan,next_billing_at}, payments}. Unknown/ungranted site access is denied. Configure dashboard AXORA_BILLING_API to https://AXORA_HOST/api/integrations/billing. This service credential is trusted to read its granted sites; the dashboard must additionally enforce individual membership.

## Factory (existing independent service)

AXORA_FACTORY_URL is the origin; AXORA_FACTORY_ADMIN_TOKEN is the server bearer credential. Axora uses /api/orders (POST), /api/orders/:id (PUT), /api/orders/:id/options (GET), /api/orders/:id/generate (POST), /api/state (GET), and /api/projects/:id/approve or /confirm (POST). Mutations carry Idempotency-Key. External order ID/site ID and linked project IDs must match; unrelated state is not imported as site data. Registry requests are forwarded to Factory rather than independently ranked. The typed answers wire format carries reviewed order facts, not inferred defaults. Delivered timestamps must come from real Factory confirmation.

## Dashboard (required, currently unavailable)

AXORA_DASHBOARD_URL is the origin; AXORA_DASHBOARD_SERVICE_TOKEN authenticates service calls. Implement separately; no dashboard files were edited.

- POST /api/integrations/axora/v1/sites: prepare site/configuration/Sheets with access:none.
- GET /api/integrations/axora/v1/sites/:siteId: configuration and integration health.
- POST /api/integrations/axora/v1/sites/:siteId/sheets/retry: idempotent provisioning retry.
- POST /api/integrations/axora/v1/sites/:siteId/access: only after confirmed delivery; bind customer identity/membership.
- POST /api/integrations/axora/v1/sites/:siteId/access-policy: desired writes_suspended, delete_data:false; receipt {site_id,applied:true,writes_suspended} must match.

Provision receipts: site_id, customer_ref, business_type, enabled_modules, status (ready/pending/failed), integration_status (connected/pending/error), optional spreadsheet_id, last_successful_sync and configuration_version. Ready requires connected and a mapping. Active access receipts require site_id, customer_ref, dashboard_user_id, status, confirmed_delivery_at, identity_verified:true and matching customer_email. Never acknowledge success before the remote transaction commits. Store Idempotency-Key durably and reject changed requests using the same key. Return genuine 429/5xx failures; unsupported endpoints remain blocked.

## Custom payment bridge (must be deployed/configured)

AXORA_PAYMENT_API_URL is a base URL; AXORA_PAYMENT_API_TOKEN is a bearer credential. POST /invoices receives {reference,amount,currency} and Idempotency-Key, returns {id,payment_url,expires_at?}; payment_url must be HTTPS. GET /payments/:id returns {id,invoice_reference,merchant_id,status,amount,currency,paid_at}. invoice_reference must equal the provider invoice ID returned at creation. merchant_id must equal AXORA_PAYMENT_MERCHANT_ID. This is a provider-independent contract, not a claimed QPay connection.

POST /api/integrations/payments/custom/notice accepts {event_id,payment_id}, maximum 16 KB. x-provider-timestamp is epoch seconds or milliseconds; x-provider-signature is lowercase hex HMAC-SHA256 of timestamp + '.' + exact raw body using AXORA_PAYMENT_WEBHOOK_SECRET. Timestamp tolerance is five minutes. Axora queries the provider itself; the notice cannot supply a trusted amount/status. Canonical notice hashes provide replay idempotency independent of JSON whitespace. Reused event IDs with changed payload are rejected. Pending/failed/refunded lookups never create paid subscription coverage; refund lifecycle handling is pending.
