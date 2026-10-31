# AXORA redesign progress

Updated: 2026-10-31

## Audit status

- [x] Read both supplied archives and confirm extracted contents match: 76 PNGs in `design-1` and 39 PNGs in `design-2` (115 total).
- [x] Visually inspect all 115 images using 23 labeled contact sheets; no PNG was omitted.
- [x] Identify desktop, tablet, mobile, dark-theme, interaction-state, and design-system references.
- [x] Audit existing Next.js App Router, routes, reusable UI, Supabase access, migrations, and admin flows.
- [x] Map all 115 references to an existing screen/component or explicit exception; live visual comparison remains partial.
- [x] Compare local references against current route/component behavior and implement confirmed corrections for favorites, portfolio, content rendering, and mobile lesson navigation; retain documented backend exceptions.
- [x] Check the portfolio page shell at 360, 390, 768, 1024, and 1440px; no horizontal overflow was present.
- [ ] Verify populated content cards, lesson detail, and authenticated admin interaction states; the local content source returned no published rows and no admin session was used.
- [x] Run TypeScript, lint, diff checks, and a production build; all passed.

## Reference interpretation

Design 1 is the core AXORA storefront, custom website service/order flow, template purchase/payment prototypes, builder, and admin project/order/payment/support screens. Design 2 expands the storefront into bundles, favorites, comparison, learning, blog, portfolio, website price estimate, template updates, and Phase 5/6 admin marketing and content. Both use the same cream/forest-green/lime system; dark screenshots are theme variants. Several reference files show simulated backend/payment states explicitly. Do not present them as live integrations where the current app has no corresponding backend.

## Current implementation map

| Screen group | Reference IDs | Existing route(s) / components | Current status |
|---|---:|---|---|
| Home and design system | 2, 7, 8, 47, 71 | `/`, `src/components/home/*`, `globals.css` | Existing; compare and refine desktop/mobile sections and shared tokens |
| Template catalog and filtering | 4, 40, 60, 66, 83–86 | `/templates`, `Catalog`, `TemplateCard` | Existing; favorites/compare integrated; verify screenshots and responsive states |
| Template detail, live preview and versions | 43, 58, 64, 67, 90, 96–98, 115 | `/templates/[slug]`, `Gallery`, `TemplatePreview`, detail components | Existing; compare themes, mobile layout and supported updates data |
| Favorites and comparison | 82, 84–86, 112–114 | `/favorites`, `/compare`, collection hooks/components | Implemented with browser storage; verify filters, empty state and responsive comparison |
| Bundles | 81–82, 94–95 | `/bundles`, `/bundles/[slug]` | Routes exist; check content source and purchase integration |
| Website services and estimate | 39, 63, 89, 99–100, 109–111 | `/services`, `/order` | Services and order routes exist; `/services/estimate` is absent and unapproved pricing rules are not confirmed; stale estimate CTA values normalize to `/order` |
| Website builder / live demo | 41–42, 46, 60, 64 | `/builder` | Existing interactive builder; map modal, themes and device previews to source |
| Website order and confirmation | 38, 57, 62, 68–69 | `/order`, order form and API | Seven-step, data-backed order flow exists; preserve 39 questions and actual server results |
| Checkout, QPay and purchase results | 3, 5, 23, 36–37, 55–56, 61, 73–76 | No customer checkout/payment routes | References prototype/demo payment states; live checkout/QPay backend absent, do not fake success |
| Digital delivery, purchases, invoice and notifications | 44–45, 48, 50–54, 65, 70 | No customer purchase/account/notification routes | Screen references present; authenticated delivery and notification backend absent |
| Help, blog, learning and portfolio | 17, 33, 48, 81, 87–89, 101–108 | `/blog`, `/blog/[slug]`, `/learn`, `/learn/[slug]`, `/portfolio`, `/portfolio/[slug]`; no `/help` | Public content routes exist; Help route absent; audit data source and route states |
| Admin dashboard and website projects | 1, 6, 12, 20–22, 27, 32, 35 | `/admin`, `/admin/orders`, `/admin/orders/[id]` | Core admin and website order flows exist; projects data model/management route absent |
| Admin login, requests, templates, payments and notifications | 9–11, 13–19, 24–26, 28–31, 34 | `/admin/login`, `/admin/template-requests`, `/admin/templates`, `/admin/orders` | Existing protected flows; payment gateway, project notices, and some support states require backend gap review |
| Admin marketing, content, bundles and versions | 80, 91–93 | `/admin/content`, `/admin/library`; other management routes absent | Content/library editors exist in current tree; marketing/coupon/campaign and version models require gap review |
| Admin design system | 8 | `src/app/globals.css`, `src/components/admin/*`, `src/components/ui/*` | Existing shared semantic tokens; compare full component/state coverage |

## Screenshot-by-screenshot mapping

Every reference is assigned to an existing route/component or a documented exception. Existing means the application has that route; the comparison/data state is not automatically verified.

| # | Archive | Reference image | Viewport (PNG px) | Route / component | Status |
|---:|---|---|---:|---|---|
| 1 | design-1 | [1024px — Admin самбар.png](design-references/design-1/1024px — Admin самбар.png) | 1024 × 1900 | /admin | Existing route |
| 2 | design-1 | [1024px — Нүүр.png](design-references/design-1/1024px — Нүүр.png) | 1024 × 7000 | / | Existing route |
| 3 | design-1 | [360px — Checkout.png](design-references/design-1/360px — Checkout.png) | 360 × 1400 | /checkout | Exception: no customer checkout route |
| 4 | design-1 | [360px — Загварууд.png](design-references/design-1/360px — Загварууд.png) | 360 × 1900 | /templates | Existing route |
| 5 | design-1 | [360px — Төлбөр.png](design-references/design-1/360px — Төлбөр.png) | 360 × 1300 | /payment | Exception: no live payment route/provider |
| 6 | design-1 | [430px — Admin төслүүд.png](design-references/design-1/430px — Admin төслүүд.png) | 430 × 1900 | /admin/projects | Exception: no project route/model |
| 7 | design-1 | [430px — Нүүр.png](design-references/design-1/430px — Нүүр.png) | 430 × 4400 | / | Existing route |
| 8 | design-1 | [AXORA дизайн систем.png](design-references/design-1/AXORA дизайн систем.png) | 1440 × 5360 | Shared tokens/components | Existing implementation |
| 9 | design-1 | [Admin — Template хүсэлтүүд.png](design-references/design-1/Admin — Template хүсэлтүүд.png) | 1440 × 1006 | /admin/template-requests | Existing route |
| 10 | design-1 | [Admin — Бүтээгдэхүүн удирдлага.png](design-references/design-1/Admin — Бүтээгдэхүүн удирдлага.png) | 1440 × 1100 | /admin/templates | Existing route |
| 11 | design-1 | [Admin — Веб захиалгууд.png](design-references/design-1/Admin — Веб захиалгууд.png) | 1440 × 1000 | /admin/orders | Existing route |
| 12 | design-1 | [Admin — Веб төслүүд (жагсаалт).png](design-references/design-1/Admin — Веб төслүүд (жагсаалт).png) | 1440 × 1200 | /admin/projects | Exception: no project route/model |
| 13 | design-1 | [Admin — Захиалгын дэлгэрэнгүй.png](design-references/design-1/Admin — Захиалгын дэлгэрэнгүй.png) | 1440 × 1700 | /admin/orders/[id] | Existing route |
| 14 | design-1 | [Admin — Мэдэгдлийн dropdown.png](design-references/design-1/Admin — Мэдэгдлийн dropdown.png) | 1440 × 900 | /admin | Existing route |
| 15 | design-1 | [Admin — Мэдэгдэл.png](design-references/design-1/Admin — Мэдэгдэл.png) | 1440 × 1309 | /admin (dropdown/state) | No verified notifications module |
| 16 | design-1 | [Admin — Нэвтрэх.png](design-references/design-1/Admin — Нэвтрэх.png) | 1440 × 900 | /admin/login | Existing route |
| 17 | design-1 | [Admin — Тусламжийн хүсэлтүүд (дизайн).png](design-references/design-1/Admin — Тусламжийн хүсэлтүүд (дизайн).png) | 1440 × 1200 | /admin/support | Exception: no support model/route |
| 18 | design-1 | [Admin — Төлбөр холбогдоогүй төлөв.png](design-references/design-1/Admin — Төлбөр холбогдоогүй төлөв.png) | 1440 × 900 | /admin/template-requests | Manual only; no live QPay |
| 19 | design-1 | [Admin — Төлбөрүүд (Phase 4).png](design-references/design-1/Admin — Төлбөрүүд (Phase 4).png) | 1440 × 1700 | /admin/template-requests | Manual only; no live QPay |
| 20 | design-1 | [Admin — Төслийн дэлгэрэнгүй.png](design-references/design-1/Admin — Төслийн дэлгэрэнгүй.png) | 1440 × 1100 | /admin/projects | Exception: no project model/route |
| 21 | design-1 | [Admin — Төслийн самбар.png](design-references/design-1/Admin — Төслийн самбар.png) | 1440 × 1000 | /admin/projects | Exception: no project model/route |
| 22 | design-1 | [Admin — Хяналтын самбар.png](design-references/design-1/Admin — Хяналтын самбар.png) | 1440 × 2267 | /admin | Existing route |
| 23 | design-1 | [Checkout — Захиалгын мэдээлэл.png](design-references/design-1/Checkout — Захиалгын мэдээлэл.png) | 1440 × 1200 | /checkout | Exception: no customer checkout route |
| 24 | design-1 | [Mobile admin — Template хүсэлт.png](design-references/design-1/Mobile admin — Template хүсэлт.png) | 390 × 1500 | /admin/template-requests | Existing route |
| 25 | design-1 | [Mobile admin — Бусад цэс.png](design-references/design-1/Mobile admin — Бусад цэс.png) | 390 × 844 | /admin | Existing route |
| 26 | design-1 | [Mobile admin — Бүтээгдэхүүн.png](design-references/design-1/Mobile admin — Бүтээгдэхүүн.png) | 390 × 1400 | /admin/templates | Existing route |
| 27 | design-1 | [Mobile admin — Веб төслүүд.png](design-references/design-1/Mobile admin — Веб төслүүд.png) | 390 × 1900 | /admin/projects | Exception: no project route/model |
| 28 | design-1 | [Mobile admin — Захиалгууд.png](design-references/design-1/Mobile admin — Захиалгууд.png) | 390 × 1500 | /admin/orders | Existing route |
| 29 | design-1 | [Mobile admin — Захиалгын дэлгэрэнгүй.png](design-references/design-1/Mobile admin — Захиалгын дэлгэрэнгүй.png) | 390 × 2000 | /admin/orders/[id] | Existing route |
| 30 | design-1 | [Mobile admin — Мэдэгдэл.png](design-references/design-1/Mobile admin — Мэдэгдэл.png) | 390 × 1600 | /admin (dropdown/state) | No verified notifications module |
| 31 | design-1 | [Mobile admin — Нэвтрэх.png](design-references/design-1/Mobile admin — Нэвтрэх.png) | 390 × 844 | /admin/login | Existing route |
| 32 | design-1 | [Mobile admin — Самбар.png](design-references/design-1/Mobile admin — Самбар.png) | 390 × 1500 | /admin | Existing route |
| 33 | design-1 | [Mobile admin — Тусламжийн хүсэлт.png](design-references/design-1/Mobile admin — Тусламжийн хүсэлт.png) | 390 × 1200 | /admin/support | Exception: no support model/route |
| 34 | design-1 | [Mobile admin — Төлбөр.png](design-references/design-1/Mobile admin — Төлбөр.png) | 390 × 1500 | /admin/template-requests | Manual only; no live QPay |
| 35 | design-1 | [Mobile admin — Төслийн самбар.png](design-references/design-1/Mobile admin — Төслийн самбар.png) | 390 × 1100 | /admin/projects | Exception: no project model/route |
| 36 | design-1 | [Mobile — Checkout.png](design-references/design-1/Mobile — Checkout.png) | 390 × 1400 | /checkout | Exception: no customer checkout route |
| 37 | design-1 | [Mobile — QPay төлбөр.png](design-references/design-1/Mobile — QPay төлбөр.png) | 390 × 1300 | /payment | Exception: no live payment route/provider |
| 38 | design-1 | [Mobile — Веб захиалга.png](design-references/design-1/Mobile — Веб захиалга.png) | 390 × 1500 | /order | Existing route |
| 39 | design-1 | [Mobile — Веб үйлчилгээ.png](design-references/design-1/Mobile — Веб үйлчилгээ.png) | 390 × 5600 | /services | Existing route |
| 40 | design-1 | [Mobile — Загварууд.png](design-references/design-1/Mobile — Загварууд.png) | 390 × 1900 | /templates | Existing route |
| 41 | design-1 | [Mobile — Загварчлагч (preview-first).png](design-references/design-1/Mobile — Загварчлагч (preview-first).png) | 390 × 1600 | /builder | Existing route |
| 42 | design-1 | [Mobile — Загварчлагч, тохиргооны sheet.png](design-references/design-1/Mobile — Загварчлагч, тохиргооны sheet.png) | 390 × 844 | /builder | Existing route |
| 43 | design-1 | [Mobile — Загварын дэлгэрэнгүй.png](design-references/design-1/Mobile — Загварын дэлгэрэнгүй.png) | 390 × 2300 | /templates/[slug] | Existing route |
| 44 | design-1 | [Mobile — Захиалгын явц.png](design-references/design-1/Mobile — Захиалгын явц.png) | 390 × 1500 | /orders/[id] | Exception: no customer tracking route |
| 45 | design-1 | [Mobile — Мэдэгдэл.png](design-references/design-1/Mobile — Мэдэгдэл.png) | 390 × 1500 | /notifications | Exception: no customer notification route |
| 46 | design-1 | [Mobile — Нэхэмжлэх.png](design-references/design-1/Mobile — Нэхэмжлэх.png) | 390 × 1600 | /invoice | Exception: no customer invoice route |
| 47 | design-1 | [Mobile — Нүүр.png](design-references/design-1/Mobile — Нүүр.png) | 390 × 4400 | / | Existing route |
| 48 | design-1 | [Mobile — Тусламжийн төв.png](design-references/design-1/Mobile — Тусламжийн төв.png) | 390 × 3800 | /help | Exception: no help route/content |
| 49 | design-1 | [Mobile — Холбоо барих.png](design-references/design-1/Mobile — Холбоо барих.png) | 390 × 1300 | /contact | Existing route |
| 50 | design-1 | [Mobile — Худалдан авалтууд.png](design-references/design-1/Mobile — Худалдан авалтууд.png) | 390 × 1600 | /purchases | Exception: no customer account/history |
| 51 | design-1 | [Mobile — Худалдан авах.png](design-references/design-1/Mobile — Худалдан авах.png) | 390 × 1500 | / | Existing route |
| 52 | design-1 | [Mobile — Хүргэлт.png](design-references/design-1/Mobile — Хүргэлт.png) | 390 × 2400 | /download | Exception: no customer delivery route |
| 53 | design-1 | [Mobile — Явц, олдсон.png](design-references/design-1/Mobile — Явц, олдсон.png) | 390 × 2700 | /orders/[id] | Exception: no customer tracking route |
| 54 | design-1 | [Mobile — Үр дүн.png](design-references/design-1/Mobile — Үр дүн.png) | 390 × 1100 | / | Existing route |
| 55 | design-1 | [QPay төлбөр — 9 төлөв.png](design-references/design-1/QPay төлбөр — 9 төлөв.png) | 1440 × 1289 | /payment | Exception: no live payment route/provider |
| 56 | design-1 | [Tablet 768 — Checkout.png](design-references/design-1/Tablet 768 — Checkout.png) | 768 × 1800 | /checkout | Exception: no customer checkout route |
| 57 | design-1 | [Tablet 768 — Веб захиалга.png](design-references/design-1/Tablet 768 — Веб захиалга.png) | 768 × 2000 | /order | Existing route |
| 58 | design-1 | [Tablet 768 — Дэлгэрэнгүй.png](design-references/design-1/Tablet 768 — Дэлгэрэнгүй.png) | 768 × 3800 | /templates/[slug] | Existing route |
| 59 | design-1 | [Tablet 768 — Загварууд.png](design-references/design-1/Tablet 768 — Загварууд.png) | 768 × 2600 | /templates | Existing route |
| 60 | design-1 | [Tablet 768 — Загварчлагч.png](design-references/design-1/Tablet 768 — Загварчлагч.png) | 768 × 2000 | /builder | Existing route |
| 61 | design-1 | [Tablet 768 — Төлбөр.png](design-references/design-1/Tablet 768 — Төлбөр.png) | 768 × 1900 | /payment | Exception: no live payment route/provider |
| 62 | design-1 | [Веб сайт захиалах — 7 алхам.png](design-references/design-1/Веб сайт захиалах — 7 алхам.png) | 1440 × 1900 | / | Existing route |
| 63 | design-1 | [Веб үйлчилгээ.png](design-references/design-1/Веб үйлчилгээ.png) | 1440 × 4600 | /services | Existing route |
| 64 | design-1 | [Вебээ загварчлах — загварчлагч.png](design-references/design-1/Вебээ загварчлах — загварчлагч.png) | 1440 × 1694 | /builder | Existing route |
| 65 | design-1 | [Дижитал хүргэлт.png](design-references/design-1/Дижитал хүргэлт.png) | 1440 × 1700 | /download | Exception: no customer delivery route |
| 66 | design-1 | [Загварууд.png](design-references/design-1/Загварууд.png) | 1440 × 2400 | /templates | Existing route |
| 67 | design-1 | [Загварын дэлгэрэнгүй.png](design-references/design-1/Загварын дэлгэрэнгүй.png) | 1440 × 2961 | /templates/[slug] | Existing route |
| 68 | design-1 | [Захиалгын явц — баталгаажуулалт (8 төлөв).png](design-references/design-1/Захиалгын явц — баталгаажуулалт (8 төлөв).png) | 1440 × 1400 | /orders/[id] | Exception: no customer tracking route |
| 69 | design-1 | [Захиалгын явц — олдсон.png](design-references/design-1/Захиалгын явц — олдсон.png) | 1440 × 1500 | /orders/[id] | Exception: no customer tracking route |
| 70 | design-1 | [Мэдэгдлийн төв.png](design-references/design-1/Мэдэгдлийн төв.png) | 1440 × 1270 | / | Existing route |
| 71 | design-1 | [Нүүр.png](design-references/design-1/Нүүр.png) | 1440 × 6581 | / | Existing route |
| 72 | design-1 | [Тусламжийн төв.png](design-references/design-1/Тусламжийн төв.png) | 1440 × 2672 | /help | Exception: no help route/content |
| 73 | design-1 | [Төлбөр — Template худалдан авах.png](design-references/design-1/Төлбөр — Template худалдан авах.png) | 1440 × 1300 | /payment | Exception: no live payment route/provider |
| 74 | design-1 | [Төлбөр — Веб захиалгын нэхэмжлэх.png](design-references/design-1/Төлбөр — Веб захиалгын нэхэмжлэх.png) | 1440 × 1400 | /payment | Exception: no live payment route/provider |
| 75 | design-1 | [Төлбөрийн үр дүн.png](design-references/design-1/Төлбөрийн үр дүн.png) | 1440 × 1000 | /payment | Exception: no live payment route/provider |
| 76 | design-1 | [Худалдан авалтууд.png](design-references/design-1/Худалдан авалтууд.png) | 1440 × 1300 | /purchases | Exception: no customer account/history |
| 77 | design-2 | [Phase 5–6 — тойм.png](design-references/design-2/Phase 5–6 — тойм.png) | 2880 × 4338 | Phase overview docs | Reference document, not app screen |
| 78 | design-2 | [PreviewDemo — бүрэлдэхүүн.png](design-references/design-2/PreviewDemo — бүрэлдэхүүн.png) | 1920 × 1360 | /builder | Existing route |
| 79 | design-2 | [UI UX аудитын тайлан.png](design-references/design-2/UI UX аудитын тайлан.png) | 2880 × 6308 | UX audit docs | Reference document, not app screen |
| 80 | design-2 | [admin marketing.png](design-references/design-2/admin marketing.png) | 2880 × 4000 | /admin/marketing | Exception: no model/route |
| 81 | design-2 | [blog, blog [slug].png](design-references/design-2/blog, blog [slug].png) | 2880 × 4800 | /blog/[slug] | Existing route |
| 82 | design-2 | [bundles, bundles [slug], checkout.png](design-references/design-2/bundles, bundles [slug], checkout.png) | 2880 × 5000 | /bundles/[slug] + /checkout | Checkout exception |
| 83 | design-2 | [favorites — 360 бараан.png](design-references/design-2/favorites — 360 бараан.png) | 720 × 7200 | /favorites | Existing route |
| 84 | design-2 | [favorites — 390.png](design-references/design-2/favorites — 390.png) | 780 × 6800 | /favorites | Existing route |
| 85 | design-2 | [favorites — бараан.png](design-references/design-2/favorites — бараан.png) | 2880 × 3800 | /favorites | Existing route |
| 86 | design-2 | [favorites.png](design-references/design-2/favorites.png) | 2880 × 3800 | /favorites | Existing route |
| 87 | design-2 | [learn, learn [slug].png](design-references/design-2/learn, learn [slug].png) | 2880 × 4200 | /learn/[slug] | Existing route |
| 88 | design-2 | [portfolio, portfolio [slug].png](design-references/design-2/portfolio, portfolio [slug].png) | 2880 × 4400 | /portfolio/[slug] | Existing route |
| 89 | design-2 | [services estimate.png](design-references/design-2/services estimate.png) | 2880 × 4200 | /services/estimate | Exception: no estimator or approved pricing |
| 90 | design-2 | [templates [slug] updates.png](design-references/design-2/templates [slug] updates.png) | 2880 × 4000 | /templates/[slug] (updates) | Exception: no version model |
| 91 | design-2 | [Админ контент — 390.png](design-references/design-2/Админ контент — 390.png) | 780 × 6800 | /admin/content, /admin/library | Existing routes |
| 92 | design-2 | [Админ — багц (бэлтгэл).png](design-references/design-2/Админ — багц (бэлтгэл).png) | 2880 × 3000 | /admin/bundles | Exception: no model/route |
| 93 | design-2 | [Админ — контент (портфолио, сургалт, нийтлэл, хувилбар).png](design-references/design-2/Админ — контент (портфолио, сургалт, нийтлэл, хувилбар).png) | 2880 × 3600 | /admin/content, /admin/library | Existing routes |
| 94 | design-2 | [Багц — 390.png](design-references/design-2/Багц — 390.png) | 780 × 7600 | /bundles | Existing route |
| 95 | design-2 | [Багц — бараан.png](design-references/design-2/Багц — бараан.png) | 2880 × 5000 | /bundles | Existing route |
| 96 | design-2 | [Дэлгэрэнгүй — 390.png](design-references/design-2/Дэлгэрэнгүй — 390.png) | 780 × 7200 | /templates/[slug] | Existing route |
| 97 | design-2 | [Дэлгэрэнгүй — бараан.png](design-references/design-2/Дэлгэрэнгүй — бараан.png) | 2880 × 4600 | /templates/[slug] | Existing route |
| 98 | design-2 | [Загварын дэлгэрэнгүй + үзүүлэн.png](design-references/design-2/Загварын дэлгэрэнгүй + үзүүлэн.png) | 2880 × 4600 | /templates/[slug] | Existing route |
| 99 | design-2 | [Маркетинг — 390.png](design-references/design-2/Маркетинг — 390.png) | 780 × 7200 | /admin/marketing | Exception: no model/route |
| 100 | design-2 | [Маркетинг — бараан.png](design-references/design-2/Маркетинг — бараан.png) | 2880 × 4000 | /admin/marketing | Exception: no model/route |
| 101 | design-2 | [Нийтлэл — 360 бараан.png](design-references/design-2/Нийтлэл — 360 бараан.png) | 720 × 7600 | /blog | Existing route |
| 102 | design-2 | [Нийтлэл — 390.png](design-references/design-2/Нийтлэл — 390.png) | 780 × 7600 | /blog | Existing route |
| 103 | design-2 | [Нийтлэл — бараан.png](design-references/design-2/Нийтлэл — бараан.png) | 2880 × 4800 | /blog | Existing route |
| 104 | design-2 | [Портфолио — 390.png](design-references/design-2/Портфолио — 390.png) | 780 × 7600 | /portfolio | Existing route |
| 105 | design-2 | [Портфолио — бараан.png](design-references/design-2/Портфолио — бараан.png) | 2880 × 4400 | /portfolio | Existing route |
| 106 | design-2 | [Сургалт — 390.png](design-references/design-2/Сургалт — 390.png) | 780 × 7600 | /learn | Existing route |
| 107 | design-2 | [Сургалт — 768.png](design-references/design-2/Сургалт — 768.png) | 1536 × 5600 | /learn | Existing route |
| 108 | design-2 | [Сургалт — бараан.png](design-references/design-2/Сургалт — бараан.png) | 2880 × 4200 | /learn | Existing route |
| 109 | design-2 | [Тооцоолуур — 390.png](design-references/design-2/Тооцоолуур — 390.png) | 780 × 7600 | /services/estimate | Exception: no estimator or approved pricing |
| 110 | design-2 | [Тооцоолуур — 768.png](design-references/design-2/Тооцоолуур — 768.png) | 1536 × 6000 | /services/estimate | Exception: no estimator or approved pricing |
| 111 | design-2 | [Тооцоолуур — бараан.png](design-references/design-2/Тооцоолуур — бараан.png) | 2880 × 4200 | /services/estimate | Exception: no estimator or approved pricing |
| 112 | design-2 | [Харьцуулалт + compare.png](design-references/design-2/Харьцуулалт + compare.png) | 2880 × 4000 | /compare | Existing route |
| 113 | design-2 | [Харьцуулалт — 390.png](design-references/design-2/Харьцуулалт — 390.png) | 780 × 6800 | /compare | Existing route |
| 114 | design-2 | [Харьцуулалт — бараан.png](design-references/design-2/Харьцуулалт — бараан.png) | 2880 × 4000 | /compare | Existing route |
| 115 | design-2 | [Шинэчлэлт — 390.png](design-references/design-2/Шинэчлэлт — 390.png) | 780 × 6800 | /templates/[slug] (updates) | Exception: no version model |
## Live review findings

- Local production preview of `/portfolio` checked at 360, 390, 768, 1024, and 1440px; the page shell had no horizontal overflow. A 390px mobile screenshot and 1440px desktop screenshot were visually inspected.
- The local content source returned no published library rows, so populated portfolio/blog/lesson cards and lesson navigation could not be visually verified with real content. The empty state rendered correctly. The template catalog still depends on Supabase availability.
- No admin login was attempted. Protected admin comparisons require an authorized session and representative records; `/dev/admin-preview` is synthetic and saving is intentionally rejected.

## Validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Passed |
| `npm run lint` | Passed |
| `git diff --check` | Passed; existing LF/CRLF notices only |
| `npm run build` | Passed; Next.js generated 42 app routes. |
| Portfolio page shell at 360, 390, 768, 1024, 1440px | Passed; no horizontal overflow observed. |
| Populated dynamic content and protected admin state validation | Incomplete: no published library rows were returned; no admin session used. |

## Unresolved exceptions

- Checkout/payment, QPay, invoices, customer purchases/download, tracking, and notifications lack confirmed live customer routes/integrations. Prototype states remain non-live.
- Website estimate needs approved pricing rules; bundles need a real checkout flow.
- Help and admin project/support/notification/marketing/version references lack confirmed route/data models.
- Reference #77 and #79 are roadmap/audit documents, not app screens.


