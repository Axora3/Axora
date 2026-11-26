begin;
alter table public.website_order_email_outbox add column if not exists provider_message_id text;
create or replace function public.website_order_email_receipt(p_id uuid,p_lease uuid,p_message_id text)returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.website_order_email_outbox set provider_message_id=left(p_message_id,500) where id=p_id and lease_token=p_lease and status='sending';
 return found;
end $$;
revoke all on function public.website_order_email_receipt(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.website_order_email_receipt(uuid,uuid,text) to service_role;
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
 if p_admin then result:=result||jsonb_build_object('customerEmail',o.email,'quotes',coalesce((select jsonb_agg(to_jsonb(v)order by v.version desc)from public.website_order_quotes v where order_id=p_order),'[]'),'emailEvents',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'event_type',m.event_type,'status',m.status,'attempts',m.attempts,'last_error',m.last_error,'provider_message_id',m.provider_message_id,'created_at',m.created_at)order by m.created_at desc)from public.website_order_email_outbox m where order_id=p_order),'[]'),'customerRequests',coalesce((select jsonb_agg(jsonb_build_object('message',e.request_payload->>'message','created_at',e.created_at)order by e.created_at desc)from public.website_order_workflow_events e where e.order_id=p_order and e.action='revision'),'[]'),'trackingPath',case when o.payment_token is null then null else '/order/pay/'||o.payment_token end);end if;
 return result;
end $$;
commit;
notify pgrst,'reload schema';
