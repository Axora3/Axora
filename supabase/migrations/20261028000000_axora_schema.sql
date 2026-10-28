-- AXORA — initial schema
-- Tables, constraints, indexes, updated_at triggers, RLS, grants,
-- storage buckets and server-only helper functions.
--
-- Access model
--   * anon / authenticated (browser, publishable key): may only SELECT
--     published rows from public.templates. Nothing else.
--   * service_role (Next.js route handlers only): inserts orders, requests,
--     attachments after server-side validation. Bypasses RLS by design, so
--     every endpoint that uses it validates input and authorises the action.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- templates — public catalogue (no private file data in this table)
-- ---------------------------------------------------------------------------
create table public.templates (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title             text not null check (char_length(title) between 1 and 200),
  short_description text not null default '' check (char_length(short_description) <= 400),
  long_description  text not null default '' check (char_length(long_description) <= 5000),
  category          text not null check (category in ('Notion', 'Canva', 'Excel')),
  price             numeric(12, 2) not null default 0 check (price >= 0),
  currency          text not null default 'MNT' check (currency ~ '^[A-Z]{3}$'),
  is_free           boolean not null default false,
  -- [{ "path": "<object path in template-previews>", "alt": "..." }]
  preview_images    jsonb not null default '[]'::jsonb check (jsonb_typeof(preview_images) = 'array'),
  -- colours/labels for the drawn preview when no images exist yet
  preview_style     jsonb not null default '{}'::jsonb check (jsonb_typeof(preview_style) = 'object'),
  for_whom          text not null default '',
  included          text[] not null default '{}',
  how_to            text[] not null default '{}',
  requirements      text not null default '',
  format            text not null default '',
  status            text not null default 'draft' check (status in ('draft', 'published')),
  is_demo           boolean not null default false,
  sort_order        integer not null default 100,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- price and "free" can never disagree
  constraint templates_price_matches_free
    check ((is_free and price = 0) or (not is_free and price > 0))
);

create index templates_published_order_idx on public.templates (sort_order, created_at desc) where status = 'published';
create index templates_published_category_idx on public.templates (category) where status = 'published';

create trigger templates_updated_at before update on public.templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- template_files — PRIVATE delivery data for paid/free products.
-- Never readable by anon/authenticated. Hand out via signed URL only after
-- a request has been approved manually.
-- ---------------------------------------------------------------------------
create table public.template_files (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.templates (id) on delete cascade,
  label        text not null default '',
  storage_path text,          -- object path in the private "template-files" bucket
  external_url text,          -- e.g. a Notion/Canva share link
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint template_files_has_target check (storage_path is not null or external_url is not null)
);

create index template_files_template_idx on public.template_files (template_id);

create trigger template_files_updated_at before update on public.template_files
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- website_orders — 39-question order form + live-builder settings
-- ---------------------------------------------------------------------------
create table public.website_orders (
  id                      uuid primary key default gen_random_uuid(),
  reference               text not null unique
                            default ('AX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  -- idempotency: one key → one order; a different payload with the same key is a conflict
  idempotency_key         uuid not null unique,
  payload_hash            text not null check (payload_hash ~ '^[0-9a-f]{64}$'),

  -- searchable/filterable columns
  full_name               text not null check (char_length(full_name) between 1 and 120),
  email                   text not null check (char_length(email) <= 200 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'),
  phone                   text not null check (char_length(phone) between 8 and 40),
  business_name           text not null check (char_length(business_name) between 1 and 160),
  website_type            text,
  design_style            text,
  preferred_channel       text not null check (preferred_channel in ('phone', 'messenger', 'instagram', 'email')),
  timeline                text,
  budget                  text,

  -- the full answer set (all 39 questions), validated on the server
  answers                 jsonb not null
                            check (jsonb_typeof(answers) = 'object' and answers ? 'schema_version'),
  answers_schema_version  integer not null default 1 check (answers_schema_version >= 1),

  -- live-builder snapshot (null when the visitor did not use the builder)
  builder_type            text check (builder_type in ('cafe', 'beauty', 'shop', 'portfolio')),
  builder_style           text check (builder_style in ('minimal', 'modern', 'luxury', 'colorful', 'dark', 'designer')),
  builder_palette         text check (builder_palette in ('forest', 'ocean', 'terracotta', 'lavender', 'midnight', 'mono', 'custom')),
  builder_primary         text check (builder_primary ~ '^#[0-9A-F]{6}$'),
  builder_secondary       text check (builder_secondary ~ '^#[0-9A-F]{6}$'),
  builder_bg              text check (builder_bg ~ '^#[0-9A-F]{6}$'),
  builder_name            text check (char_length(builder_name) <= 40),
  builder_headline        text check (char_length(builder_headline) <= 70),
  builder_description     text check (char_length(builder_description) <= 160),
  builder_cta             text check (char_length(builder_cta) <= 24),
  builder_config          jsonb check (builder_config is null or (jsonb_typeof(builder_config) = 'object' and builder_config ? 'schema_version')),

  -- consent to PROCESS the data (not to publish it); time is set by the server
  consent_processing      boolean not null check (consent_processing = true),
  consent_text_version    text not null,
  consent_at              timestamptz not null default now(),

  status                  text not null default 'new'
                            check (status in ('new', 'contacted', 'in_progress', 'completed', 'cancelled')),

  -- short-lived, hashed grant that lets the submitting browser upload/retry
  -- attachments for THIS order only. It grants no read access to the order.
  upload_grant_hash       text check (upload_grant_hash ~ '^[0-9a-f]{64}$'),
  upload_grant_expires_at timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index website_orders_status_created_idx on public.website_orders (status, created_at desc);
create index website_orders_email_idx on public.website_orders (lower(email));
create index website_orders_created_idx on public.website_orders (created_at desc);

create trigger website_orders_updated_at before update on public.website_orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- order_attachments — files linked to one order
-- ---------------------------------------------------------------------------
create table public.order_attachments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.website_orders (id) on delete cascade,
  field         text not null check (field in ('q22', 'q27')),
  client_ref    text not null check (char_length(client_ref) between 1 and 64),
  -- random key: <order_id>/<attachment_id>.<ext>; the original name is never a path
  storage_path  text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type     text not null check (mime_type in ('image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf')),
  size_bytes    bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  upload_status text not null default 'pending'
                  check (upload_status in ('pending', 'uploaded', 'failed', 'rejected', 'expired')),
  uploaded_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (order_id, client_ref)
);

create index order_attachments_order_idx on public.order_attachments (order_id);
create index order_attachments_pending_idx on public.order_attachments (created_at) where upload_status in ('pending', 'failed');

create trigger order_attachments_updated_at before update on public.order_attachments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- template_requests — "Авах хүсэлт гаргах"
-- A request never grants download rights; files are delivered manually.
-- ---------------------------------------------------------------------------
create table public.template_requests (
  id              uuid primary key default gen_random_uuid(),
  template_id     uuid not null references public.templates (id) on delete restrict,
  idempotency_key uuid not null unique,
  payload_hash    text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  customer_name   text not null check (char_length(customer_name) between 1 and 120),
  contact_channel text not null check (contact_channel in ('phone', 'email', 'messenger')),
  contact_value   text not null check (char_length(contact_value) between 3 and 200),
  note            text check (char_length(note) <= 2000),
  status          text not null default 'new' check (status in ('new', 'contacted', 'fulfilled', 'cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index template_requests_template_idx on public.template_requests (template_id);
create index template_requests_status_created_idx on public.template_requests (status, created_at desc);

create trigger template_requests_updated_at before update on public.template_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- contact_messages — the short form on /contact
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id              uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null unique,
  payload_hash    text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  name            text not null check (char_length(name) between 1 and 120),
  contact         text not null check (char_length(contact) between 3 and 200),
  message         text not null check (char_length(message) between 1 and 3000),
  status          text not null default 'new' check (status in ('new', 'answered', 'closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index contact_messages_status_created_idx on public.contact_messages (status, created_at desc);

create trigger contact_messages_updated_at before update on public.contact_messages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- rate_limits — fixed-window counters shared by every server instance
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  bucket_key   text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket_key, window_start)
);

create or replace function public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits   integer;
begin
  insert into public.rate_limits as r (bucket_key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (bucket_key, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;
  return v_hits <= p_max;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_website_order — one transaction for the order row + attachment rows
-- Returns {status: created|duplicate|conflict, ...}.
-- ---------------------------------------------------------------------------
create or replace function public.create_website_order(
  p_order        jsonb,
  p_attachments  jsonb,
  p_grant_hash   text,
  p_grant_expires timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key      uuid := (p_order ->> 'idempotency_key')::uuid;
  v_hash     text := p_order ->> 'payload_hash';
  v_existing public.website_orders%rowtype;
  v_order    public.website_orders%rowtype;
  v_att      jsonb;
  v_att_id   uuid;
  v_ext      text;
begin
  select * into v_existing from public.website_orders where idempotency_key = v_key;
  if found then
    if v_existing.payload_hash <> v_hash then
      return jsonb_build_object('status', 'conflict');
    end if;
    update public.website_orders
       set upload_grant_hash = p_grant_hash, upload_grant_expires_at = p_grant_expires
     where id = v_existing.id;
    return jsonb_build_object(
      'status', 'duplicate',
      'order_id', v_existing.id,
      'reference', v_existing.reference,
      'attachments', coalesce((
        select jsonb_agg(jsonb_build_object('id', a.id, 'client_ref', a.client_ref, 'storage_path', a.storage_path, 'upload_status', a.upload_status))
          from public.order_attachments a where a.order_id = v_existing.id), '[]'::jsonb)
    );
  end if;

  insert into public.website_orders (
    idempotency_key, payload_hash, full_name, email, phone, business_name,
    website_type, design_style, preferred_channel, timeline, budget,
    answers, answers_schema_version,
    builder_type, builder_style, builder_palette, builder_primary, builder_secondary, builder_bg,
    builder_name, builder_headline, builder_description, builder_cta, builder_config,
    consent_processing, consent_text_version, consent_at,
    status, upload_grant_hash, upload_grant_expires_at
  ) values (
    v_key, v_hash, p_order ->> 'full_name', p_order ->> 'email', p_order ->> 'phone', p_order ->> 'business_name',
    p_order ->> 'website_type', p_order ->> 'design_style', p_order ->> 'preferred_channel', p_order ->> 'timeline', p_order ->> 'budget',
    p_order -> 'answers', coalesce((p_order ->> 'answers_schema_version')::int, 1),
    p_order ->> 'builder_type', p_order ->> 'builder_style', p_order ->> 'builder_palette',
    p_order ->> 'builder_primary', p_order ->> 'builder_secondary', p_order ->> 'builder_bg',
    p_order ->> 'builder_name', p_order ->> 'builder_headline', p_order ->> 'builder_description', p_order ->> 'builder_cta',
    case when jsonb_typeof(p_order -> 'builder_config') = 'object' then p_order -> 'builder_config' else null end,
    true, p_order ->> 'consent_text_version', now(),
    'new', p_grant_hash, p_grant_expires
  )
  returning * into v_order;

  for v_att in select * from jsonb_array_elements(coalesce(p_attachments, '[]'::jsonb)) loop
    v_att_id := gen_random_uuid();
    v_ext := v_att ->> 'ext';
    if v_ext !~ '^(jpg|jpeg|png|svg|pdf)$' then
      raise exception 'invalid attachment extension';
    end if;
    insert into public.order_attachments (id, order_id, field, client_ref, storage_path, original_name, mime_type, size_bytes)
    values (
      v_att_id, v_order.id, v_att ->> 'field', v_att ->> 'client_ref',
      v_order.id::text || '/' || v_att_id::text || '.' || v_ext,
      v_att ->> 'original_name', v_att ->> 'mime_type', (v_att ->> 'size_bytes')::bigint
    );
  end loop;

  return jsonb_build_object(
    'status', 'created',
    'order_id', v_order.id,
    'reference', v_order.reference,
    'attachments', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'client_ref', a.client_ref, 'storage_path', a.storage_path, 'upload_status', a.upload_status))
        from public.order_attachments a where a.order_id = v_order.id), '[]'::jsonb)
  );
exception
  when unique_violation then
    -- a concurrent request with the same key won the race
    select * into v_existing from public.website_orders where idempotency_key = v_key;
    if found and v_existing.payload_hash = v_hash then
      return jsonb_build_object('status', 'duplicate', 'order_id', v_existing.id, 'reference', v_existing.reference,
        'attachments', coalesce((
          select jsonb_agg(jsonb_build_object('id', a.id, 'client_ref', a.client_ref, 'storage_path', a.storage_path, 'upload_status', a.upload_status))
            from public.order_attachments a where a.order_id = v_existing.id), '[]'::jsonb));
    end if;
    return jsonb_build_object('status', 'conflict');
end;
$$;

-- ---------------------------------------------------------------------------
-- Cleanup: marks attachments that never finished uploading as expired and
-- returns their storage paths so the cleanup script can delete the objects.
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_attachments(p_older_than interval default interval '24 hours')
returns table (storage_path text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return query
    update public.order_attachments a
       set upload_status = 'expired'
     where a.upload_status in ('pending', 'failed')
       and a.created_at < now() - p_older_than
    returning a.storage_path;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security & grants
-- ---------------------------------------------------------------------------
alter table public.templates         enable row level security;
alter table public.template_files    enable row level security;
alter table public.website_orders    enable row level security;
alter table public.order_attachments enable row level security;
alter table public.template_requests enable row level security;
alter table public.contact_messages  enable row level security;
alter table public.rate_limits       enable row level security;

-- Start from nothing, then grant only what the public needs.
revoke all on public.templates, public.template_files, public.website_orders, public.order_attachments,
  public.template_requests, public.contact_messages, public.rate_limits
  from anon, authenticated;

grant select on public.templates to anon, authenticated;

-- Visitors see published templates only; drafts are invisible.
create policy "templates: public reads published"
  on public.templates for select
  to anon, authenticated
  using (status = 'published');

-- No policies on the other tables: with RLS on and no grants, anon and
-- authenticated can neither read nor write them. service_role bypasses RLS.

grant all on public.templates, public.template_files, public.website_orders, public.order_attachments,
  public.template_requests, public.contact_messages, public.rate_limits
  to service_role;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.create_website_order(jsonb, jsonb, text, timestamptz) from public, anon, authenticated;
revoke all on function public.expire_stale_attachments(interval) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
grant execute on function public.create_website_order(jsonb, jsonb, text, timestamptz) to service_role;
grant execute on function public.expire_stale_attachments(interval) to service_role;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('template-previews', 'template-previews', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('order-attachments', 'order-attachments', false, 10485760, array['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf']),
  ('template-files', 'template-files', false, 209715200, null)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
-- * template-previews is a public bucket: files are served from the public
--   object URL, which needs no policy. We deliberately add NO select policy,
--   so the bucket cannot be listed through the API.
-- * order-attachments and template-files are private and get NO policies for
--   anon/authenticated: no read, list, insert, update or delete. Uploads go
--   through server-issued signed upload URLs (one object path, no overwrite);
--   downloads happen only through short-lived signed URLs created by the
--   service role from the Supabase Dashboard or an admin script.
