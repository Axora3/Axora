# Single-use template downloads

Before enabling purchase emails on the deployed site:

1. Configure `DATABASE_URL` locally (never commit it), then run:
   `node --env-file=.env.local scripts/apply-migrations.mjs 20261106200000_single_use_downloads.sql`
2. Set `NEXT_PUBLIC_SITE_URL` to the site's public HTTPS origin in the hosting environment. If absent, the production Vercel URL or the authenticated admin action's matching HTTPS Origin/Host is used. Localhost links are refused unless explicitly enabled with `ALLOW_LOCAL_DOWNLOAD_LINKS=true` in development; that mode only works on the same computer and is not customer delivery.
3. Deploy the application and verify the `/download/[token]` route is reachable.
4. Confirm a test purchase and check its automatic email. Opening the link must not consume it. Submitting the download must return the file once; the second submission must return HTTP 410. Explicitly resend as an admin: the new link must work once, while the previous link remains invalid.

`node scripts/test-single-use-download.mjs` exercises the route using mocked storage and database calls. It does not replace checking the PostgreSQL migration and concurrent redemption against a test database.

Each purchase has one token record. Only the SHA-256 hash is stored. Every explicit admin reissue replaces the token and resets consumed_at, granting one new download while invalidating the previous URL. Reconfirming an already paid purchase only retries an email when delivery_emailed_at is absent. Issuance requires an authenticated administrator and the existing payment gate. Redemption is service-role-only, locks the purchase row, rechecks payment/cancellation, then atomically marks the token consumed. File bytes are downloaded from private storage before redemption, so a storage error does not consume the token. The response contains the file, never a reusable Storage URL.

GET/HEAD do not consume the token, to avoid spending it on email preview scanners. The explicit POST consumes the entitlement when the server grants the download. A connection failure after that point can require support; the server cannot prove a browser saved the file. Possession of the secret link grants access, so recipients should not forward it. External URL products must be uploaded to private template storage before using this flow.

Previously sent Supabase signed URLs are outside this mechanism and remain valid until their original expiry. Do not promise single-use restrictions on those old links. A new token does not revoke them.

Emails use the plain-text format verified in the buyer's Inbox, with a formal Mongolian greeting, purchase confirmation, download instructions, expiration and support reply instructions. SMTP acceptance is not proof of Inbox delivery.
