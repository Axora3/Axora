-- Additive ecosystem integration. Existing order/project/digital-product schemas remain unchanged.
-- Apply on staging first. All writes are service RPCs, behind verified server authorization.
begin;
create table public.ecosystem_customers(id uuid primary key default gen_random_uuid(),auth_user_id uuid unique references auth.users(id) on delete restrict,email text not null unique check(email=lower(email)),name text not null,phone text,created_at timestamptz not null default now());
create table public.ecosystem_sites(id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.website_orders(id) on delete restrict,project_id uuid unique references public.website_projects(id) on delete restrict,customer_id uuid not null references public.ecosystem_customers(id) on delete restrict,business_type text check(business_type in('online_store','restaurant','service_business','business_profile','portfolio')),enabled_modules text[] not null default '{}',factory_answers jsonb not null default '{}' check(jsonb_typeof(factory_answers)='object'),requirements_version integer not null default 0,factory_order_id uuid unique,factory_project_id uuid unique,factory_status text not null default 'not_submitted',factory_options jsonb not null default '{}',factory_snapshot jsonb not null default '{}',dashboard_status text not null default 'not_provisioned',dashboard_user_id uuid,policy_receipt jsonb not null default '{}',factory_jobs jsonb not null default '[]',access_receipt jsonb not null default '{}',sheets_status text not null default 'not_provisioned',last_successful_sync timestamptz,confirmed_delivery_at timestamptz,updated_at timestamptz not null default now(),created_at timestamptz not null default now());
create table public.ecosystem_sheet_mappings(site_id uuid primary key references public.ecosystem_sites(id) on delete restrict,spreadsheet_id text not null unique,configuration_version integer not null check(configuration_version>0),updated_at timestamptz not null default now());
create table public.ecosystem_billing_grants(site_id uuid primary key references public.ecosystem_sites(id)on delete restrict,client_id text not null default 'dashboard');
create table public.ecosystem_plans(id text primary key check(id in('monthly','annual')),amount integer not null,months integer not null,currency text not null default 'MNT' check(currency='MNT'),check((id='monthly' and amount=20000 and months=1)or(id='annual' and amount=228000 and months=12)));
insert into public.ecosystem_plans(id,amount,months)values('monthly',20000,1),('annual',228000,12);
create table public.ecosystem_subscriptions(site_id uuid primary key references public.ecosystem_sites(id) on delete restrict,plan_id text references public.ecosystem_plans(id),confirmed_delivery_at timestamptz,trial_ends_at timestamptz,current_period_start timestamptz,current_period_end timestamptz,cancel_at_period_end boolean not null default false,auto_suspend boolean not null default false,grace_days integer not null default 7 check(grace_days between 0 and 60),status text not null default 'awaiting_delivery' check(status in('awaiting_delivery','trial','active','past_due','suspended','cancelled')),updated_at timestamptz not null default now(),check((confirmed_delivery_at is null and trial_ends_at is null)or(trial_ends_at=confirmed_delivery_at+interval '720 hours')),check((current_period_start is null and current_period_end is null)or(current_period_end>current_period_start)));
create table public.ecosystem_invoices(id uuid primary key default gen_random_uuid(),site_id uuid not null references public.ecosystem_sites(id) on delete restrict,plan_id text not null references public.ecosystem_plans(id),amount integer not null check(amount>0),currency text not null default 'MNT' check(currency='MNT'),provider text not null default 'custom_http',provider_invoice_id text unique,payment_url text,status text not null default 'pending' check(status in('pending','paid','failed','cancelled')),request_key uuid not null unique,created_at timestamptz not null default now(),paid_at timestamptz);
create table public.ecosystem_payments(id uuid primary key default gen_random_uuid(),invoice_id uuid not null unique references public.ecosystem_invoices(id) on delete restrict,site_id uuid not null references public.ecosystem_sites(id) on delete restrict,provider text not null,provider_payment_id text not null,amount integer not null,currency text not null check(currency='MNT'),status text not null check(status in('paid','refunded')),verified_at timestamptz not null,paid_at timestamptz not null,created_at timestamptz not null default now(),unique(provider,provider_payment_id));
create table public.ecosystem_provider_events(id uuid primary key default gen_random_uuid(),provider text not null,event_id text not null,payload_hash text not null check(payload_hash~'^[a-f0-9]{64}$'),invoice_id uuid not null references public.ecosystem_invoices(id) on delete restrict,result text not null,created_at timestamptz not null default now(),unique(provider,event_id));
create table public.ecosystem_tasks(id uuid primary key default gen_random_uuid(),site_id uuid not null references public.ecosystem_sites(id) on delete restrict,kind text not null check(kind in('factory_submit','factory_poll','factory_generate','factory_approve','factory_confirm','dashboard_prepare','dashboard_health','dashboard_access','sheets_retry','invoice_create','policy_sync')),payload jsonb not null default '{}',request_key uuid not null unique,status text not null default 'queued' check(status in('queued','running','completed','blocked','failed')),attempts integer not null default 0 check(attempts between 0 and 5),lease_owner uuid,lease_until timestamptz,available_at timestamptz not null default now(),error_code text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.ecosystem_command_keys(key uuid primary key,action text not null,site_id uuid references public.ecosystem_sites(id),payload jsonb not null,result jsonb not null,actor_id uuid not null references auth.users(id),created_at timestamptz not null default now());
create table public.ecosystem_remote_registry(service text not null,kind text not null,remote_id text not null,body jsonb not null,observed_at timestamptz not null default now(),primary key(service,kind,remote_id));
create table public.ecosystem_audit(id bigint generated always as identity primary key,site_id uuid references public.ecosystem_sites(id),actor_id uuid references auth.users(id),action text not null,details jsonb not null default '{}',created_at timestamptz not null default now());
create index ecosystem_sites_customer on public.ecosystem_sites(customer_id);
create index ecosystem_tasks_ready on public.ecosystem_tasks(status,available_at);
create index ecosystem_tasks_site on public.ecosystem_tasks(site_id,created_at desc);
create index ecosystem_payments_site on public.ecosystem_payments(site_id,created_at desc);
create index ecosystem_invoices_site on public.ecosystem_invoices(site_id,created_at desc);
create index ecosystem_audit_site on public.ecosystem_audit(site_id,created_at desc);
create or replace function public.ecosystem_read_site(p_site uuid) returns boolean language sql stable security definer set search_path='' as $$select public.is_admin() or exists(select 1 from public.ecosystem_sites s join public.ecosystem_customers c on c.id=s.customer_id where s.id=p_site and c.auth_user_id=auth.uid())$$;
revoke all on function public.ecosystem_read_site(uuid) from public,anon;grant execute on function public.ecosystem_read_site(uuid) to authenticated,service_role;
do $$declare t text;begin foreach t in array array['ecosystem_billing_grants','ecosystem_customers','ecosystem_sites','ecosystem_sheet_mappings','ecosystem_plans','ecosystem_subscriptions','ecosystem_invoices','ecosystem_payments','ecosystem_provider_events','ecosystem_tasks','ecosystem_command_keys','ecosystem_remote_registry','ecosystem_audit']loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);execute format('grant all on public.%I to service_role',t);execute format('grant select on public.%I to authenticated',t);execute format('create policy admin_read on public.%I for select to authenticated using(public.is_admin())',t);end loop;end$$;
create policy customer_own_record on public.ecosystem_customers for select to authenticated using(auth_user_id=auth.uid());
create policy customer_subscription on public.ecosystem_subscriptions for select to authenticated using(public.ecosystem_read_site(site_id));
create policy customer_invoice on public.ecosystem_invoices for select to authenticated using(public.ecosystem_read_site(site_id));
create policy customer_payment on public.ecosystem_payments for select to authenticated using(public.ecosystem_read_site(site_id));
grant usage,select on sequence public.ecosystem_audit_id_seq to service_role;
create or replace function public.ecosystem_audit_immutable()returns trigger language plpgsql as $$begin raise exception 'ecosystem audit is append only';end$$;
create trigger ecosystem_audit_immutable before update or delete on public.ecosystem_audit for each row execute function public.ecosystem_audit_immutable();

create or replace function public.ecosystem_command(p_action text,p_site uuid,p_data jsonb,p_key uuid,p_actor uuid)returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.ecosystem_sites; o public.website_orders; c uuid; pr uuid; existing public.ecosystem_command_keys; task uuid; inv uuid; plan public.ecosystem_plans; result jsonb; kind text;
begin
 if not exists(select 1 from public.admin_users where user_id=p_actor)then raise exception 'admin_required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 select * into existing from public.ecosystem_command_keys where key=p_key;
 if found then if existing.action<>p_action or existing.site_id is distinct from p_site or existing.payload<>p_data or existing.actor_id<>p_actor then raise exception 'idempotency_conflict';end if;return existing.result;end if;
 if p_action='register' then
  select * into o from public.website_orders where id=(p_data->>'orderId')::uuid for update;if not found then raise exception 'order_not_found';end if;
  select * into s from public.ecosystem_sites where order_id=o.id;if found then result=jsonb_build_object('site_id',s.id);else
   insert into public.ecosystem_customers(email,name,phone)values(lower(o.email),o.full_name,o.phone)on conflict(email)do nothing;
   select id into c from public.ecosystem_customers where email=lower(o.email);
   select id into pr from public.website_projects where order_id=o.id;
   if pr is null then insert into public.website_projects(order_id,created_by)values(o.id,p_actor)returning id into pr;end if;
   insert into public.ecosystem_sites(order_id,customer_id,project_id)values(o.id,c,pr)returning * into s;
   insert into public.ecosystem_subscriptions(site_id)values(s.id);result=jsonb_build_object('site_id',s.id);end if;
 else
  select * into s from public.ecosystem_sites where id=p_site for update;if not found then raise exception 'site_not_found';end if;
  if p_action='requirements' then
   if s.factory_project_id is not null or exists(select 1 from public.ecosystem_tasks pending_task where pending_task.site_id=s.id and(pending_task.status in('queued','running')or(pending_task.kind='factory_submit'and pending_task.status='blocked'and pending_task.error_code like '%outcome_uncertain%')))then raise exception 'requirements_frozen_or_busy';end if;
   if p_data->'answers'->>'siteId' is distinct from s.id::text then raise exception 'site_binding_invalid';end if;
   update public.ecosystem_sites set factory_answers=p_data->'answers',business_type=p_data->'answers'->>'businessType',enabled_modules=array(select jsonb_array_elements_text(p_data->'enabledModules')),requirements_version=requirements_version+1,updated_at=now()where id=s.id;
   result=jsonb_build_object('site_id',s.id);
  elsif p_action in('cancel','resume','policy')then
   update public.ecosystem_subscriptions set cancel_at_period_end=case when p_action='cancel'then true when p_action='resume'then false else cancel_at_period_end end,auto_suspend=case when p_action='policy'then(p_data->>'autoSuspend')::boolean else auto_suspend end,grace_days=case when p_action='policy'then(p_data->>'graceDays')::integer else grace_days end,updated_at=now()where site_id=s.id;
   result=jsonb_build_object('site_id',s.id);
  elsif p_action='retry_task'then
   update public.ecosystem_tasks set status='queued',available_at=now(),error_code=null where id=(p_data->>'taskId')::uuid and site_id=s.id and status in('blocked','failed')and attempts<5 returning id into task;
   if task is null then raise exception 'task_retry_limit_or_state';end if;result=jsonb_build_object('task_id',task);
  else
   kind=case p_action when 'submit'then'factory_submit' when 'poll'then'factory_poll' when 'generate'then'factory_generate' when 'approve'then'factory_approve' when 'confirm'then'factory_confirm' when 'prepare_site'then'dashboard_prepare' when 'provision_access'then'dashboard_access' when 'retry_sheets'then'sheets_retry' when 'invoice'then'invoice_create' else null end;
   if kind is null then raise exception 'unknown_command';end if;
   if kind in('dashboard_access','invoice_create')and s.confirmed_delivery_at is null then raise exception 'confirmed_delivery_required';end if;
   if kind in('dashboard_prepare','sheets_retry','dashboard_access')and(s.business_type is null or cardinality(s.enabled_modules)=0)then raise exception 'business_modules_required';end if;
   if kind='factory_generate'and(s.factory_answers->>'dataBackend'='google_sheets')and s.sheets_status<>'ready'then raise exception 'verified_sheets_required';end if;
   if kind='factory_confirm'and length(p_data->>'reference')<8 then raise exception 'delivery_reference_required';end if;
   if kind='invoice_create'then
    select * into plan from public.ecosystem_plans where id=p_data->>'plan';if not found then raise exception 'invalid_plan';end if;
    insert into public.ecosystem_invoices(site_id,plan_id,amount,currency,request_key)values(s.id,plan.id,plan.amount,'MNT',p_key)returning id into inv;p_data=p_data||jsonb_build_object('invoiceId',inv);
   end if;
   insert into public.ecosystem_tasks(site_id,kind,payload,request_key)values(s.id,kind,p_data||jsonb_build_object('_requirements_version',s.requirements_version),p_key)returning id into task;
   result=jsonb_build_object('site_id',s.id,'task_id',task,'invoice_id',inv);
  end if;
 end if;
 insert into public.ecosystem_command_keys(key,action,site_id,payload,result,actor_id)values(p_key,p_action,p_site,case when inv is not null then p_data-'invoiceId' else p_data end,result,p_actor);
 insert into public.ecosystem_audit(site_id,actor_id,action,details)values(s.id,p_actor,'admin.'||p_action,jsonb_build_object('task_id',task));return result;
end$$;

create or replace function public.ecosystem_claim(p_owner uuid)returns setof public.ecosystem_tasks language plpgsql security definer set search_path='' as $$declare t public.ecosystem_tasks;begin
 update public.ecosystem_tasks set status=case when attempts>=5 then 'failed' else 'queued'end,lease_owner=null,lease_until=null,error_code='lease_expired'where status='running'and lease_until<now();
 select * into t from public.ecosystem_tasks where status='queued'and available_at<=now()order by created_at for update skip locked limit 1;if not found then return;end if;
 update public.ecosystem_tasks set status='running',attempts=attempts+1,lease_owner=p_owner,lease_until=now()+interval '120 seconds',updated_at=now()where id=t.id returning * into t;return next t;end$$;

create or replace function public.ecosystem_finish(p_task uuid,p_owner uuid,p_receipt jsonb,p_error text default null,p_retry boolean default false)returns void language plpgsql security definer set search_path='' as $$
declare t public.ecosystem_tasks; s public.ecosystem_sites; delivered timestamptz; remote jsonb; invoice uuid;
begin
 select * into t from public.ecosystem_tasks where id=p_task for update;if not found or t.status<>'running'or t.lease_owner<>p_owner or t.lease_until<now()then raise exception 'lease_lost';end if;
 select * into s from public.ecosystem_sites where id=t.site_id for update;
 if p_error is not null then
  update public.ecosystem_tasks set status=case when attempts>=5 then 'failed'when p_retry then 'queued'else'blocked'end,error_code=p_error,lease_owner=null,lease_until=null,available_at=now()+make_interval(secs=>least(300,power(2,attempts)::integer)),updated_at=now()where id=t.id;
  if t.kind in('dashboard_prepare','sheets_retry')then update public.ecosystem_sites set sheets_status='error'where id=s.id;end if;
  if t.kind='dashboard_access'then update public.ecosystem_sites set dashboard_status='blocked'where id=s.id;end if;
 else
  if t.kind='factory_submit'then
   if p_receipt->'order'->>'externalId' is distinct from s.order_id::text or p_receipt->'order'->'answers'->>'siteId' is distinct from s.id::text then raise exception 'factory_binding_invalid';end if;
   update public.ecosystem_sites set factory_order_id=(p_receipt->'order'->>'id')::uuid,factory_status='submitted',factory_options=p_receipt->'options',updated_at=now()where id=s.id;
  elsif t.kind in('factory_poll','factory_generate','factory_approve','factory_confirm')then
   remote=p_receipt->'project';
   if remote is not null and remote<>'null'::jsonb then
    if remote->>'siteId' is distinct from s.id::text or remote->>'orderId' is distinct from s.factory_order_id::text or(s.factory_project_id is not null and remote->>'id'<>s.factory_project_id::text)then raise exception 'factory_binding_invalid';end if;
    update public.ecosystem_sites set factory_project_id=(remote->>'id')::uuid,factory_status=remote->>'status',factory_snapshot=remote,updated_at=now()where id=s.id;
    if remote->>'status'='delivered'then
     delivered=(remote->'delivery'->>'at')::timestamptz;
     if delivered is null or delivered>now()+interval '5 minutes' or remote->'delivery'->>'reference' is null then raise exception 'confirmed_delivery_receipt_required';end if;
     if s.confirmed_delivery_at is not null and s.confirmed_delivery_at<>delivered then raise exception 'delivery_timestamp_immutable';end if;
     update public.ecosystem_sites set confirmed_delivery_at=coalesce(confirmed_delivery_at,delivered)where id=s.id;
     update public.ecosystem_subscriptions set confirmed_delivery_at=delivered,trial_ends_at=delivered+interval '720 hours',status=case when current_period_end is null then'trial'else status end,updated_at=now()where site_id=s.id and confirmed_delivery_at is null;
     insert into public.ecosystem_tasks(site_id,kind,payload,request_key)select s.id,'dashboard_access','{}',gen_random_uuid()where not exists(select 1 from public.ecosystem_tasks where site_id=s.id and kind='dashboard_access');
    end if;
   end if;
   if p_receipt?'jobs'then update public.ecosystem_sites set factory_jobs=p_receipt->'jobs'where id=s.id;end if;
   if p_receipt?'options'then update public.ecosystem_sites set factory_options=p_receipt->'options'where id=s.id;end if;
  elsif t.kind in('dashboard_prepare','dashboard_health','sheets_retry')then
   if p_receipt->>'site_id' is distinct from s.id::text or p_receipt->>'customer_ref' is distinct from s.customer_id::text or p_receipt->>'business_type' is distinct from s.business_type then raise exception 'dashboard_binding_invalid';end if;
   if p_receipt->>'status'='ready'and(p_receipt->>'integration_status' is distinct from 'connected'or coalesce(p_receipt->>'spreadsheet_id','')='')then raise exception 'verified_mapping_required';end if;
   if p_receipt->>'status'='ready'then insert into public.ecosystem_sheet_mappings(site_id,spreadsheet_id,configuration_version)values(s.id,p_receipt->>'spreadsheet_id',(p_receipt->>'configuration_version')::integer)on conflict(site_id)do update set spreadsheet_id=excluded.spreadsheet_id,configuration_version=excluded.configuration_version,updated_at=now()where public.ecosystem_sheet_mappings.spreadsheet_id=excluded.spreadsheet_id;if not found then raise exception 'mapping_reassignment_requires_review';end if;end if;
   update public.ecosystem_sites set sheets_status=p_receipt->>'status',last_successful_sync=(p_receipt->>'last_successful_sync')::timestamptz,updated_at=now()where id=s.id;
  elsif t.kind='dashboard_access'then
   if s.confirmed_delivery_at is null or p_receipt->>'site_id' is distinct from s.id::text or p_receipt->>'customer_ref' is distinct from s.customer_id::text or(p_receipt->>'delivery_confirmed_at')::timestamptz is distinct from s.confirmed_delivery_at then raise exception 'dashboard_delivery_binding_invalid';end if;
   if p_receipt->>'status'='active'and(p_receipt->>'dashboard_user_id' is null or p_receipt->>'identity_verified' is distinct from 'true'or lower(p_receipt->>'customer_email')is distinct from(select email from public.ecosystem_customers where id=s.customer_id))then raise exception 'verified_customer_identity_required';end if;
   insert into public.ecosystem_billing_grants(site_id)values(s.id)on conflict do nothing;
   update public.ecosystem_sites set dashboard_status=p_receipt->>'status',dashboard_user_id=(p_receipt->>'dashboard_user_id')::uuid,access_receipt=p_receipt,updated_at=now()where id=s.id;
  elsif t.kind='policy_sync'then
   if p_receipt->>'site_id' is distinct from s.id::text or p_receipt->>'applied' is distinct from 'true' or p_receipt->'writes_suspended' is distinct from t.payload->'writes_suspended'then raise exception 'policy_receipt_invalid';end if;
   update public.ecosystem_sites set policy_receipt=p_receipt,updated_at=now()where id=s.id;
  elsif t.kind='invoice_create'then
   invoice=(t.payload->>'invoiceId')::uuid;
   update public.ecosystem_invoices set provider_invoice_id=p_receipt->>'id',payment_url=p_receipt->>'payment_url'where id=invoice and site_id=s.id and status='pending'and(provider_invoice_id is null or provider_invoice_id=p_receipt->>'id');if not found then raise exception 'invoice_binding_invalid';end if;
  end if;
  if p_receipt?'registry'then insert into public.ecosystem_remote_registry(service,kind,remote_id,body)select 'factory','template',item->>'id',item from jsonb_array_elements(p_receipt->'registry')item on conflict(service,kind,remote_id)do update set body=excluded.body,observed_at=now();end if;
  update public.ecosystem_tasks set status='completed',lease_owner=null,lease_until=null,error_code=null,updated_at=now()where id=t.id;
 end if;
 insert into public.ecosystem_audit(site_id,action,details)values(s.id,'task.'||t.kind,jsonb_build_object('task_id',t.id,'error_code',p_error));
end$$;

create or replace function public.ecosystem_settle(p_invoice uuid,p_event text,p_hash text,p_payment jsonb)returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.ecosystem_invoices; sub public.ecosystem_subscriptions; previous public.ecosystem_provider_events; plan public.ecosystem_plans; paid timestamptz; starts timestamptz; ends timestamptz;
begin
 select * into i from public.ecosystem_invoices where id=p_invoice for update;if not found then raise exception 'invoice_not_found';end if;
 select * into previous from public.ecosystem_provider_events where provider=i.provider and event_id=p_event;
 if found then if previous.payload_hash<>p_hash or previous.invoice_id<>i.id then raise exception 'provider_event_conflict';end if;return jsonb_build_object('duplicate',true);end if;
 if i.provider_invoice_id is null or p_payment->>'id' is null or p_payment->>'invoice_reference' is distinct from i.provider_invoice_id or(p_payment->>'amount')::integer is distinct from i.amount or p_payment->>'currency' is distinct from 'MNT'or p_payment->>'status' is distinct from 'paid'then raise exception 'verified_payment_mismatch';end if;
 paid=(p_payment->>'paid_at')::timestamptz;if paid is null or paid>now()+interval '5 minutes'or paid<i.created_at-interval '5 minutes'then raise exception 'invalid_provider_paid_at';end if;
 if i.status='cancelled'then raise exception 'cancelled_invoice';end if;
 if i.status='paid'then
  if not exists(select 1 from public.ecosystem_payments where invoice_id=i.id and provider_payment_id=p_payment->>'id')then raise exception 'second_payment_requires_review';end if;
  insert into public.ecosystem_provider_events(provider,event_id,payload_hash,invoice_id,result)values(i.provider,p_event,p_hash,i.id,'duplicate_payment');return jsonb_build_object('duplicate',true);
 end if;
 select * into sub from public.ecosystem_subscriptions where site_id=i.site_id for update;
 if sub.confirmed_delivery_at is null then raise exception 'confirmed_delivery_required';end if;
 select * into plan from public.ecosystem_plans where id=i.plan_id;
 starts=greatest(paid,sub.current_period_end,sub.trial_ends_at);ends=((starts at time zone 'UTC')+make_interval(months=>plan.months))at time zone 'UTC';
 insert into public.ecosystem_payments(invoice_id,site_id,provider,provider_payment_id,amount,currency,status,verified_at,paid_at)values(i.id,i.site_id,i.provider,p_payment->>'id',i.amount,'MNT','paid',now(),paid);
 insert into public.ecosystem_provider_events(provider,event_id,payload_hash,invoice_id,result)values(i.provider,p_event,p_hash,i.id,'verified_paid');
 update public.ecosystem_invoices set status='paid',paid_at=paid where id=i.id;
 update public.ecosystem_subscriptions set plan_id=plan.id,current_period_start=starts,current_period_end=ends,status=case when now()<sub.trial_ends_at then 'trial' else 'active'end,updated_at=now()where site_id=i.site_id;
 insert into public.ecosystem_audit(site_id,action,details)values(i.site_id,'payment.verified',jsonb_build_object('invoice_id',i.id,'amount',i.amount));return jsonb_build_object('duplicate',false,'period_start',starts,'period_end',ends);
end$$;

create or replace function public.ecosystem_tick()returns integer language plpgsql security definer set search_path='' as $$declare s public.ecosystem_subscriptions; desired text; coverage timestamptz; desired_write boolean; changed integer=0;begin
 for s in select * from public.ecosystem_subscriptions for update loop
 coverage=coalesce(s.current_period_end,s.trial_ends_at);
 desired=case when s.confirmed_delivery_at is null then'awaiting_delivery'when now()<s.trial_ends_at then'trial'when now()<coverage then'active'when s.cancel_at_period_end then'cancelled'when s.auto_suspend and now()>=coverage+make_interval(days=>s.grace_days)then'suspended'else'past_due'end;
 desired_write=s.confirmed_delivery_at is not null and s.auto_suspend and now()>=coverage+make_interval(days=>s.grace_days);
 if desired<>s.status then update public.ecosystem_subscriptions set status=desired,updated_at=now()where site_id=s.site_id;insert into public.ecosystem_audit(site_id,action,details)values(s.site_id,'subscription.'||desired,'{}');changed=changed+1;end if;
 if coalesce((select (policy_receipt->>'writes_suspended')::boolean from public.ecosystem_sites where id=s.site_id),false) is distinct from desired_write then
 insert into public.ecosystem_tasks(site_id,kind,payload,request_key)select s.site_id,'policy_sync',jsonb_build_object('status',desired,'writes_suspended',desired_write),gen_random_uuid()where not exists(select 1 from public.ecosystem_tasks where site_id=s.site_id and kind='policy_sync'and status in('queued','running','blocked','failed')and payload->'writes_suspended'=to_jsonb(desired_write));end if;
 end loop;
 insert into public.ecosystem_tasks(site_id,kind,request_key)select id,'factory_poll',gen_random_uuid()from public.ecosystem_sites site_row where factory_order_id is not null and factory_status<>'delivered'and not exists(select 1 from public.ecosystem_tasks t where t.site_id=site_row.id and t.kind='factory_poll'and(t.status in('queued','running','blocked','failed')or t.updated_at>now()-interval '60 seconds'));
 insert into public.ecosystem_tasks(site_id,kind,request_key)select id,'dashboard_health',gen_random_uuid()from public.ecosystem_sites site_row where sheets_status='ready'and not exists(select 1 from public.ecosystem_tasks t where t.site_id=site_row.id and t.kind='dashboard_health'and(t.status in('queued','running','blocked','failed')or t.updated_at>now()-interval '5 minutes'));
 return changed;end$$;
revoke all on function public.ecosystem_command(text,uuid,jsonb,uuid,uuid),public.ecosystem_claim(uuid),public.ecosystem_finish(uuid,uuid,jsonb,text,boolean),public.ecosystem_settle(uuid,text,text,jsonb),public.ecosystem_tick() from public,anon,authenticated;
grant execute on function public.ecosystem_command(text,uuid,jsonb,uuid,uuid),public.ecosystem_claim(uuid),public.ecosystem_finish(uuid,uuid,jsonb,text,boolean),public.ecosystem_settle(uuid,text,text,jsonb),public.ecosystem_tick() to service_role;
commit;
