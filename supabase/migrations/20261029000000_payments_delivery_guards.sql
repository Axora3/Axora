-- AXORA — manual payment confirmation, delivery state, status guards
-- Additive only: existing rows and columns are kept. Run after
-- 20261028100000_admin_panel.sql.
--
-- What this adds
--   * template_requests: the price agreed AT REQUEST TIME (snapshot), a
--     payment status that an admin confirms by hand, who/when confirmed it,
--     a delivery status kept apart from the request status, and the time of
--     first contact.
--   * Old requests have no snapshot. They are NOT back-filled with today's
--     template price; they get payment_status = 'needs_review' and the admin
--     enters the amount actually agreed when confirming.
--   * Database-side guards: allowed status transitions, "fulfilled" only
--     after payment, publishing only with the required fields/file.
--   * SECURITY DEFINER functions for the two privileged actions (confirm a
--     payment, authorise/record a delivery link). They check is_admin()
--     themselves and write the audit row in the same transaction.
--
-- "confirmed_manual" means an admin said the money arrived. Nothing here
-- talks to a bank or payment gateway.

-- ---------------------------------------------------------------------------
-- template_requests: snapshot, payment, delivery, first contact
-- ---------------------------------------------------------------------------
alter table public.template_requests
  add column if not exists price_snapshot numeric(12, 2) check (price_snapshot is null or price_snapshot >= 0),
  add column if not exists currency_snapshot text check (currency_snapshot is null or currency_snapshot ~ '^[A-Z]{3}$'),
  add column if not exists is_free_snapshot boolean,
  -- not_required: free product · pending: paid, waiting · needs_review: no
  -- snapshot (older request), amount must be confirmed by hand
  add column if not exists payment_status text not null default 'needs_review'
    check (payment_status in ('not_required', 'pending', 'needs_review', 'confirmed_manual')),
  add column if not exists payment_confirmed_by uuid references auth.users (id) on delete set null,
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_confirmed_amount numeric(12, 2) check (payment_confirmed_amount is null or payment_confirmed_amount > 0),
  add column if not exists payment_confirmed_currency text check (payment_confirmed_currency is null or payment_confirmed_currency ~ '^[A-Z]{3}$'),
  add column if not exists payment_amount_source text check (payment_amount_source in ('snapshot', 'admin_entered')),
  -- link_created ≠ sent ≠ downloaded. "delivered" is set only when the admin
  -- marks the request fulfilled (they sent it themselves).
  add column if not exists delivery_status text not null default 'not_sent'
    check (delivery_status in ('not_sent', 'link_created', 'delivered')),
  add column if not exists delivery_link_created_at timestamptz,
  add column if not exists first_contacted_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'template_requests_payment_confirmed_complete') then
    alter table public.template_requests
      add constraint template_requests_payment_confirmed_complete
      check (payment_status <> 'confirmed_manual'
             or (payment_confirmed_at is not null and payment_confirmed_amount is not null and payment_confirmed_currency is not null));
  end if;
end $$;

-- Existing data: already-fulfilled requests were delivered by hand.
update public.template_requests set delivery_status = 'delivered' where status = 'fulfilled' and delivery_status = 'not_sent';

-- First contact for old rows, from the audit log when it is known (else left null).
update public.template_requests r
   set first_contacted_at = a.at
  from (
    select entity_id, min(created_at) as at
      from public.admin_audit_log
     where entity_type = 'template_request' and action = 'status_changed' and details ->> 'from' = 'new'
     group by entity_id
  ) a
 where r.first_contacted_at is null and a.entity_id = r.id::text;

create index if not exists template_requests_new_created_idx on public.template_requests (created_at) where status = 'new';
create index if not exists template_requests_payment_idx on public.template_requests (payment_status);

-- Snapshot is always taken by the database from the template row, never from
-- the request payload.
create or replace function public.template_requests_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.templates%rowtype;
begin
  select * into t from public.templates where id = new.template_id;
  if found then
    new.price_snapshot := t.price;
    new.currency_snapshot := t.currency;
    new.is_free_snapshot := t.is_free;
    new.payment_status := case when t.is_free then 'not_required' else 'pending' end;
  else
    new.payment_status := 'needs_review';
  end if;
  new.payment_confirmed_by := null;
  new.payment_confirmed_at := null;
  new.payment_confirmed_amount := null;
  new.payment_confirmed_currency := null;
  new.payment_amount_source := null;
  new.delivery_status := 'not_sent';
  new.delivery_link_created_at := null;
  new.first_contacted_at := null;
  return new;
end;
$$;

drop trigger if exists template_requests_snapshot on public.template_requests;
create trigger template_requests_snapshot before insert on public.template_requests
  for each row execute function public.template_requests_snapshot();

-- ---------------------------------------------------------------------------
-- Status transitions (also mirrored in src/lib/admin/transitions.ts)
-- ---------------------------------------------------------------------------
-- Orders: "completed" only from "in_progress", and back only to "in_progress".
-- Requests: "fulfilled" only from "contacted" and only once payment is not
-- required or confirmed; back only to "contacted".
create or replace function public.guard_order_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if (new.status = 'completed' and old.status <> 'in_progress')
       or (old.status = 'completed' and new.status <> 'in_progress') then
      raise exception using errcode = 'P0001', message = 'invalid_transition',
        detail = format('%s -> %s', old.status, new.status);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists website_orders_guard_status on public.website_orders;
create trigger website_orders_guard_status before update of status on public.website_orders
  for each row execute function public.guard_order_status();

create or replace function public.guard_request_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if (new.status = 'fulfilled' and old.status <> 'contacted')
       or (old.status = 'fulfilled' and new.status <> 'contacted') then
      raise exception using errcode = 'P0001', message = 'invalid_transition',
        detail = format('%s -> %s', old.status, new.status);
    end if;
    if new.status = 'fulfilled' and new.payment_status not in ('not_required', 'confirmed_manual') then
      raise exception using errcode = 'P0001', message = 'payment_not_confirmed';
    end if;
    if old.status = 'new' and new.status in ('contacted', 'fulfilled') and new.first_contacted_at is null then
      new.first_contacted_at := now();
    end if;
    if new.status = 'fulfilled' then
      new.delivery_status := 'delivered';
    elsif old.status = 'fulfilled' then
      new.delivery_status := case when new.delivery_link_created_at is not null then 'link_created' else 'not_sent' end;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists template_requests_guard on public.template_requests;
create trigger template_requests_guard before update on public.template_requests
  for each row execute function public.guard_request_update();

-- ---------------------------------------------------------------------------
-- Publishing guard: the database refuses a published row that the public
-- page could not show correctly, or a paid one with nothing to deliver.
-- Demo seed rows (is_demo) are examples, not sellable products.
-- ---------------------------------------------------------------------------
create or replace function public.guard_template_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  missing text[] := '{}';
begin
  if new.status <> 'published' or new.is_demo then
    return new;
  end if;
  if char_length(btrim(new.title)) = 0 then missing := missing || 'title'; end if;
  if char_length(btrim(new.slug)) = 0 then missing := missing || 'slug'; end if;
  if char_length(btrim(new.short_description)) = 0 then missing := missing || 'short_description'; end if;
  if (new.is_free and new.price <> 0) or (not new.is_free and new.price <= 0) then missing := missing || 'price'; end if;
  if not new.is_free and not exists (
    select 1 from public.template_files f
     where f.template_id = new.id and (f.storage_path is not null or f.external_url is not null)
  ) then
    missing := missing || 'file';
  end if;
  if array_length(missing, 1) > 0 then
    raise exception using errcode = 'P0001', message = 'publish_requirements', detail = array_to_string(missing, ',');
  end if;
  return new;
end;
$$;

drop trigger if exists templates_guard_publish on public.templates;
create trigger templates_guard_publish before insert or update on public.templates
  for each row execute function public.guard_template_publish();

-- Removing the last delivery file of a published paid product is refused.
create or replace function public.guard_template_file_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.templates t
     where t.id = old.template_id and t.status = 'published' and not t.is_free and not t.is_demo
  ) and not exists (
    select 1 from public.template_files f where f.template_id = old.template_id and f.id <> old.id
  ) then
    raise exception using errcode = 'P0001', message = 'publish_requirements', detail = 'file';
  end if;
  return old;
end;
$$;

drop trigger if exists template_files_guard_delete on public.template_files;
create trigger template_files_guard_delete before delete on public.template_files
  for each row execute function public.guard_template_file_delete();

-- ---------------------------------------------------------------------------
-- Manual payment confirmation (admin only, idempotent)
-- Returns {status: confirmed | already_confirmed | not_required | cancelled |
--          amount_required | amount_mismatch | not_found | forbidden}
-- ---------------------------------------------------------------------------
create or replace function public.confirm_template_payment(
  p_request uuid,
  p_amount numeric default null,
  p_currency text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.template_requests%rowtype;
  v_amount numeric(12, 2);
  v_currency text;
  v_source text;
begin
  if auth.uid() is null or not public.is_admin() then
    return jsonb_build_object('status', 'forbidden');
  end if;

  -- Row lock: a double click or a second tab waits here, then sees "already".
  select * into r from public.template_requests where id = p_request for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if r.payment_status = 'confirmed_manual' then
    return jsonb_build_object('status', 'already_confirmed', 'confirmed_at', r.payment_confirmed_at,
      'amount', r.payment_confirmed_amount, 'currency', r.payment_confirmed_currency);
  end if;
  if r.payment_status = 'not_required' then
    return jsonb_build_object('status', 'not_required');
  end if;
  if r.status = 'cancelled' then
    return jsonb_build_object('status', 'cancelled');
  end if;

  if r.payment_status = 'pending' and r.price_snapshot is not null and r.price_snapshot > 0 then
    -- The screen showed the snapshot; refuse if it no longer matches.
    if p_amount is not null and p_amount <> r.price_snapshot then
      return jsonb_build_object('status', 'amount_mismatch', 'amount', r.price_snapshot, 'currency', r.currency_snapshot);
    end if;
    v_amount := r.price_snapshot;
    v_currency := r.currency_snapshot;
    v_source := 'snapshot';
  else
    if p_amount is null or p_amount <= 0 or p_currency is null or p_currency !~ '^[A-Z]{3}$' then
      return jsonb_build_object('status', 'amount_required');
    end if;
    v_amount := p_amount;
    v_currency := p_currency;
    v_source := 'admin_entered';
  end if;

  update public.template_requests
     set payment_status = 'confirmed_manual',
         payment_confirmed_by = auth.uid(),
         payment_confirmed_at = now(),
         payment_confirmed_amount = v_amount,
         payment_confirmed_currency = v_currency,
         payment_amount_source = v_source
   where id = p_request;

  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'payment_confirmed', 'template_request', p_request::text,
          jsonb_build_object('amount', v_amount, 'currency', v_currency, 'source', v_source, 'method', 'manual'));

  return jsonb_build_object('status', 'confirmed', 'amount', v_amount, 'currency', v_currency, 'source', v_source);
end;
$$;

revoke all on function public.confirm_template_payment(uuid, numeric, text) from public, anon;
grant execute on function public.confirm_template_payment(uuid, numeric, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Delivery link gate (admin only)
-- Checks, in the database: admin · request ↔ template · free/paid ·
-- payment confirmed · a delivery file exists. Returns the private file
-- reference; the server then creates a short-lived signed URL.
-- ---------------------------------------------------------------------------
create or replace function public.authorize_delivery_link(p_request uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.template_requests%rowtype;
  f public.template_files%rowtype;
  v_free boolean;
begin
  if auth.uid() is null or not public.is_admin() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  select * into r from public.template_requests where id = p_request;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if r.status = 'cancelled' then
    return jsonb_build_object('status', 'cancelled');
  end if;
  if not exists (select 1 from public.templates t where t.id = r.template_id) then
    return jsonb_build_object('status', 'no_template');
  end if;
  -- Free only if it was free when requested; unknown (old rows) counts as paid.
  v_free := coalesce(r.is_free_snapshot, false) and r.payment_status = 'not_required';
  if not v_free and r.payment_status <> 'confirmed_manual' then
    return jsonb_build_object('status', 'payment_not_confirmed');
  end if;
  select * into f from public.template_files
   where template_id = r.template_id and (storage_path is not null or external_url is not null)
   order by created_at desc limit 1;
  if not found then
    return jsonb_build_object('status', 'no_file');
  end if;
  return jsonb_build_object('status', 'ok', 'free', v_free, 'storage_path', f.storage_path, 'external_url', f.external_url);
end;
$$;

revoke all on function public.authorize_delivery_link(uuid) from public, anon;
grant execute on function public.authorize_delivery_link(uuid) to authenticated;

-- Records that a link was CREATED (not sent, not downloaded). The URL itself
-- is never stored.
create or replace function public.record_delivery_link(p_request uuid, p_hours integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  update public.template_requests
     set delivery_link_created_at = now(),
         delivery_status = case when delivery_status = 'delivered' then 'delivered' else 'link_created' end
   where id = p_request;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'download_link_created', 'template_request', p_request::text, jsonb_build_object('hours', p_hours));
  return jsonb_build_object('status', 'ok');
end;
$$;

revoke all on function public.record_delivery_link(uuid, integer) from public, anon;
grant execute on function public.record_delivery_link(uuid, integer) to authenticated;
