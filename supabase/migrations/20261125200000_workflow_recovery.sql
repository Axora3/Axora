alter table public.website_order_payment_reports add column if not exists verification_note text not null default '';
create or replace function public.website_workflow_queue_email(p_order uuid,p_event text)
returns void language plpgsql security definer set search_path='' as $$
declare o public.website_orders; q public.website_order_quotes;p public.website_projects;
begin
 select * into o from public.website_orders where id=p_order;
 select * into q from public.website_order_quotes where order_id=p_order order by version desc limit 1;
 select * into p from public.website_projects where order_id=p_order;
 insert into public.website_order_email_outbox(order_id,event_key,event_type,payload)
 values(p_order,p_order::text||':'||p_event||':'||o.workflow_revision,p_event,jsonb_build_object('to',o.email,'name',o.full_name,'reference',o.reference,'amount',coalesce(q.total,o.quote_amount),'deadline',o.agreed_deadline,'effortDays',q.estimated_effort_days,'projectStatus',p.status,'startedAt',p.actual_started_at,'completedAt',p.actual_completed_at,'deliveryUrl',p.delivery_url,'notes',q.notes,'paymentNote',(select verification_note from public.website_order_payment_reports where order_id=o.id),'trackingPath','/order/pay/'||o.payment_token)) on conflict(event_key) do nothing;
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
 'paymentReport',case when report.id is null then null else jsonb_build_object('id',report.id,'status',report.status,'reference',report.reference,'note',report.note,'review_note',report.review_note,'verification_note',report.verification_note,'reported_at',report.reported_at)end,
 'bank',case when q.status='accepted' and s.verified_bank=bank and length(trim(bank->>'name'))>=2 and length(trim(bank->>'holder'))>=2 and length(trim(bank->>'account'))>=6 then bank else null end,'bankInstructions',s.bank_instructions,
 'history',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'label',e.label,'created_at',e.created_at)order by e.created_at desc)from public.website_order_workflow_events e where e.order_id=p_order),'[]'));
 if p_admin then result:=result||jsonb_build_object('quotes',coalesce((select jsonb_agg(to_jsonb(v)order by v.version desc)from public.website_order_quotes v where order_id=p_order),'[]'),'emailEvents',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'event_type',m.event_type,'status',m.status,'attempts',m.attempts,'last_error',m.last_error,'created_at',m.created_at)order by m.created_at desc)from public.website_order_email_outbox m where order_id=p_order),'[]'),'customerRequests',coalesce((select jsonb_agg(jsonb_build_object('message',e.request_payload->>'message','created_at',e.created_at)order by e.created_at desc)from public.website_order_workflow_events e where e.order_id=p_order and e.action='revision'),'[]'),'trackingPath',case when o.payment_token is null then null else '/order/pay/'||o.payment_token end);end if;
 return result;
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
  update public.website_order_payment_reports set status='verified',verified_amount=q.total,verified_by=auth.uid(),verified_at=now(),verification_note=left(trim(coalesce(p_input->>'customerNote','')),2000)where order_id=o.id;
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
