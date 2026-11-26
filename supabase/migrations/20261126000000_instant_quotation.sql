-- Additive owner-authorized automatic quotations. No order/data reset.
begin;
alter table public.website_workflow_settings add column if not exists initializations jsonb not null default '{}';
do $$
declare bank jsonb := '{"name":"Богд банк","holder":"Batmanlai","account":"300038008093993939"}'; previous jsonb;
begin
 if not exists(select 1 from public.website_workflow_settings where id=1 and initializations ? 'bogd-owner-2026-11-26') then
  select published->'bank' into previous from public.site_content where key='site';
  update public.site_content set published=jsonb_set(coalesce(published,'{}'),'{bank}',bank),draft=jsonb_set(coalesce(draft,'{}'),'{bank}',bank) where key='site';
  update public.website_workflow_settings set verified_bank=bank,bank_instructions='Гүйлгээний утга дээр захиалгын дугаараа заавал бичнэ үү.',initializations=initializations||'{"bogd-owner-2026-11-26":true}',version=gen_random_uuid() where id=1;
  insert into public.admin_audit_log(action,entity_type,entity_id,details) values('owner_bank_initialized','site_content','site',jsonb_build_object('previous',previous,'bank',bank,'source','owner supplied 2026-11-26'));
 end if;
end $$;

-- Retain reviewed/manual quote handling and historical behavior behind private helpers.
do $$ begin
 if to_regprocedure('public.website_order_initialize_review_v1(uuid,text,jsonb)') is null then
  alter function public.website_order_initialize(uuid,text,jsonb) rename to website_order_initialize_review_v1;
 end if;
 if to_regprocedure('public.website_order_customer_command_review_v1(text,text,uuid,jsonb)') is null then
  alter function public.website_order_customer_command(text,text,uuid,jsonb) rename to website_order_customer_command_review_v1;
 end if;
 if to_regprocedure('public.website_order_view_review_v1(uuid,boolean)') is null then
  alter function public.website_order_view(uuid,boolean) rename to website_order_view_review_v1;
 end if;
end $$;
revoke all on function public.website_order_initialize_review_v1(uuid,text,jsonb),public.website_order_customer_command_review_v1(text,text,uuid,jsonb),public.website_order_view_review_v1(uuid,boolean) from public,anon,authenticated,service_role;

create or replace function public.website_order_view(p_order uuid,p_admin boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; flags jsonb;
begin
 result:=public.website_order_view_review_v1(p_order,p_admin);
 if result is null then return null;end if;
 select review_flags into flags from public.website_order_quotes where order_id=p_order order by version desc limit 1;
 if flags is not null then result:=jsonb_set(result,'{quote,review_flags}',flags);end if;
 return result||jsonb_build_object('answers',(select answers from public.website_orders where id=p_order));
end $$;
revoke all on function public.website_order_view(uuid,boolean) from public,anon,authenticated;
grant execute on function public.website_order_view(uuid,boolean) to service_role;

create or replace function public.website_order_initialize(p_order uuid,p_token text,p_draft jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.website_order_quotes;o public.website_orders;
begin
 select * into o from public.website_orders where id=p_order for update;
 -- A historical manually agreed amount/payment is never replaced by inferred pricing.
 if o.payment_status='paid' or (not o.workflow_managed and o.quote_amount is not null) then return public.website_order_view(p_order,false);end if;
 perform public.website_order_initialize_review_v1(p_order,p_token,p_draft);
 select * into q from public.website_order_quotes where order_id=p_order order by version desc limit 1;
 if o.status<>'cancelled' and q.status='draft' and q.created_by is null and q.total>0 and q.pricing_version is not null and jsonb_array_length(q.review_flags)=0 then
  update public.website_order_quotes set status='sent',sent_at=now() where id=q.id;
  perform public.website_workflow_record(p_order,gen_random_uuid(),'auto_quote','{}','Үнийн санал автоматаар бэлэн болсон');
 end if;
 return public.website_order_view(p_order,false);
end $$;
revoke all on function public.website_order_initialize(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.website_order_initialize(uuid,text,jsonb) to service_role;

create or replace function public.website_order_customer_command(p_token text,p_action text,p_key uuid,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.website_orders;q public.website_order_quotes;e public.website_order_workflow_events;t jsonb;d jsonb;
begin
 if p_action not in('revise','cancel') then return public.website_order_customer_command_review_v1(p_token,p_action,p_key,p_input);end if;
 select * into o from public.website_orders where payment_token=p_token and length(p_token)=32 for update;
 if not found then return null;end if;
 select * into e from public.website_order_workflow_events where order_id=o.id and request_key=p_key;
 if found then if e.action<>p_action or (e.request_payload-'draft')<>(p_input-'draft') then raise exception 'idempotency_conflict';end if;return public.website_order_view(o.id,false);end if;
 select * into q from public.website_order_quotes where order_id=o.id order by version desc limit 1;
 if o.status='cancelled' or o.payment_status='paid' then raise exception 'order_closed';end if;
 if q.version is distinct from (p_input->>'version')::int then raise exception 'stale_quote';end if;
 if exists(select 1 from public.website_order_quotes where order_id=o.id and status='accepted') then raise exception 'accepted_quote_locked';end if;
 if p_action='cancel' then
  update public.website_orders set status='cancelled' where id=o.id;
  perform public.website_workflow_record(o.id,p_key,p_action,p_input,'Захиалагч захиалгаа цуцалсан');
 else
  d:=p_input->'draft';
  if jsonb_typeof(p_input->'answers') is distinct from 'object' or jsonb_typeof(d) is distinct from 'object' then raise exception 'invalid_revision';end if;
  t:=public.website_quote_totals(d->'items',coalesce((d->>'discount')::bigint,0));
  update public.website_order_quotes set status='superseded' where id=q.id;
  update public.website_orders set answers=p_input->'answers',quote_amount=null where id=o.id;
  insert into public.website_order_quotes(order_id,version,status,pricing_version,package_label,requirements,items,subtotal,discount,total,monthly_total,external_total,estimated_effort_days,review_flags,sent_at)
  values(o.id,q.version+1,case when jsonb_array_length(d->'reviewFlags')=0 and (t->>'total')::bigint>0 then 'sent' else 'draft' end,d->>'pricingVersion',d->>'packageLabel',d->'requirements',t->'items',(t->>'subtotal')::bigint,(t->>'discount')::bigint,case when jsonb_array_length(d->'reviewFlags')=0 then (t->>'total')::bigint else null end,(t->>'monthlyTotal')::bigint,(t->>'externalTotal')::bigint,(d->>'effortDays')::int,d->'reviewFlags',case when jsonb_array_length(d->'reviewFlags')=0 then now() else null end);
  perform public.website_workflow_record(o.id,p_key,p_action,p_input,'Анкет шинэчилж үнийн саналыг дахин тооцсон');
 end if;
 return public.website_order_view(o.id,false);
end $$;
revoke all on function public.website_order_customer_command(text,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.website_order_customer_command(text,text,uuid,jsonb) to service_role;

create or replace function public.website_workflow_record(p_order uuid,p_key uuid,p_action text,p_payload jsonb,p_label text)
returns void language plpgsql security definer set search_path='' as $$
declare o public.website_orders; title text; body text;
begin
 update public.website_orders set workflow_revision=workflow_revision+1 where id=p_order returning * into o;
 insert into public.website_order_workflow_events(order_id,request_key,action,request_payload,actor_id,label)values(p_order,p_key,p_action,p_payload,auth.uid(),p_label);
 if auth.uid() is not null then insert into public.admin_audit_log(actor_id,action,entity_type,entity_id,details) values(auth.uid(),'workflow_'||p_action,'order',p_order::text,jsonb_build_object('reference',o.reference,'label',p_label));end if;
 title:=p_label||' · '||o.reference;body:=p_label;
 if p_action='report_payment' then
  title:='Шинэ төлбөр шалгах хүсэлт · '||o.reference;
  body:=o.full_name||' · '||o.reference||' · '||o.quote_amount::text||' MNT · '||now()::text;
 end if;
 insert into public.admin_notifications(admin_id,event_type,title,body,entity_type,entity_id)
 select user_id,'order_workflow',left(title,160),left(body,500),'website_order',p_order from public.admin_users;
end $$;
notify pgrst, 'reload schema';
commit;
