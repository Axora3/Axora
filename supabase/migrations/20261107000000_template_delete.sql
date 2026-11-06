-- Lets a signed-in admin delete a product, through the existing RLS policy.
-- Safe to re-run. Adds no tables or columns and changes no existing rows.
--
-- What protects data here:
--   * "templates: admin all" still limits this to public.is_admin().
--   * A published product must be unpublished first (guard below).
--   * A product with template_requests cannot be deleted: that foreign key is
--     already ON DELETE RESTRICT, so purchase history is never lost.

grant delete on public.templates to authenticated;

create or replace function public.guard_template_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'published' then
    raise exception using errcode = 'P0001', message = 'template_published';
  end if;
  return old;
end;
$$;

drop trigger if exists templates_guard_delete on public.templates;
create trigger templates_guard_delete before delete on public.templates
  for each row execute function public.guard_template_delete();

-- audit_row_change() reads NEW, which does not exist on delete, so this has its own function.
create or replace function public.audit_template_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'deleted', 'template', old.id::text, jsonb_build_object('title', old.title));
  return old;
end;
$$;

drop trigger if exists templates_audit_delete on public.templates;
create trigger templates_audit_delete after delete on public.templates
  for each row execute function public.audit_template_delete();
