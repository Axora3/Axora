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

---

## 8. Админ самбар (`/admin`)

Захиалга, загвар, загварын хүсэлт, сайтын агуулгыг Supabase Dashboard нээхгүйгээр удирдана.

### Админ тохируулах (нэг удаа)

1. `supabase/migrations/20261028100000_admin_panel.sql`-ийг SQL Editor дээр ажиллуулна (эсвэл `npx supabase db push`). Энэ нь зөвхөн нэмэлт хүснэгт, багана, policy нэмнэ — хуучин өгөгдөл өөрчлөгдөхгүй.
2. **Нийтийн бүртгэлийг хаана:** Dashboard → Authentication → Sign In / Providers → “Allow new users to sign up”-ийг унтраана.
3. Dashboard → Authentication → Users → **Add user** — имэйл, хүчтэй нууц үгээр хэрэглэгч үүсгэнэ.
4. Админ эрх олгоно (service role key таны компьютер дээр л ашиглагдана):
   ```bash
   node --env-file=.env.local scripts/grant-admin.mjs owner@example.com
   ```
   Эрх хасах: `... grant-admin.mjs owner@example.com --revoke`
5. `/admin/login` дээр нэвтэрнэ.

Орчны хувьсагч шинээр нэмэгдээгүй (`.env.example` хэвээр).

### Эрх хэрхэн шалгагддаг вэ

- **Нэвтэрсэн ≠ админ.** Админ эсэхийг зөвхөн `public.admin_users` хүснэгт (service role л бичнэ) тодорхойлно — user metadata, localStorage-д итгэхгүй.
- Хуудас бүр, Server Action бүр серверт дахин шалгана (`requireAdminPage` / `requireAdminAction`); proxy зөвхөн session шинэчилнэ.
- Админ хуудас өгөгдлийн сантай админы **өөрийн session**-оор холбогдоно, тиймээс RLS (`public.is_admin()`) болон column grant давхар хамгаална. Админ хэрэглэгчийн анкетын хариултыг өөрчилж чадахгүй — зөвхөн төлөв, тохиролцсон хугацаа, дараагийн холбоо барих огноо.
- Private хавсралт, загварын файл: Storage policy зөвхөн админд, 2 минут (хавсралт) / 24 цаг–7 хоног (загварын файл) хугацаатай signed URL. SVG/PDF admin хуудсанд inline render хийгдэхгүй.
- **Audit log** (`admin_audit_log`)-ийг DB trigger бичнэ; засах/устгах эрх хэнд ч байхгүй. Signed URL, хувийн мэдээлэл хадгалагдахгүй.
- Хоёр цонхноос зэрэг засвал `updated_at` шалгалт дарж бичихээс сэргийлж, “Хуудсыг шинэчлэх” санал болгоно.

### Хэсгүүд

| Хуудас | Юу хийх |
| --- | --- |
| Хяналтын самбар | Хугацааны шүүлтүүртэй 4 үзүүлэлт (DB-д тоологдоно), сүүлийн захиалга, анхаарах зүйл, төлвийн тойм, сүүлийн үйлдэл. Орлогын үзүүлэлт байхгүй (төлбөрийн бүртгэл алга). |
| Веб захиалгууд | Хайлт, төлөв/төрөл/огноо шүүлт, server-side pagination; дэлгэрэнгүйд Тойм/Анкет/Дизайн (builder preview-г snapshot-оос сэргээнэ)/Хавсралт/Тэмдэглэл ба түүх. |
| Загварууд | Нэмэх, засах, зураг upload (progress), дараалал, cover, хамгаалагдсан файл/холбоос, “Ноорог хадгалах” ба “Нийтлэх” (бүрэн шалгалттай), “Нийтлэлээс буулгах”. Hard delete байхгүй. |
| Загварын хүсэлтүүд | Төлөв: Шинэ → Холбогдсон → Хүргэж дууссан (гараар) / Цуцлагдсан. Хугацаатай татах холбоос үүсгэж **өөрөө** илгээнэ — автоматаар юу ч илгээгдэхгүй, төлбөр тэмдэглэгдэхгүй. |
| Сайтын агуулга | Hero, CTA (зөвшөөрөгдсөн холбоос), холбоо барих, сошиал, FAQ, footer. Ноорог → Preview → Нийтлэх. Зөвхөн энгийн текст. |
| Үйлдлийн түүх | Audit log, зөвхөн унших. |
| Тохиргоо | Бүртгэл, холболтын төлөв, гарах. |

> Supabase тохируулаагүй үед админ самбар туршилтын өгөгдөл харуулахгүй — “Supabase холбогдоогүй” гэж тодорхой мэдэгдэнэ.
