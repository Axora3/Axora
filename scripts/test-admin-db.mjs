// Isolated PostgreSQL regression checks. Pass an installed @electric-sql/pglite directory.
// Supabase Auth/Storage schemas are minimal local fixtures; no remote connection is used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const runtime=process.argv[2];
if(!runtime)throw new Error('Usage: node scripts/test-admin-db.mjs <path-to-@electric-sql/pglite>');
const {PGlite}=await import(pathToFileURL(path.join(runtime,'dist/index.js')).href);
const db=new PGlite();
let passed=0;
async function check(name,fn){await fn();passed++;console.log(`PASS ${name}`);}
async function denied(sql){await assert.rejects(()=>db.exec(sql),e=>e.code==='42501');}
const admin='10000000-0000-4000-8000-000000000001';
const other='10000000-0000-4000-8000-000000000002';
const second='10000000-0000-4000-8000-000000000003';
const order='20000000-0000-4000-8000-000000000001';
const product='30000000-0000-4000-8000-000000000001';
const request='40000000-0000-4000-8000-000000000001';
async function as(role,id=''){await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${id}',false);`);}
try{
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to public;
create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security;`);
for(const file of fs.readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).sort()){
 // PGlite has core gen_random_uuid; pgcrypto is not used by any exercised function.
 const sql=fs.readFileSync(path.join('supabase/migrations',file),'utf8').replace('create extension if not exists pgcrypto;','');
 await db.exec(sql);console.log(`APPLIED ${file}`);
}
await db.exec(`insert into auth.users values ('${admin}'),('${other}'),('${second}'); insert into public.admin_users(user_id) values ('${admin}'),('${second}');
insert into public.website_orders(id,idempotency_key,payload_hash,full_name,email,phone,business_name,preferred_channel,answers,consent_processing,consent_text_version) values ('${order}',gen_random_uuid(),repeat('a',64),'Test','test@example.test','99999999','Test business','email','{"schema_version":1,"q1":"original"}',true,'1');
insert into public.templates(id,slug,title,category,price) values ('${product}','test-template','Test template','Canva',1000);
insert into public.template_files(template_id,storage_path) values ('${product}','private/file.pdf');
insert into public.template_requests(id,template_id,idempotency_key,payload_hash,customer_name,contact_channel,contact_value) values ('${request}','${product}',gen_random_uuid(),repeat('b',64),'Test','email','test@example.test');
insert into public.contact_messages(idempotency_key,payload_hash,name,contact,message) values (gen_random_uuid(),repeat('c',64),'Test','test@example.test','Private message');`);
await check('all notification triggers accept their source table',async()=>{assert.equal((await db.query('select count(*)::int as n from admin_notifications')).rows[0].n,6);});
await check('historical/new orders are never automatically projects',async()=>{assert.equal((await db.query('select count(*)::int as n from website_projects')).rows[0].n,0);});
await as('authenticated',other);
await check('non-admin cannot read drafts or private records',async()=>{for(const table of ['site_content','website_orders','website_projects','admin_project_overview','admin_notifications','template_files'])assert.equal((await db.query(`select * from ${table}`)).rows.length,0,table);});
await check('non-admin cannot authorize paid delivery',async()=>{assert.equal((await db.query(`select authorize_delivery_link('${request}') as r`)).rows[0].r.status,'forbidden');});
await as('anon');
await check('anonymous role can read published content but cannot read draft',async()=>{assert.equal((await db.query('select published from site_content')).rows.length,1);await denied('select draft from site_content');});
await as('authenticated',admin);
await check('unpaid delivery recording fails without changing history or status',async()=>{
 const before=(await db.query('select count(*)::int as n from admin_audit_log')).rows[0].n;
 assert.equal((await db.query(`select record_delivery_link('${request}',24) as r`)).rows[0].r.status,'payment_not_confirmed');
 assert.equal((await db.query(`select delivery_status from template_requests where id='${request}'`)).rows[0].delivery_status,'not_sent');
 assert.equal((await db.query('select count(*)::int as n from admin_audit_log')).rows[0].n,before);
 assert.equal((await db.query(`select record_delivery_link('${request}',1) as r`)).rows[0].r.status,'invalid_duration');
});
await check('cancelled requests cannot record delivery links',async()=>{
 await db.exec('begin');
 try {
  await db.exec(`update template_requests set status='cancelled' where id='${request}'`);
  assert.equal((await db.query(`select record_delivery_link('${request}',24) as r`)).rows[0].r.status,'cancelled');
  assert.equal((await db.query(`select delivery_status from template_requests where id='${request}'`)).rows[0].delivery_status,'not_sent');
 } finally { await db.exec('rollback'); }
});
await check('admin can create one project explicitly',async()=>{await db.exec(`insert into website_projects(order_id) values('${order}')`);assert.equal((await db.query('select count(*)::int as n from website_projects')).rows[0].n,1);await assert.rejects(()=>db.exec(`insert into website_projects(order_id) values('${order}')`),e=>e.code==='23505');});
const project=(await db.query('select id from website_projects')).rows[0].id;
await check('project search joins the original customer without duplication',async()=>{const result=await db.query("select id,business_name from admin_project_overview where business_name ilike '%business%'");assert.equal(result.rows.length,1);assert.equal(result.rows[0].id,project);});
await check('admin cannot overwrite original questionnaire',()=>denied(`update website_orders set answers='{"schema_version":1}' where id='${order}'`));
await check('project dates and progress are constrained',async()=>{await assert.rejects(()=>db.exec(`update website_projects set progress_percent=101 where id='${project}'`),e=>e.code==='23514');await assert.rejects(()=>db.exec(`update website_projects set start_date='2026-11-02',target_completion_date='2026-11-01' where id='${project}'`),e=>e.code==='23514');});
await check('milestone CRUD records audit and prevents moving relationships',async()=>{await db.exec(`insert into project_milestones(project_id,title) values('${project}','Milestone')`);const id=(await db.query('select id from project_milestones')).rows[0].id;await db.exec(`update project_milestones set completed_at=now() where id='${id}'`);await denied(`update project_milestones set project_id='${project}' where id='${id}'`);await db.exec(`delete from project_milestones where id='${id}'`);assert.equal((await db.query("select count(*)::int as n from admin_audit_log where action like 'milestone_%'")).rows[0].n,3);});
await check('payment confirmation and delivery remain separate and idempotent',async()=>{assert.equal((await db.query(`select authorize_delivery_link('${request}') as r`)).rows[0].r.status,'payment_not_confirmed');await db.exec(`update template_requests set status='contacted' where id='${request}'`);await assert.rejects(()=>db.exec(`update template_requests set status='fulfilled' where id='${request}'`));assert.equal((await db.query(`select confirm_template_payment('${request}',1000,'MNT') as r`)).rows[0].r.status,'confirmed');assert.equal((await db.query(`select confirm_template_payment('${request}',1000,'MNT') as r`)).rows[0].r.status,'already_confirmed');assert.equal((await db.query(`select authorize_delivery_link('${request}') as r`)).rows[0].r.status,'ok');await db.exec(`select record_delivery_link('${request}',24)`);assert.equal((await db.query(`select delivery_status from template_requests where id='${request}'`)).rows[0].delivery_status,'link_created');await db.exec(`update template_requests set status='fulfilled' where id='${request}'`);assert.equal((await db.query(`select delivery_status from template_requests where id='${request}'`)).rows[0].delivery_status,'delivered');});
await check('manual payment notification is real and admin-scoped',async()=>{assert.equal((await db.query("select count(*)::int as n from admin_notifications where event_type='payment_confirmed_manual'")).rows[0].n,1);await db.exec('update admin_notifications set read_at=now()');await as('authenticated',second);assert.equal((await db.query('select count(*)::int as n from admin_notifications where read_at is not null')).rows[0].n,0);});
await as('authenticated',admin);
await check('support status is editable but customer message is immutable',async()=>{await db.exec("update contact_messages set status='answered'");await denied("update contact_messages set message='overwritten'");});
await check('audit is append-only to admin and service roles',async()=>{await denied('delete from admin_audit_log');await denied("update admin_audit_log set action='changed'");await as('service_role');await denied('delete from admin_audit_log');});
console.log(`${passed} PostgreSQL checks passed. No remote data changed.`);
}catch(error){console.error('FAIL',error.code??'',error.message);process.exitCode=1;}finally{await db.close();}
