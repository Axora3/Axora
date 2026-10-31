# AXORA админ самбар — хэрэгжилт ба шалгалт

Огноо: 2026-10-31. Эхлэх үед working tree-д админ модулиудын өөрчлөлт, дөрөв дэх migration болон нийтийн сайтын өөрчлөлтүүд байсан. Тэдгээрийг хадгалсан; энэ тайлан өмнөх ажлыг шинээр хийсэн гэж тооцохгүй. Commit, push, production өгөгдөл өөрчлөх үйлдэл хийгээгүй.

## Эхний аудитын матриц

| Модуль | Route | Эхний төлөв | Илэрсэн цоорхой / хийх ажил |
|---|---|---|---|
| Самбар | /admin | Partially implemented | Бодит count, хугацааны шүүлт, төлвийн тархалт байсан; хугацааны график, сүүлийн мэдэгдэл дутуу |
| Веб захиалга | /admin/orders, /admin/orders/[id] | Partially implemented | Хайлт, шүүлт, анкет, builder, файл, тэмдэглэл, CAS update байсан; буруу календарийн огноо зөвшөөрдөг |
| Template хүсэлт | /admin/template-requests, /admin/template-requests/[id] | Partially implemented | Manual payment болон delivery guards, холбоос, түүх байсан; бодит DB workflow шалгах шаардлагатай |
| Бүтээгдэхүүн | /admin/templates, /new, /[id]/edit | Partially implemented | Upload, publish guards, draft, CRUD байсан; хадгалаагүй өөрчлөлттэй дотоод navigation хамгаалалт дутуу |
| Веб төсөл | /admin/projects, /admin/projects/[id] | Partially implemented; Requires backend integration | Өмнөх untracked implementation; milestone completion timestamp дахин бичигддэг, delete concurrency дутуу |
| Төлбөр | /admin/payments | Partially implemented | Template төлбөрийн бүртгэл байсан; цуцалсан хүсэлт болон огнооны шүүлт дутуу |
| Тусламж | /admin/support, /admin/support/[id] | Partially implemented; Requires backend integration | Contact messages, төлөв, тэмдэглэл, түүх байсан; DB migration шалгах шаардлагатай |
| Маркетинг | /admin/marketing | Partially implemented | Hero болон нийтэлсэн бүтээгдэхүүн, CMS холбоос байсан; агуулгагүй fallback, library хүрэх холбоос дутуу |
| Мэдэгдэл | /admin/notifications | Partially implemented; Requires backend integration | Бодит event storage, read/unread байсан; хайлт, event filter, count error дутуу |
| Сайтын агуулга | /admin/content, /admin/library | Partially implemented | Draft/preview/publish байсан; дотоод navigation үед unsaved warning дутуу |
| Үйлдлийн түүх | /admin/activity | Partially implemented | Read-only list, pagination байсан; хайлт, action/date filter, дэлгэрэнгүй дутуу |
| Тохиргоо | /admin/settings | Partially implemented | Account/config байсан; DB read probe, theme control дутуу |
| Нэвтрэлт | /admin/login | Partially implemented | Supabase getUser + admin_users/RLS; logout failure-г үл тоодог |
| Navigation | shared AdminShell / nav.ts | Partially implemented | Бүх route, sidebar, mobile drawer байсан; badge error болон mobile QA шаардлагатай |

## Хамгаалалт

- Хуудас, server action бүр серверийн admin membership шалгалт ашиглана. Энгийн нэвтэрсэн хэрэглэгч админ болохгүй.
- Захиалгын 39 асуултын answers болон builder snapshot-ыг админ mutation өөрчлөхгүй.
- Төлбөрийг зөвхөн гараар баталгаажуулна. Signed URL үүсгэх/хуулах нь хүргэлт биш.
- Audit log засах, устгах UI байхгүй. Дэлгэрэнгүйд зөвшөөрсөн metadata түлхүүрүүдийг л харуулна.
- Хуучин захиалгуудаас төсөл автоматаар үүсгэхгүй.

## Design references

Claude artifact болон өгсөн 12 HTML холбоос web tool-оор нээгдээгүй. Хараагүй холбоосыг үзсэн гэж тооцоогүй. design-references/design-1 болон design-2 доторх локал зураг, одоо байгаа shared design system ашиглана. Эдгээр прототипт байгаа QPay, campaign analytics болон зохиомол тоонуудыг бодит integration гэж нэвтрүүлэхгүй.

## Шалгалт

Эхний npx tsc --noEmit, npm run lint, npm run build: PASS. Доорх нэмэлт шалгалтын үр дүн нь энэ удаагийн үргэлжлүүлсэн ажлыг тусад нь тэмдэглэнэ.

## 2026-10-31 — үргэлжлүүлсэн хэрэгжилт

Энэ удаа эхлэхэд дээрх 14 хэсэг, таван migration, regression тестүүд болон хоёр screenshot аль хэдийн uncommitted байсан. Тэдгээрийг шинээр хийсэн гэж тооцоогүй, бусад public-site өөрчлөлтийг буцаагаагүй. Доорх “өмнөх” төлөв нь энэ удаагийн эхлэл юм.

### Модуль бүрийн эцсийн матриц

UI “код бэлэн” гэдэг нь authenticated browser workflow бүрэн шалгасан гэсэн үг биш. DB тест нь тусгаарласан PostgreSQL/PGlite дээр ажилласан; Supabase Auth, Storage үйлчилгээний E2E-г орлохгүй.

| Модуль / route | Өмнөх төлөв | Энэ удаагийн өөрчлөлт / хадгалсан ажиллагаа | UI | Backend | Шалгалт ба үлдсэн blocker |
|---|---|---|---|---|---|
| Самбар `/admin` | Хэсэгчлэн хэрэгжсэн | Сүүлийн мэдэгдлийг гарчгаар хайх бус яг тухайн мэдэгдлийн дэлгэрэнгүй рүү холбоно. Бодит count, хугацааны график хэвээр. | Код бэлэн | Supabase query холбоотой | Typecheck; бодит тооны UI шалгалт test admin session шаардана |
| Веб захиалга `/admin/orders`, `/admin/orders/[id]` | Хэсэгчлэн; failure feedback дутуу | Төлөв, тэмдэглэл, attachment үйлдлийн transport алдааг харуулна. Conflict refresh формыг шинэ server version-оор дахин үүсгэнэ. Attachment popup-ыг шууд хэрэглэгч дарах signed-link болгон өөрчилсөн. | Код бэлэн | 39 хариултыг өөрчлөхгүй; existing action/RLS | Анкетын 39 талбар, DB column grant PASS; бодит upload/download E2E үлдсэн |
| Template хүсэлт `/admin/template-requests`, `/[id]` | Хэсэгчлэн; audit failure үед link амжилт буцаадаг | Status/payment/link action transport error feedback. Link history амжилтгүй бол URL буцаахгүй. Conflict refresh зассан. | Код бэлэн | Шинэ migration төлбөр/цуцлалтыг lock дотор дахин шалгана | Payment/delivery тусгаарлалт, unpaid record rejection PASS; migration remote дээр ажиллуулаагүй |
| Бүтээгдэхүүн `/admin/templates`, `/new`, `/[id]/edit` | Хэсэгчлэн | Save, publish switch, slug check, upload ticket дээр network failure-г төлөв алдалгүй харуулна. Existing publish validation/private files хэвээр. | Код бэлэн | Existing action/RLS/storage | Paid-file validation PASS; storage upload/publish E2E үлдсэн |
| Веб төсөл `/admin/projects`, `/[id]` | Хэсэгчлэн; backend migration шаардлагатай | Conflict refresh-ийн stale form зассан. Existing order-linked create, dates/progress, milestones, notes/history хэвээр. | Код бэлэн | Existing additive tables/view | Explicit creation, unique order, progress/date constraints, milestone audit PASS; remote schema/session шалгалт үлдсэн |
| Төлбөр `/admin/payments` | Хэсэгчлэн | Бодит template payment records, count, filter, manual confirmation detail холбоос хадгалсан. Request payment action-ын transport feedback зассан. | Код бэлэн | Existing manual RPC | DB confirmation idempotency PASS. Website-payment ledger, банкны арга/reference одоогийн schema-д байхгүй; зохиомол утга нэмээгүй |
| Тусламж `/admin/support`, `/[id]` | Хэсэгчлэн | Conflict refresh төлвийн шинэ version-ийг авна. Existing contact message/status/notes/history хэвээр. | Код бэлэн | Contact messages ашиглана | Message immutable/status editable DB PASS; priority model, messaging integration байхгүй |
| Маркетинг `/admin/marketing` | Хэсэгчлэн; CMS-backed | Existing hero/CTA, нийтэлсэн products, CMS/library editing холбоосыг хадгалсан. | Код бэлэн | Site content/templates | Static/type checks; campaign scheduler/analytics байхгүй, campaign performance зохиогоогүй |
| Мэдэгдэл `/admin/notifications`, `/[id]` | Detail route дутуу | Admin-scoped detail route, read/unread control, related-record link, list/dashboard deep links; safe type/UUID route helper нэмсэн. | Шинэ detail код бэлэн | Own-admin query + existing RLS/actions | Routing regression, per-admin notification isolation PASS; бодит browser detail/read workflow үлдсэн |
| Сайтын агуулга `/admin/content`, `/admin/library` | Хэсэгчлэн | Existing draft/preview/publish, validation, unsaved changes warning, content tag invalidation хадгалсан. | Код бэлэн | Existing CMS action/RLS | Draft privacy DB PASS; public publish E2E Supabase холболтоос хамаарна |
| Үйлдлийн түүх `/admin/activity` | Хэсэгчлэн | Existing read-only filters/pagination/details хэвээр; link-record audit амжилтыг server action шалгана. | Код бэлэн | Append-only log | Admin/service role delete/update хориг DB PASS; бодит UI filter тест үлдсэн |
| Тохиргоо `/admin/settings` | Хэсэгчлэн | Existing account, DB read probe, theme, logout хэвээр. Нууц утга харагдуулахгүй. | Код бэлэн | Supported configuration only | Typecheck; session/logout authenticated E2E үлдсэн |
| Нэвтрэлт `/admin/login` | Хэрэгжсэн, E2E дутуу | Existing Supabase Auth ба admin membership хамгаалалтыг хадгалсан. | Login browser дээр харагдсан | getUser/is_admin серверийн шалгалт | Anonymous `/admin` → login redirect PASS; test account login хүлээгдэж байна |
| Navigation shared shell | Mobile drawer overflow байсан | Нарийн drawer header wrap хийж horizontal scrollbar арилгасан; бүх secondary route хүрэх боломж хадгалсан. | Shell browser PASS | Бодит badge query хэвээр | 360/390/430/768/1024/1440px page overflow=0; 390px drawer clientWidth=scrollWidth=285; Escape focus return PASS |

### Энэ удаа нэмсэн / зассан файлууд

Шинэ:

- `src/app/admin/(panel)/notifications/[id]/page.tsx` — `NotificationDetail`, protected detail route.
- `src/lib/admin/notifications.ts` — зөвшөөрөгдсөн entity route mapping.
- `scripts/check-admin-schema.mjs` — table/column availability-г HEAD request-аар шалгах read-only команд.
- `supabase/migrations/20261031200000_delivery_record_guard.sql` — lock ба payment/cancellation recheck; audit/status нэг transaction.
- `admin-verification/mobile-drawer-fixed.png` — 390px drawer screenshot; dev preview гэдэг нь screenshot дээрээ тодорхой.

Зассан:

- `src/app/admin/actions.ts` — audit RPC-ийн error/status-г шалгахаас өмнө download URL буцаахгүй.
- `src/app/admin/(panel)/notifications/page.tsx`, `src/components/admin/DashboardInsights.tsx` — detail холбоос.
- `src/app/admin/(panel)/projects/[id]/page.tsx`, `support/[id]/page.tsx` — form version keys. Захиалга/request form нь шинэ server version-ийг хүлээн авч, өөрийн save feedback-г хадгална.
- `src/components/admin/forms.tsx`, `OrderStatusControl.tsx`, `RequestControls.tsx`, `ProductControls.tsx`, `TemplateEditor.tsx` — transport failure feedback; attachment download холбоос.
- `src/components/admin/AdminShell.tsx` — drawer header wrapping.
- `scripts/test-admin.mjs`, `scripts/test-admin-db.mjs` — notification route safety ба unpaid delivery-record rejection regression.
- `README.md`, энэ тайлан — migration, verification мэдээлэл.

### Команд ба нотолгоо

- Эхний `npx tsc --noEmit`, `npm run lint`, `npm run build`: PASS.
- `node --test scripts/test-admin.mjs`: **9/9 PASS**.
- `node scripts/test-admin-db.mjs <TEMP>/axora-admin-sql-check/node_modules/@electric-sql/pglite`: **16/16 PASS**, зургаан migration тусгаарласан DB-д амжилттай ажилласан.
- Transport wrapper нэмсний дараах typecheck `errors`/`reasons` union narrowing дээр алдаа илрүүлсэн; `in` guard-аар зассан. Дараагийн build-ийн TypeScript шат PASS.
- Restricted `npm run build`: `/blog` prerender үед Supabase fetch **EACCES** network denial-аар FAIL. Network access-тай дахин ажиллуулсан `npm run build`: **PASS**, бүх 50 route generation амжилттай. Энэ нь Supabase эвдэрсэн эсвэл schema дутуу гэсэн алдаа байгаагүй.
- `npm run dev -- --port 3011`: existing Next dev lock-аас шалтгаалан шинэ server эхлээгүй. `localhost:3000` дээрх existing server-ийг ашигласан, зогсоогоогүй.
- `node --env-file=.env.local scripts/check-admin-schema.mjs`: network access-тай **10/10 PASS**. Table/column availability баталгаажсан; session RLS ба RPC version-ийг энэ probe батлахгүй. Service key болон private record утгуудыг output-д гаргаагүй; remote migration, write хийгээгүй.
- Browser: anonymous redirect, dev shell responsive widths, mobile navigation, Escape focus return шалгасан. Protected module бүрийн populated screenshot, CRUD/publish/upload E2E-г одоогоор **баталгаажуулаагүй**.

### Тохиргоо ба migration

Шинэ env шаардлагагүй. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (эсвэл ANON_KEY), зөвхөн серверийн `SUPABASE_SERVICE_ROLE_KEY`, canonical `NEXT_PUBLIC_SITE_URL` одоогийн README-ийн дагуу байна. Нууц утгыг тайлан, client bundle-д оруулаагүй.

Remote DB дээр өмнө ажилласан migration-уудыг давтаж бүтнээр нь ажиллуулахгүй. Хийгдээгүй файлуудыг огнооны дарааллаар ажиллуулна: үндсэн schema → admin panel → payments/delivery → admin modules → workflow hardening → **20261031200000_delivery_record_guard.sql**. Сүүлчийн migration нь өгөгдөл устгахгүй, хуучин захиалгаас төсөл үүсгэхгүй, хуучин audit-г дахин бичихгүй. Энэ удаа зөвхөн тусгаарласан test DB-д ажиллуулсан.

### Дизайны үлдсэн хязгаарлалт

Primary Claude artifact болон өгсөн 12 HTML холбоос энэ удаагийн web tool-оор мөн нээгдээгүй. Локал `design-references/inspection/sheet-01.png` дээрх admin design-ийг үзэж, shared dark-green/lime shell-тай харьцуулсан. Бүх protected screen-ийг зураг бүртэй pixel-level харьцуулсан гэж тооцоогүй. Dev preview тоо нь зөвхөн ил тод тэмдэглэсэн fixture; production admin metric болгон ашиглаагүй.

Бүх модулийг production-ready гэж батлаагүй: test admin session, шинэ delivery migration-ийг remote дээр ажиллуулах, бодит Auth/Storage workflow шалгалт үлдсэн. Commit, push, deploy хийгээгүй.

Эцсийн `npx tsc --noEmit`, `npm run lint`, `git diff --check`: PASS (Git line-ending notice нь алдаа биш).
