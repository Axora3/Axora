import fs from 'node:fs';
const checks=[];
const base=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(base&&key)for(const table of ['website_workflow_settings','website_order_quotes','website_order_payment_reports','website_order_email_outbox','website_order_workflow_events','website_projects']){
 const response=await fetch(`${base}/rest/v1/${table}?select=id&limit=1`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});const body=await response.json();checks.push({table,status:response.status,code:response.ok?null:body.code});
}
const result={checkedAt:new Date().toISOString(),configuration:{databaseUrl:!!process.env.DATABASE_URL,publicOrigin:!!process.env.NEXT_PUBLIC_SITE_URL,smtpUser:!!process.env.SMTP_USER,smtpPassword:!!process.env.SMTP_PASSWORD},checks};
fs.writeFileSync('qa-evidence/axora-upgrade/live-schema-readonly.json',JSON.stringify(result,null,2));console.log(result);
