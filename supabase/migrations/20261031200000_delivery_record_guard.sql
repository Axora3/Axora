-- Recheck delivery authorization under a row lock before returning a signed
-- link to the administrator. No data backfill and no historical rewrites.
begin;

create or replace function public.record_delivery_link(p_request uuid, p_hours integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gate jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  if p_hours is not null and p_hours not in (24, 72, 168) then
    return jsonb_build_object('status', 'invalid_duration');
  end if;
  perform 1 from public.template_requests where id = p_request for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  v_gate := public.authorize_delivery_link(p_request);
  if v_gate ->> 'status' is distinct from 'ok' then
    return v_gate;
  end if;
  update public.template_requests
     set delivery_link_created_at = now(),
         delivery_status = case when delivery_status = 'delivered' then 'delivered' else 'link_created' end
   where id = p_request;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'download_link_created', 'template_request', p_request::text, jsonb_build_object('hours', p_hours));
  return jsonb_build_object('status', 'ok');
end;
$$;

revoke all on function public.record_delivery_link(uuid, integer) from public, anon;
grant execute on function public.record_delivery_link(uuid, integer) to authenticated;
commit;
