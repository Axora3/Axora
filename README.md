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
2. **Project Settings → API Keys** хэсгээс утгуудыг `.env.local` руу хуулна:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key (`NEXT_PUBLIC_SUPABASE_ANON_KEY` хуучин нэрийг мөн дэмжинэ) (browser-т ил байж болно, RLS хязгаарлана)
   - `SUPABASE_SERVICE_ROLE_KEY` — серверийн secret/service_role key. **Зөвхөн сервер.** `NEXT_PUBLIC_` угтвар хэзээ ч бүү хий, чат/issue-д бүү хуул. Hosting (Vercel гэх мэт) дээр Environment Variables-д нэмнэ.
3. `supabase/migrations/` доторх SQL migration-уудыг **дарааллаар нь нэг нэгээр** ажиллуулна:
   1. `20261028000000_axora_schema.sql` — үндсэн хүснэгтүүд, RLS, Storage bucket.
   2. `20261028100000_admin_panel.sql` — админ самбар, сайтын агуулга, audit log.
   3. `20261029000000_payments_delivery_guards.sql` — төлбөрийн төлөв, хүргэлтийн хамгаалалт.

   SQL Editor ашиглахдаа файлын бүх SQL-ийг тус тусад нь шинэ query болгон ажиллуулж, дараагийн файлыг эхлүүлэхээс өмнө амжилттай дууссаныг шалгана. Өмнө нь ажиллуулсан эхний migration-ийг дахин бүтнээр нь ажиллуулж болохгүй — `relation already exists` алдаа гарна. Dashboard SQL Editor-ийн өөрчлөлт migration history-д автоматаар бүртгэгдэхгүй; цаашдын schema өөрчлөлтийг migration файлтайгаа хамт бүртгэж явна.
4. Demo seed (заавал биш): `supabase/seed.sql`-ийг SQL Editor дээр ажиллуулна. 6 published + 1 draft загвар орно (`is_demo = true`, сайт дээр “Үзүүлэн” гэж харагдана).
5. Dev server-ээ дахин асаана.

> **PGRST205 / schema cache:** хүснэгтүүд DB-д байгаа мөртлөө Data API `Could not find the table ... in the schema cache` гэвэл SQL Editor дээр `NOTIFY pgrst, 'reload schema';` ажиллуулаад дахин шалгана. Алга байгаа хүснэгтийг энэ тушаал үүсгэхгүй — шаардлагатай migration-ийг эхэлж ажиллуулна.

### Bucket-ууд

Migration автоматаар үүсгэнэ (Dashboard → Storage дээр шалгаж болно):

| Bucket | Төрөл | Хэрэглээ |
| --- | --- | --- |
| `template-previews` | **public** | Загварын preview зураг (PNG/JPG/WEBP, 5MB) |
| `order-attachments` | **private** | Захиалгын лого, брэнд материал, зураг (JPG/PNG/SVG/PDF, 10MB) |
| `template-files` | **private** | Төлбөртэй загварын файл |

Private bucket-д anon/authenticated-д ямар ч policy байхгүй — уншиж, жагсааж, бичиж чадахгүй.

## 3. Бүтээгдэхүүн, зураг, текст өөрчлөх

- **Загвар нэмэх/засах:** `/admin/templates` самбар ашиглана. `status = 'published'` болгож нийтэлнэ, `draft` бол сайтад харагдахгүй. Үнэгүй бол `is_free = true, price = 0`; төлбөртэй бол `is_free = false, price > 0` (constraint зөрчлийг хориглоно). Бодит бүтээгдэхүүнд `is_demo = false`.
- **Preview зураг:** `template-previews` bucket-д upload хийгээд `preview_images` баганад `[{"path":"kofe/1.jpg","alt":"Постын жишээ"}]` гэж бичнэ. Зураггүй бол `preview_style`-ийн өнгөөр зурсан mock-up харагдана.
- **Төлбөртэй файл:** `/admin/templates` дээр бүтээгдэхүүн засахдаа `template-files` bucket-д файлаа оруулж, хадгална. Энэ bucket нийтэд хаалттай. Хүсэлт ирэхэд админ самбар төлбөрийг гараар баталгаажуулсны дараа хугацаатай signed URL үүсгэнэ; холбоосыг админ хэрэглэгч өөрөө захиалагч руу илгээнэ.
- **Hero, CTA, холбоо барих мэдээлэл, сошиал, FAQ, footer:** `/admin/content` дээр засаж Preview хийгээд нийтэлнэ. Анхны fallback утгууд (`src/lib/site.ts`) дотор холбоо барих placeholder бий — нийтлэхээсээ өмнө бодит мэдээллээр солино.
- **Анкетын асуултууд:** `src/lib/order/questions.ts` (browser болон сервер хоёулаа энэ файлаас шалгадаг).
- **Builder-ийн төрөл, palette, style:** `src/lib/builder/config.ts`.
- **Design tokens (өнгө, фонт):** `src/app/globals.css`.

## 4. Захиалга удирдах

Захиалга болон хүсэлтүүдийг `/admin` самбараас удирдана. Админ самбарын хэрэглэгч, эрх, тохиргоог **8-р хэсэг**-ээс үзнэ. Supabase Dashboard → Table Editor нь зөвхөн DB-ийн шууд шалгалт, онцгой засварт ашиглагдана.

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
  app/                  route-ууд (/, /templates, /templates/[slug], /services, /builder, /order, /contact, /privacy)
    sitemap.ts, robots.ts, icon.svg, opengraph-image.tsx  SEO болон share metadata
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

1. **2-р хэсгийн** Supabase тохируулах алхмаар гурван migration-ийг дарааллаар ажиллуулсан эсэхээ шалгана. Эдгээр нь additive өөрчлөлт; хуучин өгөгдлийг устгахгүй. Хуучин хүсэлтэд одоогийн үнийг нөхөж бичихгүй, төлбөрийг шалгах төлөвтэй үлдээнэ.
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
| Бүтээгдэхүүн | Publish switch (client + server + DB guard шалгалт, алдааны шалтгаан + “Засах”), slug давхардлын серверийн шалгалт, upload progress/retry/preview, хуучин файлыг DB шинэчлэгдсэний дараа цэвэрлэнэ. Нэмэх, засах, зураг upload (progress), дараалал, cover, хамгаалагдсан файл/холбоос, “Ноорог хадгалах” ба “Нийтлэх” (бүрэн шалгалттай), “Нийтлэлээс буулгах”. Hard delete байхгүй. |
| Template хүсэлтүүд | Хүсэлтийн төлөв (Шинэ → Холбогдсон → Хүргэж дууссан / Цуцлагдсан), **төлбөрийн төлөв**, **хүргэлтийн төлөв** тусдаа. “Төлбөр баталгаажсан” = админ гараар баталгаажуулсан (банк/gateway шалгаагүй), хэн/хэзээ/хэдээр бүртгэгдэнэ. Хугацаатай холбоосыг зөвхөн үнэгүй эсвэл төлбөр баталгаажсан үед сервер (`authorize_delivery_link`) зөвшөөрнө; холбоос үүсгэх/хуулах нь “илгээсэн” биш. Автоматаар юу ч илгээгдэхгүй. |
| Сайтын агуулга | Hero, CTA (зөвшөөрөгдсөн холбоос), холбоо барих, сошиал, FAQ, footer. Ноорог → Preview → Нийтлэх. Зөвхөн энгийн текст. |
| Үйлдлийн түүх | Audit log, зөвхөн унших. |
| Тохиргоо | Бүртгэл, холболтын төлөв, гарах. |

> Supabase тохируулаагүй үед админ самбар туршилтын өгөгдөл харуулахгүй — “Supabase холбогдоогүй” гэж тодорхой мэдэгдэнэ.

### Mobile admin (390px reference, 360–430px+)

- Нэвтэрсний дараа <1024px дээр доод цэс: **Самбар · Захиалга · Хүсэлт · Бүтээгдэхүүн** (`src/components/admin/nav.ts` — desktop sidebar-тай нэг config). Badge: `website_orders.status = new` ба `template_requests.status = new`-ийн бодит тоо (жагсаалтын filter-ээс хамаарахгүй, 0 үед нуугдана). Input дээр focus ороход (keyboard) цэс нуугдана. Бусад хэсэг (агуулга, түүх, тохиргоо, гарах) толгойн цэсний товчоор.
- Богино үйлдлүүд `BottomSheet`-ээр (`src/components/ui/BottomSheet.tsx`): гарчиг + хаах товч, focus trap, Escape/backdrop, scroll lock, `visualViewport`-оор keyboard-оос дээш, safe area, focus буцаах, хадгалаагүй өөрчлөлттэй бол асууна. ≥768px дээр ижил компонент dialog болно.
- “Хариу өгөөгүй удсан” босго: `src/lib/admin/config.ts` → `REQUEST_OVERDUE_HOURS` (24). Зөвхөн анхны холбоо тогтоогоогүй шинэ хүсэлтэд. Дотоод сануулга — хэрэглэгчид амласан хугацаа биш.
- “Өнөөдөр”, огнооны шүүлтүүр Asia/Ulaanbaatar (UTC+8) өдрөөр.

## 9. Light / dark mode

- Сонголт: **Цайвар / Бараан / Систем** (header-ийн нар/сар товч → жижиг menu). `localStorage["axora-theme"]`-д хадгалагдана (account шаардахгүй), public сайт ба admin нэг сонголттой. Систем үед OS-ийн өөрчлөлтийг дагана; тодорхой сонголтыг OS дарж өөрчлөхгүй.
- Анхны будалтаас өмнө `<head>` дахь inline script `<html data-theme>`-ийг тохируулна → анивчих, hydration mismatch байхгүй (`src/components/theme/`).
- Өнгө зөвхөн semantic token-оор (`src/app/globals.css`): `bg`, `surface`, `elevated`, `ink`(text), `muted`, `line`(border), `primary` / `on-primary` (товчны дэвсгэр ба текст тусдаа), `lime`(accent) / `on-lime`, `focus`, `success`, `warn`, `danger`, `band` (бараан ногоон хэсэг). Dark: page #0F1512, card #18211C, text #E9EEE7, brand #9BD3AE.
- **Preview тусгаарлалт:** `.ax-light` class нь theme boundary — бүх token-ыг light утгаар дахин тодорхойлно. Template thumbnail, hero composition, product mockup, builder demo, захиалгын palette/snapshot түүн дотор байдаг тул AXORA-ийн dark mode тэдгээрийг recolor хийхгүй. Builder-ийн “Dark” style нь demo-гийн өөрийн state (`demo.css`).
- Development-д л ажиллах UI шалгах хуудас: `/dev/admin-preview` (production-д 404, хадгалах үйлдэл эрхгүй тул серверт татгалзагдана).

## 10. Бодит ба demo горим

- **Supabase холбогдсон** (`NEXT_PUBLIC_SUPABASE_URL` + publishable key, migration-ууд ажилласан): бүх тоо, жагсаалт DB-ээс; өөрчлөлт сервер баталсны дараа л амжилт гэж харуулна; card, detail, badge, самбар `revalidatePath`-аар шинэчлэгдэнэ. Алдаа гарвал өмнөх утга хэвээр, “Дахин” товч.
- **Холболтгүй:** public сайт “Үзүүлэн” тэмдэгтэй demo загвар харуулна; admin “Supabase холбогдоогүй” гэж мэдэгдэнэ, хадгалсан/нийтэлсэн/төлбөр баталсан мэт юу ч харуулахгүй.
- **Холбогдсон боловч migration ажиллаагүй:** алдааг demo өгөгдлөөр далдлахгүй — “ачаалж чадсангүй” гэж харуулна. Production build (`next build`) prerender үед DB-ээс уншдаг тул хүснэгтгүй төсөлтэй build амжилтгүй болно — эхлээд migration-уудаа ажиллуулна.

## 11. Нийтийн хуудас ба нийтлэхийн өмнөх тохиргоо

- `/privacy` — анкет, холбоо барих болон template хүсэлтээр цуглуулах мэдээллийн зорилго, Supabase-д хадгалах байршил, төхөөрөмжийн ноорог болон устгуулах хүсэлтийн талаар тайлбарлана. Хадгалалтын хугацаа одоогоор тогтоогдоогүй; бодлогоо шийдмэгц энэ хуудсыг шинэчилнэ.
- Холбоо барих хуудсанд утас (`tel:`), имэйл (`mailto:`), HTTPS Messenger холбоос зөв утгатай үед товшигдоно. Placeholder утга холбоос болохгүй.
- `src/app/sitemap.ts` нь нийтийн үндсэн хуудас болон нийтэлсэн template-уудыг sitemap-д оруулна. `src/app/robots.ts` admin болон API замыг crawl-аас хязгаарлаж sitemap-ийг заана. `src/app/icon.svg` browser icon, `src/app/opengraph-image.tsx` share preview үүсгэнэ.
- Production deploy хийхдээ `.env.local` биш hosting-ийн Environment Variables хэсэгт `NEXT_PUBLIC_SITE_URL`-ийг сайтын canonical HTTPS домэйнээр тохируулна. Тохируулахгүй бол metadata болон sitemap `http://localhost:3000` хаягтай болно.
- Нийтлэхээс өмнө холбоо барих placeholder-уудыг бодит утгаар солих, `/admin/content` дээр мэдээллээ нийтлэх, бүтээгдэхүүнүүдээ оруулах, Supabase backend болон админ нэвтрэлтийг шалгах.
