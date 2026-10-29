-- AXORA — admin panel
-- Additive only: no existing column or row is dropped or rewritten.
--
-- Access model
--   * Admin = a row in public.admin_users (managed by the service role only;
--     never from user metadata or the browser).
--   * Admin pages talk to the database with the admin's OWN session (anon key
--     + JWT), so every read/write is also checked by RLS via public.is_admin().
--   * Audit rows are written only by SECURITY DEFINER triggers / a
--     service-role-only function. Nobody can update or delete them.

-- ---------------------------------------------------------------------------
-- Admin membership
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
grant all on public.admin_users to service_role;
-- A signed-in user may see only whether THEY are an admin.
create policy "admin_users: read own membership" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Extra order fields managed by the admin (customer answers stay untouched)
-- ---------------------------------------------------------------------------
alter table public.website_orders
  add column if not exists agreed_deadline date,
  add column if not exists next_contact_on date;

-- ---------------------------------------------------------------------------
-- Internal notes for orders and template requests (never public)
-- ---------------------------------------------------------------------------
create table public.admin_notes (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('order', 'template_request')),
  entity_id   uuid not null,
  body        text not null check (char_length(body) between 1 and 4000),
  author_id   uuid not null default auth.uid() references auth.users (id),
  created_at  timestamptz not null default now()
);
create index admin_notes_entity_idx on public.admin_notes (entity_type, entity_id, created_at desc);
alter table public.admin_notes enable row level security;

-- ---------------------------------------------------------------------------
-- Site content: fixed-field CMS with a draft and a published copy
-- ---------------------------------------------------------------------------
create table public.site_content (
  key           text primary key check (key in ('site')),
  draft         jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  published     jsonb check (published is null or jsonb_typeof(published) = 'object'),
  published_at  timestamptz,
  updated_at    timestamptz not null default now()
);
insert into public.site_content (key) values ('site') on conflict do nothing;
create trigger site_content_updated_at before update on public.site_content
  for each row execute function public.set_updated_at();
alter table public.site_content enable row level security;

-- ---------------------------------------------------------------------------
-- Audit log (append-only)
-- ---------------------------------------------------------------------------
create table public.admin_audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  -- small, non-sensitive summary only (e.g. old/new status, title)
  details     jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at  timestamptz not null default now()
);
create index admin_audit_entity_idx on public.admin_audit_log (entity_type, entity_id, created_at desc);
create index admin_audit_created_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entity text := tg_argv[0];
  v_details jsonb := '{}'::jsonb;
  v_action text;
begin
  -- Changes made by the public submission endpoints are not admin actions.
  if auth.uid() is null then
    return new;
  end if;

  if v_entity = 'order' then
    if new.status is distinct from old.status then
      v_action := 'status_changed';
      v_details := jsonb_build_object('from', old.status, 'to', new.status, 'reference', new.reference);
    elsif new.agreed_deadline is distinct from old.agreed_deadline or new.next_contact_on is distinct from old.next_contact_on then
      v_action := 'dates_changed';
      v_details := jsonb_build_object('reference', new.reference, 'agreed_deadline', new.agreed_deadline, 'next_contact_on', new.next_contact_on);
    else
      return new;
    end if;
  elsif v_entity = 'template_request' then
    if new.status is distinct from old.status then
      v_action := 'status_changed';
      v_details := jsonb_build_object('from', old.status, 'to', new.status);
    else
      return new;
    end if;
  elsif v_entity = 'template' then
    if tg_op = 'INSERT' then
      v_action := 'created';
      v_details := jsonb_build_object('title', new.title, 'status', new.status);
    elsif new.status is distinct from old.status then
      v_action := case when new.status = 'published' then 'published' else 'unpublished' end;
      v_details := jsonb_build_object('title', new.title);
    else
      v_action := 'updated';
      v_details := jsonb_build_object('title', new.title);
    end if;
  elsif v_entity = 'site_content' then
    if new.published is distinct from old.published then
      v_action := 'published';
    else
      v_action := 'draft_saved';
    end if;
  elsif v_entity = 'note' then
    v_action := 'note_added';
    v_details := jsonb_build_object('on', new.entity_type);
    insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), v_action, new.entity_type, new.entity_id::text, v_details);
    return new;
  end if;

  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), v_action, v_entity, coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'key'), v_details);
  return new;
end;
$$;

create trigger website_orders_audit after update on public.website_orders
  for each row execute function public.audit_row_change('order');
create trigger template_requests_audit after update on public.template_requests
  for each row execute function public.audit_row_change('template_request');
create trigger templates_audit after insert or update on public.templates
  for each row execute function public.audit_row_change('template');
create trigger site_content_audit after update on public.site_content
  for each row execute function public.audit_row_change('site_content');
create trigger admin_notes_audit after insert on public.admin_notes
  for each row execute function public.audit_row_change('note');

-- For server-side actions that have no row change (e.g. a download link was
-- created). Callable only by the service role, after the server has verified
-- the admin; the actor is passed explicitly by that trusted code.
create or replace function public.log_admin_action(p_actor uuid, p_action text, p_entity text, p_entity_id text, p_details jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  values (p_actor, p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;
revoke all on function public.log_admin_action(uuid, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.log_admin_action(uuid, text, text, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Admin RLS policies + grants (authenticated role; RLS restricts to admins)
-- ---------------------------------------------------------------------------
grant select, insert, update on public.templates to authenticated;
create policy "templates: admin all" on public.templates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.template_files to authenticated;
create policy "template_files: admin all" on public.template_files
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, update on public.website_orders to authenticated;
create policy "website_orders: admin read" on public.website_orders
  for select to authenticated using (public.is_admin());
create policy "website_orders: admin update" on public.website_orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
-- Admins may change status / admin fields only, never the customer's answers.
revoke update on public.website_orders from authenticated;
grant update (status, agreed_deadline, next_contact_on) on public.website_orders to authenticated;

grant select on public.order_attachments to authenticated;
create policy "order_attachments: admin read" on public.order_attachments
  for select to authenticated using (public.is_admin());

grant select, update on public.template_requests to authenticated;
revoke update on public.template_requests from authenticated;
grant update (status) on public.template_requests to authenticated;
create policy "template_requests: admin read" on public.template_requests
  for select to authenticated using (public.is_admin());
create policy "template_requests: admin update" on public.template_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.contact_messages to authenticated;
create policy "contact_messages: admin read" on public.contact_messages
  for select to authenticated using (public.is_admin());

grant select, insert on public.admin_notes to authenticated;
grant all on public.admin_notes to service_role;
create policy "admin_notes: admin read" on public.admin_notes
  for select to authenticated using (public.is_admin());
create policy "admin_notes: admin insert as self" on public.admin_notes
  for insert to authenticated with check (public.is_admin() and author_id = auth.uid());

grant select on public.admin_audit_log to authenticated;
grant all on public.admin_audit_log to service_role;
create policy "audit: admin read" on public.admin_audit_log
  for select to authenticated using (public.is_admin());

-- Public may read ONLY the published copy (column grant hides the draft).
grant select (key, published, published_at) on public.site_content to anon, authenticated;
grant select, update on public.site_content to authenticated;
revoke update on public.site_content from authenticated;
grant update (draft, published, published_at) on public.site_content to authenticated;
grant all on public.site_content to service_role;
create policy "site_content: anyone reads row" on public.site_content
  for select to anon, authenticated using (true);
create policy "site_content: admin update" on public.site_content
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage policies for admins
-- ---------------------------------------------------------------------------
create policy "admin reads order attachments" on storage.objects
  for select to authenticated using (bucket_id = 'order-attachments' and public.is_admin());

create policy "admin manages template previews (read)" on storage.objects
  for select to authenticated using (bucket_id = 'template-previews' and public.is_admin());
create policy "admin manages template previews (insert)" on storage.objects
  for insert to authenticated with check (bucket_id = 'template-previews' and public.is_admin());
create policy "admin manages template previews (update)" on storage.objects
  for update to authenticated using (bucket_id = 'template-previews' and public.is_admin());
create policy "admin manages template previews (delete)" on storage.objects
  for delete to authenticated using (bucket_id = 'template-previews' and public.is_admin());

create policy "admin manages template files (read)" on storage.objects
  for select to authenticated using (bucket_id = 'template-files' and public.is_admin());
create policy "admin manages template files (insert)" on storage.objects
  for insert to authenticated with check (bucket_id = 'template-files' and public.is_admin());
create policy "admin manages template files (update)" on storage.objects
  for update to authenticated using (bucket_id = 'template-files' and public.is_admin());
create policy "admin manages template files (delete)" on storage.objects
  for delete to authenticated using (bucket_id = 'template-files' and public.is_admin());
