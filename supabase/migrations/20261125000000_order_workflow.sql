-- Additive website quotation -> acceptance -> verified payment -> delivery.
-- Existing orders/prices remain intact. Managed orders use atomic commands.
begin;
-- Workload planning is server-only and must not depend on hosted default grants.
grant select on public.website_projects to service_role;

alter table public.website_orders
  add column if not exists workflow_managed boolean not null default false,
  add column if not exists workflow_revision bigint not null default 0;
alter table public.website_projects
  add column if not exists workflow_managed boolean not null default false,
  add column if not exists estimated_effort_days integer check (estimated_effort_days > 0),
  add column if not exists remaining_effort_days integer check (remaining_effort_days >= 0),
  add column if not exists schedule_buffer_days integer not null default 0 check (schedule_buffer_days >= 0),
  add column if not exists queue_priority integer not null default 0,
  add column if not exists suggested_completion_date date,
  add column if not exists schedule_explanation jsonb not null default '{}'::jsonb,
  add column if not exists deadline_reason text not null default '',
  add column if not exists actual_started_at timestamptz,
  add column if not exists actual_completed_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists delivery_url text;

create table if not exists public.website_workflow_settings (
  id integer primary key check (id=1),
  pricing jsonb not null, scheduling jsonb not null,
  verified_bank jsonb, bank_instructions text not null default '',
  version uuid not null default gen_random_uuid(),
  schedule_revision bigint not null default 0,
  updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
create table if not exists public.website_order_quotes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.website_orders(id),
  version integer not null check(version>0),
  status text not null check(status in ('draft','sent','accepted','revision_requested','rejected','superseded')),
  pricing_version text, package_label text, requirements jsonb not null default '{}',
  items jsonb not null check(jsonb_typeof(items)='array'),
  subtotal bigint not null check(subtotal>=0), discount bigint not null check(discount>=0 and discount<=subtotal),
  total bigint check(total>0 and total=subtotal-discount),
  monthly_total bigint not null default 0 check(monthly_total>=0),
  external_total bigint not null default 0 check(external_total>=0),
  estimated_effort_days integer check(estimated_effort_days>0),
  notes text not null default '', adjustment_reason text not null default '',
  review_flags jsonb not null default '[]',
  created_by uuid references auth.users(id), created_at timestamptz not null default now(),
  sent_at timestamptz, accepted_at timestamptz,
  unique(order_id,version),
  constraint official_quote_total check(status not in ('sent','accepted') or total is not null)
);
create unique index if not exists website_order_one_accepted_quote on public.website_order_quotes(order_id) where status='accepted';
create table if not exists public.website_order_payment_reports (
  id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.website_orders(id),
  quote_id uuid not null references public.website_order_quotes(id),
  status text not null check(status in ('reported','review_required','verified')),
  reference text not null default '', note text not null default '', reported_at timestamptz not null default now(),
  verified_amount bigint, verified_by uuid references auth.users(id), verified_at timestamptz,
  review_note text not null default ''
);
create table if not exists public.website_order_workflow_events (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.website_orders(id),
  request_key uuid not null, action text not null, request_payload jsonb not null,
  actor_id uuid references auth.users(id), label text not null,
  created_at timestamptz not null default now(), unique(order_id,request_key)
);
create table if not exists public.website_order_email_outbox (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.website_orders(id),
  event_key text not null unique, event_type text not null, payload jsonb not null,
  status text not null default 'pending' check(status in ('pending','sending','sent','failed')),
  attempts integer not null default 0, last_error text,
  lease_token uuid, lease_until timestamptz, sent_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists website_order_mail_pending on public.website_order_email_outbox(status,created_at);
alter table public.admin_notifications drop constraint if exists admin_notifications_event_type_check;
alter table public.admin_notifications add constraint admin_notifications_event_type_check check(event_type in ('new_order','new_template_request','payment_review','new_contact_message','payment_confirmed_manual','order_workflow'));

alter table public.website_workflow_settings enable row level security;
alter table public.website_order_quotes enable row level security;
alter table public.website_order_payment_reports enable row level security;
alter table public.website_order_workflow_events enable row level security;
alter table public.website_order_email_outbox enable row level security;
revoke all on public.website_workflow_settings,public.website_order_quotes,public.website_order_payment_reports,public.website_order_workflow_events,public.website_order_email_outbox from anon,authenticated;
grant select on public.website_workflow_settings,public.website_order_quotes,public.website_order_payment_reports,public.website_order_workflow_events,public.website_order_email_outbox to authenticated;
grant all on public.website_workflow_settings,public.website_order_quotes,public.website_order_payment_reports,public.website_order_workflow_events,public.website_order_email_outbox to service_role;
drop policy if exists "workflow settings admin read" on public.website_workflow_settings;
create policy "workflow settings admin read" on public.website_workflow_settings for select to authenticated using(public.is_admin());
drop policy if exists "workflow quote admin read" on public.website_order_quotes;
create policy "workflow quote admin read" on public.website_order_quotes for select to authenticated using(public.is_admin());
drop policy if exists "workflow payment admin read" on public.website_order_payment_reports;
create policy "workflow payment admin read" on public.website_order_payment_reports for select to authenticated using(public.is_admin());
drop policy if exists "workflow events admin read" on public.website_order_workflow_events;
create policy "workflow events admin read" on public.website_order_workflow_events for select to authenticated using(public.is_admin());
drop policy if exists "workflow mail admin read" on public.website_order_email_outbox;
create policy "workflow mail admin read" on public.website_order_email_outbox for select to authenticated using(public.is_admin());

create or replace function public.website_quote_totals(p_items jsonb,p_discount bigint)
returns jsonb language plpgsql immutable set search_path='' as $$
declare i jsonb; clean jsonb:='[]'; q numeric; price numeric; amount numeric; subtotal numeric:=0; monthly numeric:=0; external numeric:=0; billing text;
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>100 or p_discount<0 then raise exception 'invalid_quote_items'; end if;
 for i in select * from jsonb_array_elements(p_items) loop
  if jsonb_typeof(i->'quantity')<>'number' or jsonb_typeof(i->'unitPrice')<>'number' then raise exception 'invalid_quote_money';end if;
  q:=(i->>'quantity')::numeric;price:=(i->>'unitPrice')::numeric;billing:=coalesce(i->>'billing','one_time');
  if q<>trunc(q) or q<1 or q>1000 or price<>trunc(price) or price<0 or price>999999999999 or length(coalesce(i->>'label','')) not between 1 and 200 or billing not in ('one_time','monthly','external') or coalesce(i->>'kind','') not in ('base_package','additional_pages','feature','custom','rush','maintenance','external') then raise exception 'invalid_quote_money';end if;
  amount:=q*price;if amount>999999999999 then raise exception 'quote_too_large';end if;
  if billing='monthly' then monthly:=monthly+amount;elsif billing='external' then external:=external+amount;else subtotal:=subtotal+amount;end if;
  clean:=clean||jsonb_build_array(jsonb_build_object('kind',i->>'kind','code',coalesce(i->>'code',''),'label',i->>'label','quantity',q,'unitPrice',price,'total',amount,'billing',billing));
 end loop;
 if subtotal>999999999999 or monthly>999999999999 or external>999999999999 or p_discount>subtotal then raise exception 'invalid_quote_discount';end if;
 return jsonb_build_object('items',clean,'subtotal',subtotal,'discount',p_discount,'total',subtotal-p_discount,'monthlyTotal',monthly,'externalTotal',external);
end $$;

create or replace function public.website_workflow_record(p_order uuid,p_key uuid,p_action text,p_payload jsonb,p_label text)
returns void language plpgsql security definer set search_path='' as $$
declare r text;
begin
 update public.website_orders set workflow_revision=workflow_revision+1 where id=p_order returning reference into r;
 insert into public.website_order_workflow_events(order_id,request_key,action,request_payload,actor_id,label)values(p_order,p_key,p_action,p_payload,auth.uid(),p_label);
 if auth.uid() is not null then insert into public.admin_audit_log(actor_id,action,entity_type,entity_id,details) values(auth.uid(),'workflow_'||p_action,'order',p_order::text,jsonb_build_object('reference',r,'label',p_label));end if;
 insert into public.admin_notifications(admin_id,event_type,title,body,entity_type,entity_id)
 select user_id,'order_workflow',left(p_label||' · '||r,160),left(p_label,500),'website_order',p_order from public.admin_users;
end $$;

create or replace function public.website_workflow_queue_email(p_order uuid,p_event text)
returns void language plpgsql security definer set search_path='' as $$
declare o public.website_orders; q public.website_order_quotes;p public.website_projects;
begin
 select * into o from public.website_orders where id=p_order;
 select * into q from public.website_order_quotes where order_id=p_order order by version desc limit 1;
 select * into p from public.website_projects where order_id=p_order;
 insert into public.website_order_email_outbox(order_id,event_key,event_type,payload)
 values(p_order,p_order::text||':'||p_event||':'||o.workflow_revision,p_event,jsonb_build_object('to',o.email,'name',o.full_name,'reference',o.reference,'amount',coalesce(q.total,o.quote_amount),'deadline',o.agreed_deadline,'effortDays',q.estimated_effort_days,'projectStatus',p.status,'startedAt',p.actual_started_at,'completedAt',p.actual_completed_at,'deliveryUrl',p.delivery_url,'notes',q.notes,'trackingPath','/order/pay/'||o.payment_token)) on conflict(event_key) do nothing;
end $$;

create or replace function public.website_order_view(p_order uuid,p_admin boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.website_orders; q public.website_order_quotes; p public.website_projects; report public.website_order_payment_reports; bank jsonb; s public.website_workflow_settings; result jsonb; quote_json jsonb;
begin
 select * into o from public.website_orders where id=p_order;if not found then return null;end if;
 select * into q from public.website_order_quotes where order_id=p_order order by version desc limit 1;
 select * into p from public.website_projects where order_id=p_order;
 select * into report from public.website_order_payment_reports where order_id=p_order;
 select * into s from public.website_workflow_settings where id=1;
 select published->'bank' into bank from public.site_content where key='site';
 if q.id is not null then quote_json:=to_jsonb(q)-array['order_id','created_by','adjustment_reason'];if not p_admin then quote_json:=jsonb_set(quote_json,'{review_flags}','[]');end if;
 elsif not o.workflow_managed and o.payment_status='unpaid' and o.quote_amount>0 then
  quote_json:=jsonb_build_object('id',o.id,'version',0,'status','sent','pricing_version',null,'package_label','Админы үнийн санал','requirements',jsonb_build_object('websiteType',o.website_type),'items',jsonb_build_array(jsonb_build_object('kind','custom','billing','one_time','code','legacy','label','Веб хөгжүүлэлт','quantity',1,'unitPrice',o.quote_amount,'total',o.quote_amount)),'subtotal',o.quote_amount,'discount',0,'total',o.quote_amount,'monthly_total',0,'external_total',0,'notes','Өмнөх бүртгэл дэх админы үнийн санал.','review_flags','[]'::jsonb,'estimated_effort_days',null,'accepted_at',null,'created_at',o.created_at);
 end if;
 result:=jsonb_build_object('order',jsonb_build_object('id',o.id,'reference',o.reference,'business_name',o.business_name,'full_name',o.full_name,'status',o.status,'payment_status',o.payment_status,'quote_amount',o.quote_amount,'paid_at',o.paid_at,'agreed_deadline',o.agreed_deadline,'workflow_managed',o.workflow_managed,'workflow_revision',o.workflow_revision),'quote',quote_json,
 'project',case when p.id is null then null else jsonb_build_object('id',p.id,'status',p.status,'progress_percent',p.progress_percent,'target_completion_date',p.target_completion_date,'actual_started_at',p.actual_started_at,'actual_completed_at',p.actual_completed_at,'delivered_at',p.delivered_at,'delivery_url',p.delivery_url,'estimated_effort_days',p.estimated_effort_days,'remaining_effort_days',p.remaining_effort_days,'queue_priority',p.queue_priority,'suggested_completion_date',p.suggested_completion_date)end,
 'paymentReport',case when report.id is null then null else jsonb_build_object('id',report.id,'status',report.status,'reference',report.reference,'note',report.note,'review_note',report.review_note,'reported_at',report.reported_at)end,
 'bank',case when q.status='accepted' and s.verified_bank=bank and length(trim(bank->>'name'))>=2 and length(trim(bank->>'holder'))>=2 and length(trim(bank->>'account'))>=6 then bank else null end,'bankInstructions',s.bank_instructions,
 'history',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'label',e.label,'created_at',e.created_at)order by e.created_at desc)from public.website_order_workflow_events e where e.order_id=p_order),'[]'));
 if p_admin then result:=result||jsonb_build_object('quotes',coalesce((select jsonb_agg(to_jsonb(v)order by v.version desc)from public.website_order_quotes v where order_id=p_order),'[]'),'emailEvents',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'event_type',m.event_type,'status',m.status,'attempts',m.attempts,'last_error',m.last_error,'created_at',m.created_at)order by m.created_at desc)from public.website_order_email_outbox m where order_id=p_order),'[]'),'customerRequests',coalesce((select jsonb_agg(jsonb_build_object('message',e.request_payload->>'message','created_at',e.created_at)order by e.created_at desc)from public.website_order_workflow_events e where e.order_id=p_order and e.action='revision'),'[]'),'trackingPath',case when o.payment_token is null then null else '/order/pay/'||o.payment_token end);end if;
 return result;
end $$;

create or replace function public.website_order_admin_view(p_order uuid)returns jsonb language plpgsql security definer set search_path='' as $$begin if not public.is_admin() then raise exception 'admin_required' using errcode='42501';end if;return public.website_order_view(p_order,true);end $$;
create or replace function public.website_order_customer_view(p_token text)returns jsonb language sql security definer set search_path='' as $$select public.website_order_view(id,false)from public.website_orders where payment_token=p_token and length(p_token)=32$$;

create or replace function public.website_order_initialize(p_order uuid,p_token text,p_draft jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.website_orders;t jsonb;
begin
 select * into o from public.website_orders where id=p_order for update;if not found then raise exception 'order_not_found';end if;
 if exists(select 1 from public.website_order_quotes where order_id=p_order)then return public.website_order_view(p_order,false);end if;
 if p_token!~'^[A-Za-z0-9_-]{32}$'then raise exception 'invalid_tracking_token';end if;
 t:=public.website_quote_totals(p_draft->'items',coalesce((p_draft->>'discount')::bigint,0));
 update public.website_orders set workflow_managed=true,payment_token=coalesce(payment_token,p_token)where id=p_order;
 insert into public.website_order_quotes(order_id,version,status,pricing_version,package_label,requirements,items,subtotal,discount,total,monthly_total,external_total,estimated_effort_days,review_flags)
 values(p_order,1,'draft',p_draft->>'pricingVersion',p_draft->>'packageLabel',p_draft->'requirements',t->'items',(t->>'subtotal')::bigint,(t->>'discount')::bigint,case when jsonb_array_length(coalesce(p_draft->'reviewFlags','[]'))=0 and (t->>'total')::bigint>0 then(t->>'total')::bigint else null end,(t->>'monthlyTotal')::bigint,(t->>'externalTotal')::bigint,(p_draft->>'effortDays')::int,coalesce(p_draft->'reviewFlags','[]'));
 perform public.website_workflow_record(p_order,gen_random_uuid(),'application','{}','Анкет хүлээн авсан');
 return public.website_order_view(p_order,false);
end $$;

create or replace function public.website_order_customer_command(p_token text,p_action text,p_key uuid,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.website_orders;q public.website_order_quotes;e public.website_order_workflow_events;bank jsonb;s public.website_workflow_settings;label text;t jsonb;
begin
 select * into o from public.website_orders where payment_token=p_token and length(p_token)=32 for update;
 if not found then return null;end if;
 select * into e from public.website_order_workflow_events where order_id=o.id and request_key=p_key;
 if found then if e.action<>p_action or e.request_payload<>p_input then raise exception 'idempotency_conflict';end if;return public.website_order_view(o.id,false);end if;
 if o.status='cancelled' then raise exception 'order_closed';end if;
 select * into q from public.website_order_quotes where order_id=o.id order by version desc limit 1;
 if q.id is null and not o.workflow_managed and o.payment_status='unpaid' and o.quote_amount>0 and (p_input->>'version')::int=0 and (p_input->>'expectedAmount')::bigint=o.quote_amount and p_action in('accept','revision','reject')then
  t:=jsonb_build_array(jsonb_build_object('kind','custom','billing','one_time','code','legacy','label','Веб хөгжүүлэлт','quantity',1,'unitPrice',o.quote_amount,'total',o.quote_amount));
  update public.website_orders set workflow_managed=true where id=o.id;
  insert into public.website_order_quotes(order_id,version,status,items,subtotal,discount,total,package_label,sent_at)values(o.id,1,'sent',t,o.quote_amount,0,o.quote_amount,'Админы үнийн санал',now())returning * into q;
 elsif q.id is null or q.version is distinct from (p_input->>'version')::int then raise exception 'stale_quote';end if;
 if p_action in('accept','revision','reject')then
  if q.status<>'sent' then raise exception 'quote_not_sent';end if;
  if p_action='accept' then
   update public.website_order_quotes set status='accepted',accepted_at=now()where id=q.id;
   update public.website_orders set quote_amount=q.total where id=o.id;label:='Үнийн санал зөвшөөрсөн';
  elsif p_action='revision' then
   if length(trim(coalesce(p_input->>'message','')))not between 3 and 2000 then raise exception 'revision_message_required';end if;
   update public.website_order_quotes set status='revision_requested'where id=q.id;label:='Үнийн саналд өөрчлөлт хүссэн';
  else update public.website_order_quotes set status='rejected'where id=q.id;label:='Үнийн саналаас татгалзсан';end if;
 elsif p_action='report_payment' then
  if q.status<>'accepted' or o.quote_amount<>q.total then raise exception 'accepted_quote_required';end if;
  if o.payment_status='paid'then return public.website_order_view(o.id,false);end if;
  select * into s from public.website_workflow_settings where id=1;select published->'bank'into bank from public.site_content where key='site';
  if s.verified_bank is null or s.verified_bank<>bank then raise exception 'bank_not_verified';end if;
  if length(coalesce(p_input->>'reference',''))>100 or length(coalesce(p_input->>'message',''))>2000 then raise exception 'invalid_payment_report';end if;
  if exists(select 1 from public.website_order_payment_reports where order_id=o.id and status='reported')then return public.website_order_view(o.id,false);end if;
  insert into public.website_order_payment_reports(order_id,quote_id,status,reference,note)values(o.id,q.id,'reported',coalesce(p_input->>'reference',''),coalesce(p_input->>'message',''))
  on conflict(order_id)do update set status='reported',reference=excluded.reference,note=excluded.note,reported_at=now();label:='Төлбөр шилжүүлснээ мэдэгдсэн';
 else raise exception 'invalid_customer_action';end if;
 perform public.website_workflow_record(o.id,p_key,p_action,p_input,label);
 return public.website_order_view(o.id,false);
end $$;

create or replace function public.website_order_admin_command(p_order uuid,p_action text,p_key uuid,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.website_orders;q public.website_order_quotes;p public.website_projects;e public.website_order_workflow_events;s public.website_workflow_settings;t jsonb;v integer;label text;deadline date;bank jsonb;reason text;effort integer;
begin
 if not public.is_admin()then raise exception 'admin_required'using errcode='42501';end if;
 select * into s from public.website_workflow_settings where id=1 for update;
 if p_action='save_settings'then
  if s.version::text is distinct from p_input->>'expectedVersion'then raise exception 'settings_conflict';end if;
  if jsonb_typeof(p_input->'pricing')<>'object' or jsonb_typeof(p_input->'scheduling')<>'object'then raise exception 'invalid_settings';end if;
  bank:=p_input->'bank';
  if coalesce((p_input->>'bankVerified')::boolean,false)and(length(trim(coalesce(bank->>'name','')))<2 or length(trim(coalesce(bank->>'holder','')))<2 or length(trim(coalesce(bank->>'account','')))<6)then raise exception 'bank_incomplete';end if;
  update public.site_content set published=jsonb_set(coalesce(published,'{}'),'{bank}',bank,true),draft=jsonb_set(coalesce(draft,'{}'),'{bank}',bank,true)where key='site';
  update public.website_workflow_settings set pricing=p_input->'pricing',scheduling=p_input->'scheduling',verified_bank=case when(p_input->>'bankVerified')::boolean then bank else null end,bank_instructions=left(coalesce(p_input->>'bankInstructions',''),1000),version=gen_random_uuid(),schedule_revision=schedule_revision+1,updated_at=now(),updated_by=auth.uid()where id=1;
  insert into public.admin_audit_log(actor_id,action,entity_type,entity_id,details)values(auth.uid(),'workflow_settings_updated','site_content','site',jsonb_build_object('accepted_quotes_unchanged',true));
  return jsonb_build_object('ok',true,'version',(select version from public.website_workflow_settings where id=1));
 end if;
 select * into o from public.website_orders where id=p_order for update;if not found then raise exception 'order_not_found';end if;
 select * into e from public.website_order_workflow_events where order_id=o.id and request_key=p_key;
 if found then if e.action<>p_action or e.request_payload<>p_input then raise exception 'idempotency_conflict';end if;return public.website_order_view(o.id,true);end if;
 select * into q from public.website_order_quotes where order_id=o.id order by version desc limit 1;
 select * into p from public.website_projects where order_id=o.id for update;
 if p_action='retry_email'then
  if exists(select 1 from public.website_order_email_outbox where id=(p_input->>'id')::uuid and order_id=o.id and last_error='delivery_uncertain')and coalesce(p_input->>'reason','')=''then raise exception 'uncertain_email_review_required';end if;
  update public.website_order_email_outbox set status='pending',last_error=null,lease_token=null,lease_until=null,updated_at=now()where id=(p_input->>'id')::uuid and order_id=o.id and status='failed';
  return public.website_order_view(o.id,true);
 end if;
 if o.status='cancelled' or p.delivered_at is not null then raise exception 'order_closed';end if;
 if p_action='save_quote'then
  if o.payment_status='paid' or exists(select 1 from public.website_order_quotes where order_id=o.id and status='accepted')then raise exception 'accepted_quote_locked';end if;
  if coalesce((p_input->>'expectedVersion')::int,0)<>coalesce(q.version,0)then raise exception 'stale_quote';end if;
  if length(trim(coalesce(p_input->>'reason','')))<3 then raise exception 'adjustment_reason_required';end if;
  t:=public.website_quote_totals(p_input->'items',coalesce((p_input->>'discount')::bigint,0));v:=coalesce(q.version,0)+1;
  update public.website_order_quotes set status='superseded'where order_id=o.id and status<>'accepted';
  update public.website_orders set workflow_managed=true,quote_amount=null,payment_token=coalesce(payment_token,p_input->>'trackingToken')where id=o.id;
  insert into public.website_order_quotes(order_id,version,status,pricing_version,package_label,requirements,items,subtotal,discount,total,monthly_total,external_total,estimated_effort_days,notes,adjustment_reason,review_flags,created_by)
  values(o.id,v,'draft',coalesce(p_input->>'pricingVersion',q.pricing_version),coalesce(p_input->>'packageLabel',q.package_label),coalesce(p_input->'requirements',q.requirements,'{}'),t->'items',(t->>'subtotal')::bigint,(t->>'discount')::bigint,nullif((t->>'total')::bigint,0),(t->>'monthlyTotal')::bigint,(t->>'externalTotal')::bigint,(p_input->>'effortDays')::int,left(coalesce(p_input->>'notes',''),4000),left(p_input->>'reason',2000),coalesce(p_input->'reviewFlags','[]'),auth.uid());label:='Үнийн саналын шинэ хувилбар бэлтгэсэн';
 elsif p_action='send_quote'then
  if q.id is null or q.status<>'draft' or q.total is null or q.version is distinct from (p_input->>'version')::int then raise exception 'draft_quote_required';end if;
  if jsonb_array_length(q.review_flags)>0 and not coalesce((p_input->>'reviewResolved')::boolean,false)then raise exception 'quote_review_required';end if;
  update public.website_order_quotes set status='sent',sent_at=now()where id=q.id;label:='Үнийн санал илгээсэн';
 elsif p_action='review_payment'then
  if q.status<>'accepted'or o.payment_status='paid'then raise exception 'accepted_quote_required';end if;
  if length(trim(coalesce(p_input->>'message','')))<3 then raise exception 'review_note_required';end if;
  update public.website_order_payment_reports set status='review_required',review_note=left(p_input->>'message',2000)where order_id=o.id;
  if not found then raise exception 'payment_report_required';end if;label:='Төлбөрийн мэдээлэл дахин шалгах шаардлагатай';
 elsif p_action='verify_payment'then
  if o.payment_status='paid'then return public.website_order_view(o.id,true);end if;
  if q.status<>'accepted' or q.total is null or o.quote_amount<>q.total then raise exception 'accepted_quote_required';end if;
  if not exists(select 1 from public.website_order_payment_reports where order_id=o.id and status='reported')then raise exception 'payment_report_required';end if;
  if (p_input->>'amount')::bigint is distinct from q.total then raise exception 'payment_amount_mismatch';end if;
  if s.schedule_revision is distinct from (p_input->>'scheduleRevision')::bigint then raise exception 'schedule_changed';end if;
  select published->'bank'into bank from public.site_content where key='site';if s.verified_bank is null or bank<>s.verified_bank then raise exception 'bank_not_verified';end if;
  deadline:=(p_input->>'deadline')::date;reason:=trim(coalesce(p_input->>'reason',''));effort:=(p_input->>'effortDays')::int;
  if deadline is null or deadline<(now()at time zone'Asia/Ulaanbaatar')::date then raise exception 'invalid_deadline';end if;
  if (p_input->'suggestion'->>'suggestedDeadline')is distinct from deadline::text and length(reason)<3 then raise exception 'deadline_override_reason_required';end if;
  if coalesce((p_input->'suggestion'->>'approximate')::boolean,true)and length(reason)<3 then raise exception 'schedule_review_required';end if;
  update public.website_orders set payment_status='paid',paid_at=now(),agreed_deadline=deadline,status='contacted'where id=o.id;
  update public.website_order_payment_reports set status='verified',verified_amount=q.total,verified_by=auth.uid(),verified_at=now()where order_id=o.id;
  insert into public.website_projects(order_id,created_by,status,workflow_managed,target_completion_date,estimated_effort_days,remaining_effort_days,schedule_buffer_days,suggested_completion_date,schedule_explanation,deadline_reason)
  values(o.id,auth.uid(),'planning',true,deadline,effort,effort,coalesce((s.scheduling->>'bufferWorkingDays')::int,0),(p_input->'suggestion'->>'suggestedDeadline')::date,p_input->'suggestion',reason)
  on conflict(order_id)do update set workflow_managed=true,target_completion_date=excluded.target_completion_date,estimated_effort_days=excluded.estimated_effort_days,remaining_effort_days=excluded.remaining_effort_days,schedule_buffer_days=excluded.schedule_buffer_days,suggested_completion_date=excluded.suggested_completion_date,schedule_explanation=excluded.schedule_explanation,deadline_reason=excluded.deadline_reason;
  label:='Төлбөр баталгаажсан — хөгжүүлэлт эхлэхээр хүлээгдэж байна';
 elsif p_action in('start','complete','deliver','change_deadline','update_progress','cancel')then
  if not o.workflow_managed then raise exception 'managed_order_required';end if;
  if p_action<>'cancel'and(o.payment_status<>'paid'or p.id is null)then raise exception 'verified_payment_required';end if;
  if p_action='start'then
   if p.status='in_progress'then return public.website_order_view(o.id,true);end if;
   if p.status<>'planning'or p.actual_started_at is not null then raise exception 'invalid_project_transition';end if;
   update public.website_projects set status='in_progress',actual_started_at=now(),start_date=(now()at time zone'Asia/Ulaanbaatar')::date where id=p.id;
   update public.website_orders set status='in_progress'where id=o.id;label:='Хөгжүүлэлт эхэлсэн';
  elsif p_action='complete'then
   if p.status='completed'then return public.website_order_view(o.id,true);end if;
   if p.status not in('in_progress','review')or p.actual_started_at is null then raise exception 'project_not_started';end if;
   if coalesce(p_input->>'url','')<>''and(p_input->>'url')!~'^https://[^[:space:]]+$'then raise exception 'invalid_delivery_url';end if;
   update public.website_projects set status='completed',actual_completed_at=now(),progress_percent=100,remaining_effort_days=0,delivery_url=nullif(p_input->>'url','')where id=p.id;
   update public.website_orders set status='completed'where id=o.id;label:='Веб сайт бэлэн болсон';
  elsif p_action='deliver'then
   if p.status<>'completed'or p.actual_completed_at is null then raise exception 'project_not_completed';end if;
   if coalesce(p_input->>'url',p.delivery_url,'')!~'^https://[^[:space:]]+$'then raise exception 'delivery_url_required';end if;
   update public.website_projects set delivered_at=now(),delivery_url=coalesce(nullif(p_input->>'url',''),delivery_url)where id=p.id;label:='Веб сайтыг хүлээлгэн өгсөн';
  elsif p_action='change_deadline'then
   deadline:=(p_input->>'deadline')::date;
   if p.status='completed'or deadline is null or deadline<(now()at time zone'Asia/Ulaanbaatar')::date or length(trim(coalesce(p_input->>'reason','')))<3 then raise exception 'invalid_deadline_change';end if;
   if deadline=o.agreed_deadline then return public.website_order_view(o.id,true);end if;
   update public.website_orders set agreed_deadline=deadline where id=o.id;update public.website_projects set target_completion_date=deadline,deadline_reason=p_input->>'reason'where id=p.id;label:='Дуусах хугацааг шинэчилсэн';
  elsif p_action='update_progress'then
   if p.status not in('planning','in_progress','review')or(p_input->>'progress')::int not between 0 and 99 or(p_input->>'remainingDays')::int<0 then raise exception 'invalid_progress';end if;
   update public.website_projects set progress_percent=(p_input->>'progress')::int,remaining_effort_days=(p_input->>'remainingDays')::int,queue_priority=coalesce((p_input->>'priority')::int,queue_priority)where id=p.id;label:='Ажлын явцыг шинэчилсэн';
  else
   if p.status='completed'or length(trim(coalesce(p_input->>'reason','')))<3 then raise exception 'invalid_cancellation';end if;
   update public.website_orders set status='cancelled'where id=o.id;update public.website_projects set status='cancelled'where id=p.id;label:='Захиалга цуцалсан';
  end if;
 else raise exception 'invalid_admin_action';end if;
 perform public.website_workflow_record(o.id,p_key,p_action,p_input,label);
 if p_action in('send_quote','verify_payment','start','complete','deliver','change_deadline')then perform public.website_workflow_queue_email(o.id,case p_action when'send_quote'then'quote_sent'when'verify_payment'then'payment_verified'when'start'then'development_started'when'complete'then'development_completed'when'deliver'then'delivered'else'deadline_changed'end);end if;
 return public.website_order_view(o.id,true);
end $$;

create or replace function public.website_workflow_guard()
returns trigger language plpgsql set search_path='' as $$
begin
 if tg_table_name='website_order_quotes'then
  if old.status='accepted'and new is distinct from old then raise exception 'accepted_quote_locked';end if;
  if old.status<>'draft'and(new.items is distinct from old.items or new.total is distinct from old.total or new.notes is distinct from old.notes or new.requirements is distinct from old.requirements)then raise exception 'quote_snapshot_locked';end if;
 elsif old.workflow_managed and current_user not in('postgres','service_role','supabase_admin')then raise exception 'workflow_command_required';
 end if;return new;
end $$;
drop trigger if exists website_quote_immutable on public.website_order_quotes;
create trigger website_quote_immutable before update on public.website_order_quotes for each row execute function public.website_workflow_guard();
drop trigger if exists website_order_managed_guard on public.website_orders;
create trigger website_order_managed_guard before update of quote_amount,payment_status,paid_at,payment_token,status,agreed_deadline on public.website_orders for each row execute function public.website_workflow_guard();
drop trigger if exists website_project_managed_guard on public.website_projects;
create trigger website_project_managed_guard before update on public.website_projects for each row execute function public.website_workflow_guard();
create or replace function public.website_managed_project_insert_guard()returns trigger language plpgsql set search_path='' as $$
begin
 if current_user not in('postgres','service_role','supabase_admin')and exists(select 1 from public.website_orders where id=new.order_id and workflow_managed)then raise exception 'workflow_command_required';end if;return new;
end $$;
drop trigger if exists website_project_managed_insert_guard on public.website_projects;
create trigger website_project_managed_insert_guard before insert on public.website_projects for each row execute function public.website_managed_project_insert_guard();
revoke all on function public.website_managed_project_insert_guard()from public,anon,authenticated;

create or replace function public.website_project_actual_dates()returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='in_progress'and(old.status is distinct from new.status)then new.actual_started_at:=coalesce(old.actual_started_at,now());new.start_date:=coalesce(old.start_date,(now()at time zone'Asia/Ulaanbaatar')::date);end if;
 if new.status='completed'and old.status is distinct from new.status then new.actual_completed_at:=coalesce(old.actual_completed_at,now());end if;return new;
end $$;
drop trigger if exists website_project_actual_dates on public.website_projects;
create trigger website_project_actual_dates before update on public.website_projects for each row execute function public.website_project_actual_dates();
create or replace function public.website_schedule_touch()returns trigger language plpgsql security definer set search_path='' as $$begin update public.website_workflow_settings set schedule_revision=schedule_revision+1 where id=1;return new;end $$;
drop trigger if exists website_project_schedule_touch on public.website_projects;
create trigger website_project_schedule_touch after insert or update of status,target_completion_date,remaining_effort_days,progress_percent,queue_priority on public.website_projects for each row execute function public.website_schedule_touch();

create or replace function public.website_order_email_claim(p_limit integer default 5)returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 update public.website_order_email_outbox set status='failed',last_error='delivery_uncertain',lease_token=null,lease_until=null,updated_at=now()where status='sending'and lease_until<now();
 with selected as(select id from public.website_order_email_outbox where status='pending'order by created_at for update skip locked limit greatest(1,least(p_limit,20))),claimed as(update public.website_order_email_outbox m set status='sending',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval'2 minutes',updated_at=now()from selected where m.id=selected.id returning m.*)select coalesce(jsonb_agg(to_jsonb(claimed)),'[]')into result from claimed;
 return result;
end $$;
create or replace function public.website_order_email_finish(p_id uuid,p_lease uuid,p_sent boolean,p_error text default null)returns boolean language plpgsql security definer set search_path='' as $$
begin update public.website_order_email_outbox set status=case when p_sent then'sent'else'failed'end,last_error=case when p_sent then null else left(coalesce(p_error,'send_failed'),80)end,sent_at=case when p_sent then now()else null end,lease_token=null,lease_until=null,updated_at=now()where id=p_id and lease_token=p_lease and status='sending';return found;end $$;

revoke all on function public.website_quote_totals(jsonb,bigint),public.website_workflow_record(uuid,uuid,text,jsonb,text),public.website_workflow_queue_email(uuid,text),public.website_order_view(uuid,boolean),public.website_workflow_guard(),public.website_project_actual_dates(),public.website_schedule_touch() from public,anon,authenticated;
revoke all on function public.website_order_admin_view(uuid),public.website_order_admin_command(uuid,text,uuid,jsonb)from public,anon;
grant execute on function public.website_order_admin_view(uuid),public.website_order_admin_command(uuid,text,uuid,jsonb)to authenticated;
revoke all on function public.website_order_initialize(uuid,text,jsonb),public.website_order_customer_view(text),public.website_order_customer_command(text,text,uuid,jsonb),public.website_order_email_claim(integer),public.website_order_email_finish(uuid,uuid,boolean,text)from public,anon,authenticated;
grant execute on function public.website_order_initialize(uuid,text,jsonb),public.website_order_customer_view(text),public.website_order_customer_command(text,text,uuid,jsonb),public.website_order_email_claim(integer),public.website_order_email_finish(uuid,uuid,boolean,text),public.website_quote_totals(jsonb,bigint)to service_role;

-- Initial owner-authorized policy, 2026-11-25. Existing settings are never overwritten.
insert into public.website_workflow_settings(id,pricing,scheduling)values(1,'{"enabled":true,"version":"axora-owner-2026-11-25","packages":[{"id":"starter","label":"Starter","basePrice":100000,"includedPages":1,"includedFeatures":["responsive","contact-info","location","basic-seo"],"includedRevisions":1,"minDays":2,"maxDays":3},{"id":"business","label":"Business","basePrice":200000,"includedPages":3,"includedFeatures":["responsive","contact-info","location","basic-seo","service-intro","gallery","contact-form","social-links"],"includedRevisions":2,"minDays":4,"maxDays":6},{"id":"premium","label":"Premium","basePrice":350000,"includedPages":5,"includedFeatures":["responsive","contact-info","location","basic-seo","service-intro","gallery","contact-form","social-links","product-catalog","qr-menu","order-link","advanced-seo"],"includedRevisions":3,"minDays":7,"maxDays":10}],"features":[{"id":"contact-form","label":"Холбоо барих анкет","answerValue":"Холбоо барих анкет","unitPrice":15000,"durationDays":1},{"id":"qr-menu","label":"QR меню","answerValue":"QR меню","unitPrice":25000,"durationDays":1},{"id":"gallery","label":"Зургийн галерей","answerValue":"Зургийн галерей","unitPrice":20000,"durationDays":1},{"id":"product-catalog","label":"Бүтээгдэхүүний каталог","answerValue":"Бүтээгдэхүүний каталог","unitPrice":50000,"durationDays":2},{"id":"booking","label":"Цаг захиалгын систем","answerValue":"Цаг захиалгын систем","unitPrice":80000,"durationDays":3},{"id":"online-orders","label":"Онлайн захиалгын систем","answerValue":"Онлайн захиалгын систем","unitPrice":80000,"durationDays":3},{"id":"qpay","label":"QPay холболт","answerValue":"QPay холболт","unitPrice":100000,"durationDays":3},{"id":"auth","label":"Хэрэглэгчийн бүртгэл, нэвтрэлт","answerValue":"Хэрэглэгчийн бүртгэл, нэвтрэлт","unitPrice":100000,"durationDays":3},{"id":"admin-dashboard","label":"Admin Dashboard","answerValue":"Admin Dashboard","unitPrice":150000,"durationDays":4},{"id":"database","label":"Өгөгдлийн сангийн нэмэлт хөгжүүлэлт","answerValue":"Өгөгдлийн сангийн нэмэлт хөгжүүлэлт","unitPrice":80000,"durationDays":2},{"id":"multilingual","label":"Олон хэлний тохиргоо","answerValue":"Олон хэлний тохиргоо","unitPrice":50000,"durationDays":2},{"id":"3d-animation","label":"Тусгай 3D animation","answerValue":"Тусгай 3D animation","unitPrice":60000,"durationDays":2}],"additionalPagePrice":30000,"additionalPageDays":1,"discountPercent":0,"rushPercent":30,"monthlyMaintenancePrice":30000,"extraRevisionPrice":15000,"extraRevisionDays":null}'::jsonb,'{"enabled":true,"workingDays":[1,2,3,4,5],"maxParallelProjects":1,"bufferWorkingDays":2,"holidays":[],"queueStrategy":"fifo"}'::jsonb)on conflict(id)do nothing;
commit;
notify pgrst,'reload schema';
