begin;

create table if not exists public.template_download_tokens (
  request_id uuid primary key references public.template_requests(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  storage_path text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);
alter table public.template_download_tokens enable row level security;
revoke all on public.template_download_tokens from anon, authenticated;
grant select on public.template_download_tokens to service_role;

create or replace function public.issue_single_use_download(p_request uuid, p_hash text, p_hours integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare g jsonb; expiry timestamptz;
begin
  if auth.uid() is null or not public.is_admin() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  if p_hours is null or p_hours not in (24,72,168) or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('status', 'invalid');
  end if;
  perform 1 from public.template_requests where id = p_request for update;
  g := public.authorize_delivery_link(p_request);
  if g->>'status' <> 'ok' then return g; end if;
  if g->>'storage_path' is null then return jsonb_build_object('status', 'storage_required'); end if;
  expiry := now() + make_interval(hours => p_hours);
  insert into public.template_download_tokens(request_id,token_hash,storage_path,expires_at)
    values(p_request,p_hash,g->>'storage_path',expiry)
    on conflict(request_id) do update set token_hash=excluded.token_hash,
      storage_path=excluded.storage_path, expires_at=excluded.expires_at,
      consumed_at=null;
  perform public.record_delivery_link(p_request,p_hours);
  return jsonb_build_object('status','ok','expires_at',expiry);
end;
$$;
revoke all on function public.issue_single_use_download(uuid,text,integer) from public,anon;
grant execute on function public.issue_single_use_download(uuid,text,integer) to authenticated;

-- Only the server can redeem. Lock the purchase first, just like issuance;
-- concurrent POSTs cannot redeem the same link twice. Admin reissue explicitly
-- replaces the token and grants a fresh single download, invalidating the old URL.
create or replace function public.consume_single_use_download(p_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare rid uuid; r public.template_requests%rowtype;
begin
  select request_id into rid from public.template_download_tokens where token_hash=p_hash;
  if rid is null then return false; end if;
  select * into r from public.template_requests where id=rid for update;
  if not found or r.status='cancelled' or not (
    r.payment_status='confirmed_manual' or
    (coalesce(r.is_free_snapshot,false) and r.payment_status='not_required')
  ) then return false; end if;
  update public.template_download_tokens set consumed_at=now()
    where request_id=rid and token_hash=p_hash and consumed_at is null and expires_at>now();
  return found;
end;
$$;
revoke all on function public.consume_single_use_download(text) from public,anon,authenticated;
grant execute on function public.consume_single_use_download(text) to service_role;
commit;
notify pgrst, 'reload schema';
