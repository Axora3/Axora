-- Website order quote and manual payment status.
-- Additive: existing orders stay unpaid with no amount until an admin sets one.
-- `paid` is an admin's own record; no bank or gateway confirms it.

begin;

alter table public.website_orders
  add column if not exists quote_amount bigint check (quote_amount is null or quote_amount > 0),
  add column if not exists payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  add column if not exists paid_at timestamptz,
  -- Random secret for the customer's payment link. Never derived from the reference.
  add column if not exists payment_token text unique;

alter table public.website_orders drop constraint if exists website_orders_paid_consistent;
alter table public.website_orders add constraint website_orders_paid_consistent
  check (payment_status = 'unpaid' or (quote_amount is not null and paid_at is not null));

-- Admins may change only these new columns; answers and customer fields stay read-only.
grant update (quote_amount, payment_status, paid_at, payment_token) on public.website_orders to authenticated;

create or replace function public.audit_order_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.payment_status is distinct from old.payment_status then
    v_action := case when new.payment_status = 'paid' then 'order_marked_paid' else 'order_marked_unpaid' end;
  elsif new.quote_amount is distinct from old.quote_amount then
    v_action := 'order_quote_set';
  else
    return new;
  end if;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), v_action, 'order', new.id::text, jsonb_build_object('reference', new.reference, 'amount', new.quote_amount));
  return new;
end;
$$;
revoke all on function public.audit_order_payment() from public, anon, authenticated;

drop trigger if exists website_orders_payment_audit on public.website_orders;
create trigger website_orders_payment_audit after update of quote_amount, payment_status on public.website_orders
  for each row execute function public.audit_order_payment();

commit;

notify pgrst, 'reload schema';
