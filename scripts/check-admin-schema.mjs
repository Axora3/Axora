// Read-only configuration check. Prints no keys, URLs, or customer records.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase server configuration. Run with --env-file=.env.local.');
  process.exitCode = 1;
} else {
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const checks = [
    ['website_orders', 'id,answers'],
    ['template_requests', 'id,payment_status,delivery_status'],
    ['templates', 'id'],
    ['website_projects', 'id'],
    ['project_milestones', 'id'],
    ['contact_messages', 'id,status'],
    ['admin_notifications', 'id,admin_id,event_type,title,body,entity_type,entity_id,created_at,read_at'],
    ['admin_project_overview', 'id'],
    ['site_content', 'key,draft,published'],
    ['admin_audit_log', 'id'],
  ];
  for (const [table, columns] of checks) {
    // GET with limit(0) returns no records but preserves PostgREST error bodies.
    // HEAD can omit the error body and leave error=null on a failed response.
    const { error, status } = await db.from(table).select(columns).limit(0)
      .abortSignal(AbortSignal.timeout(15000));
    const failed = !!error || status < 200 || status >= 300;
    console.log(`${table}: ${failed ? `FAIL (${error?.code || `HTTP ${status}`})` : 'PASS'}`);
    if (failed) process.exitCode = 1;
  }
  console.log('Read-only schema visibility check; does not verify admin-session RLS or migration function versions.');
}
