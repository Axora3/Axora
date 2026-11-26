import pg from 'pg';
import crypto from 'node:crypto';
import fs from 'node:fs';
const directory='qa-evidence/automated-quotation';fs.mkdirSync(directory,{recursive:true});
const raw=process.env.DATABASE_URL;
if(!raw){console.log({configured:false});process.exit(1)}
let target;try{target=new URL(raw)}catch{console.log({configured:true,validUrl:false});process.exit(1)}
const api=process.env.NEXT_PUBLIC_SUPABASE_URL?new URL(process.env.NEXT_PUBLIC_SUPABASE_URL):null,ref=api?.hostname.split('.')[0];
const result={checkedAt:new Date().toISOString(),configured:true,targetFingerprint:crypto.createHash('sha256').update(target.hostname+target.pathname+target.username).digest('hex').slice(0,16),matchesConfiguredSupabaseProject:!!ref&&(target.hostname.includes(ref)||decodeURIComponent(target.username).includes(ref)),ownerDeclaredEnvironment:'development'};
const db=new pg.Client({connectionString:raw,ssl:{rejectUnauthorized:false},connectionTimeoutMillis:15000,application_name:'axora-readonly-quotation-audit'});
try{
 await db.connect();await db.query('begin read only');
 result.identity=(await db.query("select current_database() database,exists(select 1 from information_schema.schemata where schema_name='supabase_migrations') migration_schema")).rows[0];
 result.tables=(await db.query("select c.relname table_name,c.relrowsecurity rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by c.relname")).rows;
 result.columns=(await db.query("select table_name,column_name,data_type,is_nullable from information_schema.columns where table_schema='public' and table_name in('website_orders','website_projects','site_content','website_workflow_settings','website_order_quotes','website_order_payment_reports','website_order_email_outbox','website_order_workflow_events') order by table_name,ordinal_position")).rows;
 result.policies=(await db.query("select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname")).rows;
 result.constraints=(await db.query("select c.relname table_name,k.conname,pg_get_constraintdef(k.oid) definition from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'website_%' order by c.relname,k.conname")).rows;
 result.orderCounts=(await db.query("select count(*)::int total,count(*)filter(where payment_status='paid')::int paid from public.website_orders")).rows[0];
 if(result.identity.migration_schema)result.migrations=(await db.query('select version from supabase_migrations.schema_migrations order by version')).rows;
 result.bank=(await db.query("select published->'bank' bank from public.site_content where key='site'")).rows[0]?.bank;
 await db.query('rollback');
 fs.writeFileSync(`${directory}/database-${process.argv[2]||'before'}.json`,JSON.stringify(result,null,2));
 console.log({connected:true,targetFingerprint:result.targetFingerprint,matchesConfiguredSupabaseProject:result.matchesConfiguredSupabaseProject,tables:result.tables.length,migrations:result.migrations?.map(x=>x.version),orderCounts:result.orderCounts,bank:result.bank});
}catch(error){console.log({connected:false,errorCode:error.code||'connection_failed'});process.exitCode=1;}finally{await db.end().catch(()=>{});}
