-- Additive admin modules: website projects, support workflow, notifications.
-- Apply only after the three migrations documented in README.md.
-- Existing website orders and contact messages are preserved; no historical
-- order is converted into a project automatically.

begin;

-- One project is explicitly created from one existing website order. Customer
-- data remains on website_orders and is joined at read time.
create table if not exists public.website_projects (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null unique references public.website_orders (id) on delete restrict,
  status                   text not null default 'planning'
                             check (status in ('planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled')),
  description              text not null default '' check (char_length(description) <= 5000),
  start_date               date,
  target_completion_date   date,
  progress_percent         smallint not null default 0 check (progress_percent between 0 and 100),
  created_by               uuid references auth.users (id) on delete set null default auth.uid(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint website_projects_dates_order check (start_date is null or target_completion_date is null or target_completion_date >= start_date)
);
create index if not exists website_projects_status_created_idx on public.website_projects (status, created_at desc);
drop trigger if exists website_projects_updated_at on public.website_projects;
create trigger website_projects_updated_at before update on public.website_projects
  for each row execute function public.set_updated_at();
alter table public.website_projects enable row level security;

create table if not exists public.project_milestones (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.website_projects (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 160),
  description  text not null default '' check (char_length(description) <= 1200),
  due_on       date,
  completed_at timestamptz,
  sort_order   integer not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists project_milestones_project_order_idx on public.project_milestones (project_id, sort_order, created_at);
drop trigger if exists project_milestones_updated_at on public.project_milestones;
create trigger project_milestones_updated_at before update on public.project_milestones
  for each row execute function public.set_updated_at();
alter table public.project_milestones enable row level security;

-- Reuse the existing private notes table for project and contact-message notes.
alter table public.admin_notes drop constraint if exists admin_notes_entity_type_check;
alter table public.admin_notes add constraint admin_notes_entity_type_check
  check (entity_type in ('order', 'template_request', 'website_project', 'contact_message'));

-- Contact messages already have new / answered / closed states. Permit admins
-- to update only that status; message content and sender fields remain read-only.
revoke update on public.contact_messages from authenticated;
grant update (status) on public.contact_messages to authenticated;
drop policy if exists "contact_messages: admin update status" on public.contact_messages;
create policy "contact_messages: admin update status" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Project records and milestones are available only to verified admins.
grant select, insert on public.website_projects to authenticated;
grant update (status, description, start_date, target_completion_date, progress_percent) on public.website_projects to authenticated;
drop policy if exists "website_projects: admin read" on public.website_projects;
create policy "website_projects: admin read" on public.website_projects
  for select to authenticated using (public.is_admin());
drop policy if exists "website_projects: admin insert" on public.website_projects;
create policy "website_projects: admin insert" on public.website_projects
  for insert to authenticated with check (public.is_admin() and created_by = auth.uid());
drop policy if exists "website_projects: admin update" on public.website_projects;
create policy "website_projects: admin update" on public.website_projects
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.project_milestones to authenticated;
drop policy if exists "project_milestones: admin all" on public.project_milestones;
create policy "project_milestones: admin all" on public.project_milestones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Append-only admin notifications, scoped to the individual admin account.
create table if not exists public.admin_notifications (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid not null references public.admin_users (user_id) on delete cascade,
  event_type    text not null check (event_type in ('new_order', 'new_template_request', 'payment_review', 'new_contact_message')),
  title         text not null check (char_length(title) between 1 and 160),
  body          text not null default '' check (char_length(body) <= 500),
  entity_type   text not null check (entity_type in ('website_order', 'template_request', 'contact_message')),
  entity_id     uuid not null,
  created_at    timestamptz not null default now(),
  read_at       timestamptz
);
create index if not exists admin_notifications_user_created_idx on public.admin_notifications (admin_id, created_at desc);
create index if not exists admin_notifications_user_unread_idx on public.admin_notifications (admin_id, created_at desc) where read_at is null;
alter table public.admin_notifications enable row level security;
revoke all on public.admin_notifications from anon, authenticated;
grant select on public.admin_notifications to authenticated;
grant update (read_at) on public.admin_notifications to authenticated;
drop policy if exists "admin_notifications: read own" on public.admin_notifications;
create policy "admin_notifications: read own" on public.admin_notifications
  for select to authenticated using (public.is_admin() and admin_id = auth.uid());
drop policy if exists "admin_notifications: update own" on public.admin_notifications;
create policy "admin_notifications: update own" on public.admin_notifications
  for update to authenticated using (public.is_admin() and admin_id = auth.uid())
  with check (public.is_admin() and admin_id = auth.uid());

-- Notifications are created from actual database events. They contain no
-- customer contact values or message bodies.
create or replace function public.create_admin_event_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text;
  v_title text;
  v_body text;
  v_entity text;
  v_entity_id uuid;
begin
  if tg_table_name = 'website_orders' and tg_op = 'INSERT' then
    v_type := 'new_order';
    v_title := 'Шинэ веб захиалга';
    v_body := 'Лавлагаа ' || new.reference || ' — дэлгэрэнгүйг шалгана уу.';
    v_entity := 'website_order';
    v_entity_id := new.id;
  elsif tg_table_name = 'template_requests' and tg_op = 'INSERT' then
    v_type := 'new_template_request';
    v_title := 'Шинэ загварын хүсэлт';
    v_body := 'Шинэ “Авах хүсэлт” ирлээ.';
    v_entity := 'template_request';
    v_entity_id := new.id;
  elsif tg_table_name = 'template_requests' and tg_op = 'UPDATE'
        and new.payment_status is distinct from old.payment_status
        and new.payment_status in ('pending', 'needs_review') then
    v_type := 'payment_review';
    v_title := 'Төлбөр шалгах шаардлагатай';
    v_body := 'Template хүсэлтийн төлбөрийн төлөв өөрчлөгдлөө.';
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
drop trigger if exists website_orders_admin_notification on public.website_orders;
create trigger website_orders_admin_notification after insert on public.website_orders
  for each row execute function public.create_admin_event_notification();
drop trigger if exists template_requests_admin_notification on public.template_requests;
create trigger template_requests_admin_notification after insert or update of payment_status on public.template_requests
  for each row execute function public.create_admin_event_notification();
drop trigger if exists contact_messages_admin_notification on public.contact_messages;
create trigger contact_messages_admin_notification after insert on public.contact_messages
  for each row execute function public.create_admin_event_notification();

-- Record admin-side support, project, and milestone changes without copying
-- customer messages or descriptions into the audit log.
create or replace function public.audit_admin_module_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entity text;
  v_entity_id text;
  v_action text;
  v_details jsonb := '{}'::jsonb;
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_table_name = 'website_projects' then
    v_entity := 'website_project';
    v_entity_id := coalesce(new.id, old.id)::text;
    if tg_op = 'INSERT' then
      v_action := 'project_created';
      v_details := jsonb_build_object('status', new.status, 'progress', new.progress_percent, 'order_id', new.order_id);
    elsif new.status is distinct from old.status then
      v_action := 'project_status_changed';
      v_details := jsonb_build_object('from', old.status, 'to', new.status, 'progress', new.progress_percent);
    elsif new.progress_percent is distinct from old.progress_percent
       or new.description is distinct from old.description
       or new.start_date is distinct from old.start_date
       or new.target_completion_date is distinct from old.target_completion_date then
      v_action := 'project_updated';
      v_details := jsonb_build_object('progress_from', old.progress_percent, 'progress_to', new.progress_percent);
    else
      return new;
    end if;
  elsif tg_table_name = 'project_milestones' then
    v_entity := 'website_project';
    if tg_op = 'INSERT' then
      v_entity_id := new.project_id::text;
      v_action := 'milestone_added';
      v_details := jsonb_build_object('title', new.title, 'due_on', new.due_on);
    elsif tg_op = 'DELETE' then
      v_entity_id := old.project_id::text;
      v_action := 'milestone_removed';
      v_details := jsonb_build_object('title', old.title);
    else
      v_entity_id := new.project_id::text;
      v_action := 'milestone_updated';
      v_details := jsonb_build_object('title', new.title, 'completed', new.completed_at is not null, 'due_on', new.due_on);
    end if;
  elsif tg_table_name = 'contact_messages' and tg_op = 'UPDATE' and new.status is distinct from old.status then
    v_entity := 'contact_message';
    v_entity_id := new.id::text;
    v_action := 'support_status_changed';
    v_details := jsonb_build_object('from', old.status, 'to', new.status);
  else
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), v_action, v_entity, v_entity_id, v_details);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.audit_admin_module_change() from public, anon, authenticated;
drop trigger if exists website_projects_admin_audit on public.website_projects;
create trigger website_projects_admin_audit after insert or update on public.website_projects
  for each row execute function public.audit_admin_module_change();
drop trigger if exists project_milestones_admin_audit on public.project_milestones;
create trigger project_milestones_admin_audit after insert or update or delete on public.project_milestones
  for each row execute function public.audit_admin_module_change();
drop trigger if exists contact_messages_admin_audit on public.contact_messages;
create trigger contact_messages_admin_audit after update of status on public.contact_messages
  for each row execute function public.audit_admin_module_change();

commit;
