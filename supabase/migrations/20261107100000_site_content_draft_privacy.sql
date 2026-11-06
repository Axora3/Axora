-- Keeps unpublished site copy private from anonymous visitors. Safe to re-run.
--
-- The earlier column grant only narrows access when no table-level grant exists.
-- Supabase's default privileges give anon SELECT on new tables, so on a real project
-- anon could still read `draft`. Removing the table grant makes the column grant count.
revoke select on public.site_content from anon;
grant select (key, published, published_at) on public.site_content to anon;
