# AXORA

Notion, Canva, Excel бэлэн загварын дэлгүүр + захиалгат веб хөгжүүлэлт + live website builder + 39 асуулттай захиалгын анкет.

**Технологи:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Supabase Postgres + Storage · zod

---

## 1. Суулгах, ажиллуулах

```bash
npm install
cp .env.example .env.local     # дараа нь утгуудыг бөглөнө (доор)
npm run dev                    # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Шалгалт:

```bash
npx tsc --noEmit   # typecheck
npm run lint       # eslint
```

> `.env.local` байхгүй үед сайт **туршилтын горимд** ажиллана: загварууд demo өгөгдлөөс харагдаж, анкет/хүсэлт “Туршилтын горим — мэдээлэл илгээгдэхгүй” гэж тэмдэглэгдэнэ, илгээх үед JSON татаж авна. Бодит хадгалсан мэт амжилт харуулахгүй.

## 2. Supabase тохируулах

1. [supabase.com](https://supabase.com) дээр шинэ project үүсгэнэ.
2. **Project Settings → API** хэсгээс утгуудыг `.env.local` руу хуулна:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon / publishable key (browser-т ил байж болно, RLS хязгаарлана)
   - `SUPABASE_SERVICE_ROLE_KEY` — service_role key. **Зөвхөн сервер.** `NEXT_PUBLIC_` угтвар хэзээ ч бүү хий, чат/issue-д бүү хуул. Hosting (Vercel гэх мэт) дээр Environment Variables-д нэмнэ.
3. Migration ажиллуулна (аль нэг аргаар):
   - **SQL Editor:** `supabase/migrations/20261028000000_axora_schema.sql` файлын агуулгыг хуулж Run.
   - **Supabase CLI:**
     ```bash
     npx supabase link --project-ref <project-ref>
     npx supabase db push
     ```
4. Demo seed (заавал биш): `supabase/seed.sql`-ийг SQL Editor дээр ажиллуулна. 6 published + 1 draft загвар орно (`is_demo = true`, сайт дээр “Үзүүлэн” гэж харагдана).
5. Dev server-ээ дахин асаана.

### Bucket-ууд

Migration автоматаар үүсгэнэ (Dashboard → Storage дээр шалгаж болно):

| Bucket | Төрөл | Хэрэглээ |
| --- | --- | --- |
| `template-previews` | **public** | Загварын preview зураг (PNG/JPG/WEBP, 5MB) |
| `order-attachments` | **private** | Захиалгын лого, брэнд материал, зураг (JPG/PNG/SVG/PDF, 10MB) |
| `template-files` | **private** | Төлбөртэй загварын файл |

Private bucket-д anon/authenticated-д ямар ч policy байхгүй — уншиж, жагсааж, бичиж чадахгүй.

## 3. Бүтээгдэхүүн, зураг, текст өөрчлөх

- **Загвар нэмэх/засах:** Dashboard → Table Editor → `templates`. `status = 'published'` болгож нийтэлнэ, `draft` бол сайтад харагдахгүй. Үнэгүй бол `is_free = true, price = 0`; төлбөртэй бол `is_free = false, price > 0` (constraint зөрчлийг хориглоно). Бодит бүтээгдэхүүнд `is_demo = false`.
- **Preview зураг:** `template-previews` bucket-д upload хийгээд `preview_images` баганад `[{"path":"kofe/1.jpg","alt":"Постын жишээ"}]` гэж бичнэ. Зураггүй бол `preview_style`-ийн өнгөөр зурсан mock-up харагдана.
- **Төлбөртэй файл:** `template-files` bucket-д upload хийж, `template_files` хүснэгтэд `storage_path` (эсвэл `external_url`) бичнэ. Энэ хүснэгт нийтэд хаалттай. Хүсэлт ирэхэд Dashboard-оос хугацаатай signed URL үүсгэж илгээнэ — хүсэлт илгээсэн гэдгээр автоматаар татах эрх олгогддоггүй.
- **Холбоо барих мэдээлэл, FAQ, амжилтын текст:** `src/lib/site.ts`.
- **Анкетын асуултууд:** `src/lib/order/questions.ts` (browser болон сервер хоёулаа энэ файлаас шалгадаг).
- **Builder-ийн төрөл, palette, style:** `src/lib/builder/config.ts`.
- **Design tokens (өнгө, фонт):** `src/app/globals.css`.

## 4. Захиалга удирдах

Эхний хувилбарт admin dashboard байхгүй. Supabase Dashboard → Table Editor:

- `website_orders` — анкет. `status`: new → contacted → in_progress → completed / cancelled. Бүх 39 хариулт `answers` (JSONB, `schema_version`-той), builder тохиргоо `builder_*` багана болон `builder_config`-д.
- `order_attachments` — хавсралт. `upload_status = 'uploaded'` бол файл баталгаажсан. Файлыг Storage → `order-attachments` → `<order_id>/` дотроос “Get signed URL”-ээр нээнэ.
- `template_requests` — “Авах хүсэлт”.
- `contact_messages` — холбоо барих зурвас.

## 5. Дутуу upload цэвэрлэх

```bash
node --env-file=.env.local scripts/cleanup-uploads.mjs            # dry run — юу устгахыг харуулна
node --env-file=.env.local scripts/cleanup-uploads.mjs --apply    # 24 цагаас дээш дутуу upload + эзэнгүй object устгана
node --env-file=.env.local scripts/cleanup-uploads.mjs --apply --hours=48
```

Үүнийг өдөрт нэг удаа cron (GitHub Actions, сервер гэх мэт)-оор ажиллуулахыг зөвлөж байна.

## 6. Бүтэц

```
src/
  app/                  route-ууд (/, /templates, /templates/[slug], /services, /builder, /order, /contact)
    api/orders/         анкет хүлээн авах (POST), хавсралтын ticket/complete
    api/template-requests/, api/contact/
  components/
    builder/            BuilderProvider (нэг typed state), Builder panel, DemoPreview + scoped demo.css
    order/              7 алхамтай анкет, файл upload
    templates/          catalog, card, gallery, авах хүсэлт
    site/, home/, services/, contact/, ui/
  lib/
    builder/config.ts   төрөл, style, palette, өнгөний тооцоо
    order/              questions.ts (39 асуулт + validation), schema.ts (zod), attachments.ts
    templates/          types, service (Supabase), demo-data
    supabase/           server.ts (anon read + service role, server-only), browser.ts
    server/http.ts      body limit, rate limit, idempotency hash, spam check
supabase/
  migrations/           schema, RLS, grants, storage bucket, функцүүд
  seed.sql              demo бүтээгдэхүүн
scripts/cleanup-uploads.mjs
```

## 7. Аюулгүй байдлын шийдлүүд

- **RLS** бүх хүснэгтэд идэвхтэй. anon зөвхөн `templates`-ээс `status = 'published'` мөр уншина. Захиалга, хүсэлт, хавсралт, rate limit хүснэгт нийтэд хаалттай.
- Бүх бичилт Next.js route handler-ээр, **сервер дээр validation** хийсний дараа. Төлөв (`new`), зөвшөөрлийн огноо, үнэ, template ID-г сервер тогтооно.
- **Idempotency:** browser-ийн UUID key + payload-ийн SHA-256. DB-д `unique(idempotency_key)`. Ижил key + ижил payload → хуучин захиалгаа буцаана; өөр payload → 409 conflict. Захиалга + хавсралтын мөр нэг transaction (`create_website_order`).
- **Upload:** сервер санамсаргүй path (`<order_id>/<uuid>.<ext>`) үүсгэж, тухайн нэг path-д зориулсан signed upload URL өгнө. Upload дууссаны дараа сервер файлын эхний байтуудыг (magic bytes) шалгаж, SVG-д script байвал татгалзана. Хавсралтын эрх нь илгээх үед олгосон 24 цагийн, hash-аар хадгалсан grant-д тулгуурлана — order ID мэдэх нь хангалтгүй, захиалгын мэдээллийг уншуулахгүй.
- **Rate limit** Postgres-д (`hit_rate_limit`) — олон instance/serverless дээр зөв ажиллана. IP-г HMAC-аар hash хийнэ.
- **Spam:** honeypot талбар + хэт хурдан илгээлтийг шүүх. Body хэмжээний хязгаар (анкет 200KB).
- Хувийн мэдээллийг URL query-д хийхгүй. Ноорог: tab-ийн sessionStorage-д автоматаар; төхөөрөмж дээр удаан хадгалах (localStorage) нь зөвхөн хэрэглэгч checkbox идэвхжүүлсэн үед.
