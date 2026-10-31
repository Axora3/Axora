-- Additive follow-up to 20261031000000_admin_modules.sql. No backfill or data deletion.
begin;

alter table public.admin_notifications drop constraint if exists admin_notifications_event_type_check;
alter table public.admin_notifications add constraint admin_notifications_event_type_check
  check (event_type in ('new_order', 'new_template_request', 'payment_review', 'payment_confirmed_manual', 'new_contact_message'));

-- A shared trigger must not resolve fields that do not exist on another table.
create or replace function public.create_admin_event_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new jsonb := to_jsonb(new);
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  v_type text;
  v_title text;
  v_body text;
  v_entity text;
  v_entity_id uuid;
begin
  if tg_table_name = 'website_orders' and tg_op = 'INSERT' then
    v_type := 'new_order';
    v_title := 'Шинэ веб захиалга';
    v_body := 'Лавлагаа ' || (v_new ->> 'reference') || ' — дэлгэрэнгүйг шалгана уу.';
    v_entity := 'website_order';
    v_entity_id := new.id;
  elsif tg_table_name = 'template_requests' and tg_op = 'INSERT' then
    v_type := 'new_template_request';
    v_title := 'Шинэ загварын хүсэлт';
    v_body := 'Шинэ “Авах хүсэлт” ирлээ.';
    v_entity := 'template_request';
    v_entity_id := new.id;
  elsif tg_table_name = 'template_requests' and tg_op = 'UPDATE'
        and (v_new ->> 'payment_status') is distinct from (v_old ->> 'payment_status')
        and (v_new ->> 'payment_status') in ('pending', 'needs_review') then
    v_type := 'payment_review';
    v_title := 'Төлбөр шалгах шаардлагатай';
    v_body := 'Template хүсэлтийн төлбөрийн төлөв өөрчлөгдлөө.';
    v_entity := 'template_request';
    v_entity_id := new.id;
  elsif tg_table_name = 'template_requests' and tg_op = 'UPDATE'
        and (v_new ->> 'payment_status') is distinct from (v_old ->> 'payment_status')
        and (v_new ->> 'payment_status') = 'confirmed_manual' then
    v_type := 'payment_confirmed_manual';
    v_title := 'Төлбөр гараар баталгаажсан';
    v_body := 'Админ төлбөрийг гараар баталгаажуулсан. Банкнаас автоматаар шалгаагүй.';
    v_entity := 'template_request';
    v_entity_id := new.id;
  elsif tg_table_name = 'contact_messages' and tg_op = 'INSERT' then
    v_type := 'new_contact_message';
    v_title := 'Шинэ холбоо барих хүсэлт';
    v_body := 'Сайтын холбоо барих формоор шинэ зурвас ирлээ.';
    v_entity := 'contact_message';
    v_entity_id := new.id;
  else
    return new;
  end if;

  insert into public.admin_notifications (admin_id, event_type, title, body, entity_type, entity_id)
  select a.user_id, v_type, v_title, v_body, v_entity, v_entity_id
    from public.admin_users as a;
  return new;
end;
$$;
revoke all on function public.create_admin_event_notification() from public, anon, authenticated;

-- Restrict direct session writes to mutable milestone fields; project relationship
-- and timestamps remain server-owned, even outside the Next.js UI.
revoke insert, update on public.project_milestones from authenticated;
grant insert (project_id, title, description, due_on, sort_order) on public.project_milestones to authenticated;
grant update (title, description, due_on, completed_at, sort_order) on public.project_milestones to authenticated;

revoke insert on public.website_projects from authenticated;
grant insert (order_id) on public.website_projects to authenticated;

create index if not exists admin_audit_action_created_idx on public.admin_audit_log (action, created_at desc);
create index if not exists admin_notifications_event_created_idx on public.admin_notifications (admin_id, event_type, created_at desc);

-- The old public SELECT policy also matched authenticated non-admins while
-- that role had full-column SELECT. Keep drafts private to verified admins.
drop policy if exists "site_content: anyone reads row" on public.site_content;
drop policy if exists "site_content: public published row" on public.site_content;
drop policy if exists "site_content: admin reads draft" on public.site_content;
create policy "site_content: public published row" on public.site_content
  for select to anon using (true);
create policy "site_content: admin reads draft" on public.site_content
  for select to authenticated using (public.is_admin());

-- Server endpoints may append audit events, never rewrite history.
revoke update, delete, truncate on public.admin_audit_log from service_role;

-- Search joined client/order fields without truncating the matching order IDs.
-- Invoker security preserves RLS on BOTH underlying private tables.
create or replace view public.admin_project_overview with (security_invoker = true) as
select p.id, p.order_id, p.status, p.progress_percent, p.target_completion_date,
       p.updated_at, p.description, o.reference, o.business_name, o.full_name,
       o.status as order_status
from public.website_projects p join public.website_orders o on o.id = p.order_id;
revoke all on public.admin_project_overview from anon;
grant select on public.admin_project_overview to authenticated;

commit;
