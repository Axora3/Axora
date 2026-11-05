-- Template purchases: optional phone and Messenger, plus a record of the
-- download email. Additive: existing requests keep their values.

begin;

alter table public.template_requests
  add column if not exists customer_phone text check (customer_phone is null or char_length(customer_phone) between 8 and 40),
  add column if not exists customer_messenger text check (customer_messenger is null or char_length(customer_messenger) between 3 and 200),
  add column if not exists delivery_emailed_at timestamptz;

-- Called after the email provider accepted the message. The status moves through
-- `contacted` because the existing guard only allows fulfilled from there, and that
-- guard is also what sets delivery_status to delivered.
create or replace function public.record_delivery_email(p_request uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  perform 1 from public.template_requests where id = p_request for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  update public.template_requests set status = 'contacted' where id = p_request and status = 'new';
  update public.template_requests set status = 'fulfilled' where id = p_request and status = 'contacted';
  update public.template_requests set delivery_emailed_at = now() where id = p_request;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'delivery_emailed', 'template_request', p_request::text, '{}'::jsonb);
  return jsonb_build_object('status', 'ok');
end;
$$;

revoke all on function public.record_delivery_email(uuid) from public, anon;
grant execute on function public.record_delivery_email(uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
