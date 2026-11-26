# AXORA хэрэгжүүлэлтийн сэргээх шалгалт

Огноо: 2026-11-25, Asia/Ulaanbaatar.

40 шаардлагын бүлгийг дахин шалгав. Анх хэсэгчлэн дутуу 5, буруу хэрэгжсэн 10, код байсан ч import/route-тай холбогдоогүй 0. Энэ удаагийн 15 батлагдсан алдаанаас 13-ыг локал орчинд засаж баталсан; 2 үндсэн орчны саад үлдсэн. Өмнөх 23 түүхэн бүртгэлтэй нийлээд bug register 38 ID-тай. 001–023-ыг бүгдийг энэ удаа шинээр илрүүлсэн гэж тооцоогүй.

Локалд 38 бүлэг VERIFIED, 2 бүлэг хэсэгчлэн батлагдсан (Firefox болон live missing-origin private settings дэлгэц). Үндсэн орчны schema/configuration-ийг хамтатгасан эцсийн ангилал: 16 VERIFIED, 24 ENVIRONMENT_BLOCKED. Нэг schema саад олон workflow шаардлагыг зэрэг хааж байгаа учраас энэ нь 24 тусдаа шинэ алдаа гэсэн үг биш.

**Үндсэн localhost:3000 дээр quotation-to-delivery бүрэн ажиллагаатай гэж дүгнээгүй.** Таван workflow хүснэгт PostgREST schema cache-д харагдахгүй (404/PGRST205); DATABASE_URL болон NEXT_PUBLIC_SITE_URL байхгүй. Локал QA-ийн Auth/REST/SMTP нь тусгаарласан fixture, өгөгдлийн ажиллагаа нь бодит PostgreSQL/PGlite SQL ба Next production frontend/backend. Энэ нь live Supabase migration эсвэл жинхэнэ inbox хүргэлтийн баталгаа биш.

## A. Өмнөх өөрчлөлтүүд яагаад харагдахгүй байсан бэ?

- Зөв checkout: `C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora`; branch `feat/axora-site`; HEAD `87c5610309af45ca6e2b42ea9f6f67c4898b6f3d`. Running Next dev process-ийн command энэ repo руу зааж байсан. Нотолгоо: [runtime-processes.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/runtime-processes.json>). Өөрийн QA process-ууд 43434/43435/43436, түр restart probe 43437, production probe 43439; хэрэглэгчийн 3000 серверийг зогсоогоогүй.
- Шинэ компонентууд route-д import хийгдсэн. Харин admin order-ийн RPC null үед `workflow && component` бүх хэсгийг тайлбаргүй нууж байсан. Missing RPC-г fixture-д дахин үүсгэж before зураг аваад, admin warning нэмсний дараа ижил тест өнгөрсөн.
- Required workflow settings/quotes/reports/events/outbox нь live REST contract-д бэлэн биш: [live-schema-readonly.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/live-schema-readonly.json>). PGRST205 нь schema cache-ийн бодит хариу; физик хүснэгтүүд байхгүй эсэх, applied migration version-ийг SQL connectionгүйгээр батлаагүй. Migration хэрэгжээгүй эсвэл PostgREST-д бэлэн болоогүй нөхцөлийг хооронд нь зохиож ялгаагүй.
- `NEXT_PUBLIC_SITE_URL` дутуу тул mail worker tracking холбоос үүсгэж илгээхэд бэлэн биш. SMTP user/password байгаа нь дангаараа бүх email тохирсон гэсэн үг биш.
- Үнэ хадгалах үед JSON key-order-ийн зөрүүнээс банкны баталгаажилтыг арилгаж, зөвшөөрсөн quotation байсан ч payment instructions алга болж байсан. Утгуудыг тус бүрээр нь харьцуулж зассан.
- Dropdown болон Builder өмнөх засварууд үндсэн серверт аль хэдийн харагдаж байсан: dropdown gap 10px, width 236px; desktop Builder 1440×1000 үед document height 1000px. Өөрчлөлт харагдахгүй байсан шалтгааныг бүгдийг stale cache эсвэл буруу server гэж тайлбарлаагүй. Cache цэвэрлээгүй.

## B. Өмнөх шаардлага бүрийн бодит төлөв

40 бүлэг нь upgrade/recovery prompt, өгсөн package/add-on/scheduling дүрмүүд болон хамгаалалтын шаардлагыг хамарна. Үнийн 12 нэмэлт feature болон багцын inclusions нь REC-012/013-ийн дэд шалгалтууд. Ангилал нь шаардлагын бүлэг; тестийн assertion эсвэл өөрчилсөн файлын тоо биш. Машинаар унших matrix: [requirements.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/requirements.json>).

### REC-001 — Орчин, repository, route ба сервер

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: Яг энэ checkout localhost:3000-д үйлчлэх.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `/`. Хариуцах файл: [scripts/recovery-runtime.mjs](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/scripts/recovery-runtime.mjs>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [runtime-processes.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/runtime-processes.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-002 — Бусад dropdown байрлал ба цэсүүд

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: Trigger-ээс 8–12px зай; бүх 7 холбоос; Escape/outside.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `/ + нийтийн 7 route`. Хариуцах файл: [src/components/ui/menu.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/ui/menu.tsx>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [dropdown-routes.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/dropdown-routes.json>), [live-public-navigation.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/live-public-navigation.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-003 — Loading skeleton

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: Бодит stream loading; navy gradient; light/dark; success/empty/error/retry.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `/templates`. Хариуцах файл: [src/app/globals.css](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/globals.css>), [src/app/cinematic.css](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/cinematic.css>), [src/app/templates/page.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/templates/page.tsx>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [loading-colors.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/loading-colors.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-004 — Marketplace шүүлтүүр

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: Ангилал, үнэ, хайлт, эрэмбэ, хадгалсан болон хослол үр дүнг өөрчлөх.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `/templates`. Хариуцах файл: [src/components/templates/Catalog.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/templates/Catalog.tsx>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [after/combined-filters.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/combined-filters.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-005 — Builder доод зай

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: Desktop 1000px viewport-д scrollHeight 1000; mobile байгалийн scroll.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `/builder`. Хариуцах файл: [src/components/builder/Builder.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/builder/Builder.tsx>), [src/app/cinematic.css](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/cinematic.css>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [runtime-after.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/runtime-after.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-006 — Доторх scrollbar

- Анхны төлөв: **INCORRECTLY_IMPLEMENTED**. Хүлээсэн үр дүн: Document, Builder sidebar/preview, admin nav ба панел scroll хийх.
- Илэрсэн байдал: Notification popover max-height байгаагүй; 300px viewport-д 488px panel тасарсан. Шалтгаан: Notification popover max-height байгаагүй; 300px viewport-д 488px panel тасарсан.
- Route: `/builder;/admin;/admin/settings;/admin/notifications`. Хариуцах файл: [src/app/globals.css](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/globals.css>), [src/app/admin-refinement.css](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/admin-refinement.css>).
- Засвар: Radix available-height + flex scroll жагсаалт; бусад зөв scrollbar-ийг хадгалсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [nested-scrollbars.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/nested-scrollbars.json>), [overlay-scrollbars.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/overlay-scrollbars.json>), [notification-before.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/notification-before.json>), [notification-after.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/notification-after.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-007 — Glass давхарга ба spacing

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: Process section transparent; илүү border-y/давхар glassгүй.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `/`. Хариуцах файл: [src/components/home/Process.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/home/Process.tsx>), [src/app/page.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/page.tsx>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [runtime-after.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/runtime-after.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-008 — Нэгдсэн header ба logo

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: Нэг header; viewport захад наалдахгүй; logo Home руу орох.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `Нийтийн route-ууд`. Хариуцах файл: [src/components/site/SiteHeader.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/site/SiteHeader.tsx>), [src/components/cinematic/PublicSiteShell.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/cinematic/PublicSiteShell.tsx>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [dropdown-routes.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/dropdown-routes.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-009 — Mobile navigation

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: Dock/menu/keyboard navigation ажиллах.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `Нийтийн mobile route-ууд`. Хариуцах файл: [src/components/site/MobileNav.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/site/MobileNav.tsx>), [src/components/site/MobileTabBar.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/site/MobileTabBar.tsx>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [mobile/](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/mobile/>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-010 — Artwork ба archive

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: Background/dots/hands/animation/logo болон 72 archived файл хадгалах.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `/`. Хариуцах файл: [scripts/check-protected-assets.mjs](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/scripts/check-protected-assets.mjs>), [artifacts/cleanup/verify-archive.cjs](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/artifacts/cleanup/verify-archive.cjs>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=NOT_APPLICABLE.
- Шалгалт: Hash ба archive integrity check. Нотолгоо: [asset-checks.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/asset-checks.log>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-011 — Админы persistent тохиргоо

- Анхны төлөв: **INCORRECTLY_IMPLEMENTED**. Хүлээсэн үр дүн: Үнэ, багц, feature, хугацаа, хөнгөлөлт, арчилгаа, ажлын өдөр, capacity, buffer, queue, банк.
- Илэрсэн байдал: JSON key-order comparison нь pricing save үед bankVerified=false болгосон; live schema мөн бэлэн биш. Шалтгаан: JSON key-order comparison нь pricing save үед bankVerified=false болгосон; live schema мөн бэлэн биш.
- Route: `/admin/settings`. Хариуцах файл: [src/components/admin/WorkflowSettings.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/admin/WorkflowSettings.tsx>), [src/app/admin/order-workflow-actions.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/admin/order-workflow-actions.ts>), [src/app/admin/(panel)/settings/page.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/admin/(panel)/settings/page.tsx>).
- Засвар: Банкны name/holder/account утгаар semantic equality; UI persistence + bank intact regression.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/accepted-price-frozen.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/accepted-price-frozen.png>), [before/bank-cleared-after-pricing.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/bank-cleared-after-pricing.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-012 — Үндсэн 3 багц

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Starter 100000/1/3; Business 200000/3/6; Premium 350000/5/10; included features/revisions.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/order;/admin/settings`. Хариуцах файл: [src/lib/order-workflow/defaults.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/defaults.ts>), [src/lib/order-workflow/pricing.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/pricing.ts>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [unit-tests.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/unit-tests.log>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-013 — Нэмэлт үйлчилгээний дүрэм

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Өгсөн бүх 12 feature үнэ/хоног; 30000/page; 15000/revision; 30000/month; rush30%; давхар тооцохгүй.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/order;/admin/settings`. Хариуцах файл: [src/lib/order-workflow/pricing.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/pricing.ts>), [src/lib/order-workflow/defaults.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/defaults.ts>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [unit-tests.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/unit-tests.log>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-014 — Анкет → серверийн үнэ

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Жинхэнэ хариултаар authoritative total; unsupported хүсэлтийг review flag.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/order → /api/orders`. Хариуцах файл: [src/app/api/orders/route.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/api/orders/route.ts>), [src/lib/order-workflow/pricing.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/pricing.ts>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/questionnaire-review.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/questionnaire-review.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-015 — Зөвшөөрсөн үнэ өөрчлөгдөхгүй

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Тохиргоо өөрчлөхөд accepted snapshot хэвээр; шинэ quote шинэ дүрмээр.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/admin/settings;/order/pay/[token]`. Хариуцах файл: [src/lib/order-workflow/server.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/server.ts>), [supabase/migrations/20261125000000_order_workflow.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125000000_order_workflow.sql>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/accepted-price-frozen.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/accepted-price-frozen.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-016 — Хэрэглэгчийн үнийн задаргаа

- Анхны төлөв: **PARTIALLY_IMPLEMENTED**. Хүлээсэн үр дүн: Багц, хуудас/нэмэлт хуудас, функц, items/subtotal/discount/total/notes.
- Илэрсэн байдал: Requirements snapshot UI-д тусдаа харагдаагүй. Шалтгаан: Requirements snapshot UI-д тусдаа харагдаагүй.
- Route: `/order/pay/[token]`. Хариуцах файл: [src/components/order/CustomerOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/CustomerOrderWorkflow.tsx>).
- Засвар: QuoteBreakdown-д package/pages/additionalPages/features нэмсэн.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/customer-quote.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-quote.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-017 — Үнийн санал зөвшөөрөх

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Confirmation, version check, timestamp, refresh persistence, төлбөр рүү.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/order/pay/[token]`. Хариуцах файл: [src/components/order/CustomerOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/CustomerOrderWorkflow.tsx>), [src/app/api/order-workflow/[token]/route.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/api/order-workflow/[token]/route.ts>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/customer-payment.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-payment.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-018 — Өөрчлөлт хүсэх

- Анхны төлөв: **INCORRECTLY_IMPLEMENTED**. Хүлээсэн үр дүн: Өөрчлөлт хүсэх нэртэй товч, мессеж админд хүрэх.
- Илэрсэн байдал: Товчны нэр шаардсан copy-той зөрсөн. Шалтгаан: Товчны нэр шаардсан copy-той зөрсөн.
- Route: `/order/pay/[token];/admin/orders/[id]`. Хариуцах файл: [src/components/order/CustomerOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/CustomerOrderWorkflow.tsx>).
- Засвар: Өөрчлөлт хүсэх болгож actual mobile action-ийг шалгасан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [mobile/customer-revision.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/mobile/customer-revision.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-019 — Татгалзах

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Confirmation; rejection хадгалах; төлбөрт шилжихгүй.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/order/pay/[token]`. Хариуцах файл: [src/components/order/CustomerOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/CustomerOrderWorkflow.tsx>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [mobile/customer-reject.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/mobile/customer-reject.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-020 — Хэрэглэгчийн JSON export

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: Customer JSON товчгүй; admin export authorization хэвээр.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `/order/pay/[token];/admin/orders/[id]`. Хариуцах файл: [src/components/order/OrderPayment.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/OrderPayment.tsx>), [src/components/admin/OrderDesignPreview.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/admin/OrderDesignPreview.tsx>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/customer-delivered.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-delivered.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-021 — Банк ба copy

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Баталгаатай admin bank; amount; reference; copy; дутуу банканд төлбөр шаардахгүй.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/order/pay/[token];/admin/settings`. Хариуцах файл: [src/components/order/CustomerOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/CustomerOrderWorkflow.tsx>), [src/components/admin/WorkflowSettings.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/admin/WorkflowSettings.tsx>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/customer-payment.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-payment.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-022 — Төлбөрийн мэдэгдэл

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Reported нь paid биш; notification, reference, timestamp, refresh, idempotency.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/order/pay/[token];/admin/notifications`. Хариуцах файл: [supabase/migrations/20261125000000_order_workflow.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125000000_order_workflow.sql>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/customer-payment-reported.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-payment-reported.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-023 — Админы payment dialog

- Анхны төлөв: **INCORRECTLY_IMPLEMENTED**. Хүлээсэн үр дүн: Customer/ref/email/amount/workload/duration/suggested + нэг editable date/note/cancel/confirm.
- Илэрсэн байдал: Inline div, cancel/customer note dialog integration дутуу. Шалтгаан: Inline div, cancel/customer note dialog integration дутуу.
- Route: `/admin/orders/[id]`. Хариуцах файл: [src/components/admin/AdminOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/admin/AdminOrderWorkflow.tsx>), [src/components/ui/BottomSheet.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/ui/BottomSheet.tsx>).
- Засвар: Existing BottomSheet dialog + additive note storage, customer view, email.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/admin-payment-dialog.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/admin-payment-dialog.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-024 — Хугацааны алгоритм

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: FIFO/capacity/Даваа–Баасан/buffer2/Ulaanbaatar; workload/committed deadlines; override.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/admin/settings;/admin/orders/[id]`. Хариуцах файл: [src/lib/order-workflow/scheduling.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/scheduling.ts>), [src/app/admin/order-workflow-actions.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/admin/order-workflow-actions.ts>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [unit-tests.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/unit-tests.log>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-025 — Бодит эхлэл, дуусалт

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Manual start inputгүй; start/complete action timestamp; queue≠started.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/admin/orders/[id];/admin/projects/[id]`. Хариуцах файл: [src/components/admin/forms.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/admin/forms.tsx>), [supabase/migrations/20261125000000_order_workflow.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125000000_order_workflow.sql>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/customer-tracking.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-tracking.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-026 — Имэйлийн агуулга

- Анхны төлөв: **INCORRECTLY_IMPLEMENTED**. Хүлээсэн үр дүн: Шаардсан subject; customer/ref/amount/Mongolian actual state/approved deadline/tracking/thank-you/start/completion.
- Илэрсэн байдал: Subject буруу, actual project state/timestamps/thank-you дутуу. Шалтгаан: Subject буруу, actual project state/timestamps/thank-you дутуу.
- Route: `SMTP outbox`. Хариуцах файл: [src/lib/order-workflow/email-message.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/email-message.ts>), [src/lib/order-workflow/email.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/email.ts>).
- Засвар: Нэгдсэн formatter + Монгол labels + exact subject + local SMTP body assertions.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/smtp-accepted.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/smtp-accepted.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-027 — SMTP retry ба давхардал

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Queue/lease; failed retry; duplicate eventгүй; uncertain delivery-г тусад нь.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/admin/orders/[id];/api/jobs/orders`. Хариуцах файл: [src/lib/order-workflow/email.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/email.ts>), [supabase/migrations/20261125000000_order_workflow.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125000000_order_workflow.sql>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/smtp-accepted.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/smtp-accepted.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-028 — Бүтэн browser lifecycle

- Анхны төлөв: **PARTIALLY_IMPLEMENTED**. Хүлээсэн үр дүн: Home → 7-step form → admin nav → quote → accept → transfer → dialog → start → complete → deliver.
- Илэрсэн байдал: Өмнөх тест бэлэн order seed/API-аар эхэлсэн. Шалтгаан: Өмнөх тест бэлэн order seed/API-аар эхэлсэн.
- Route: `/ → /order → /admin/orders → /order/pay/[token]`. Хариуцах файл: [tests/order-workflow/browser/workflow.spec.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/tests/order-workflow/browser/workflow.spec.ts>), [tests/order-workflow/browser/questionnaire.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/tests/order-workflow/browser/questionnaire.ts>).
- Засвар: Home navigation, UI-аар 7-step questionnaire, admin menu, quote edit, payment, start/complete/deliver.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-029 — Холбогдсон DB migration

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Шаардлагатай 5 workflow хүснэгт/RPC бодит schema-д байх.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `Холбогдсон Supabase`. Хариуцах файл: [supabase/migrations/20261125000000_order_workflow.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125000000_order_workflow.sql>), [supabase/migrations/20261125200000_workflow_recovery.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125200000_workflow_recovery.sql>), [supabase/migrations/20261125210000_email_receipts.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125210000_email_receipts.sql>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=NOT_APPLICABLE.
- Шалгалт: Read-only REST probe + disposable PostgreSQL migrations. Нотолгоо: [live-schema-readonly.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/live-schema-readonly.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-030 — Persistence

- Анхны төлөв: **PARTIALLY_IMPLEMENTED**. Хүлээсэн үр дүн: Refresh/navigation/new session/owned app server restart-д өгөгдөл хэвээр.
- Илэрсэн байдал: App restart/new session persistence өмнө нотлогдоогүй. Шалтгаан: App restart/new session persistence өмнө нотлогдоогүй.
- Route: `Локал production QA`. Хариуцах файл: [tests/order-workflow/browser/restart.spec.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/tests/order-workflow/browser/restart.spec.ts>).
- Засвар: Хоёр owned production-server start, тус бүр fresh browser + refresh; DB fixture restart хийсэн гэж дүгнээгүй.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/server-restart.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/server-restart.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-031 — Legacy compatibility

- Анхны төлөв: **ENVIRONMENT_BLOCKED**. Хүлээсэн үр дүн: Өмнөх өгөгдөл/төлбөр хадгалах; accepted мэдээлэл зохиохгүй.
- Илэрсэн байдал: Код route-тай холбогдсон боловч үндсэн Supabase REST schema-д workflow table/RPC бэлэн биш. Шалтгаан: Live schema contract PGRST205; SQL migration history шалгах connection байхгүй.
- Route: `/order/pay/[token]`. Хариуцах файл: [supabase/migrations/20261125000000_order_workflow.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125000000_order_workflow.sql>), [src/app/order/pay/[token]/page.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/order/pay/[token]/page.tsx>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [unit-tests.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/unit-tests.log>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-032 — Responsive ба browser

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: 320/360/375/390/430/768/1024/1280/1440/1920; Chromium/WebKit; Firefox тусад нь.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `Нийтийн болон admin route-ууд`. Хариуцах файл: [tests/order-workflow/browser/ui.spec.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/tests/order-workflow/browser/ui.spec.ts>), [tests/ecosystem/browser/audit.spec.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/tests/ecosystem/browser/audit.spec.ts>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=Chromium/WebKit VERIFIED; Firefox ENVIRONMENT_BLOCKED.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [artifacts/order-workflow/after-ui.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/artifacts/order-workflow/after-ui.json>).
- Локал төлөв: **PARTIALLY_IMPLEMENTED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-033 — Production runtime

- Анхны төлөв: **VERIFIED**. Хүлээсэн үр дүн: TypeScript/lint/unit/integration/browser/build; hydration ба navigation.
- Илэрсэн байдал: Өмнөх хэрэгжүүлэлтийг бодит rendered DOM/үйлдлээр дахин шалгасан; холбогдоогүй duplicate import илрээгүй. Шалтгаан: Шинэ батлагдсан implementation алдаа илрээгүй.
- Route: `Локал production QA`. Хариуцах файл: [playwright.orders.config.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/playwright.orders.config.ts>), [playwright.ecosystem.config.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/playwright.ecosystem.config.ts>).
- Засвар: Зөв ажиллаж буй кодыг хадгалж, одоогийн runtime/tests-ээр баталгаажуулсан.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [build.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/build.log>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-034 — Анкет хадгалсны дараах quotation алдаа

- Анхны төлөв: **INCORRECTLY_IMPLEMENTED**. Хүлээсэн үр дүн: Хадгалсан анкет 201/200 pending; retry duplicateгүй; worker recover.
- Илэрсэн байдал: Шинэ order хадгалагдаад amount=null байх үед shared OrderPayment нь Хэрхэн төлөх вэ?, Төлөх дүн, Төлөгдөөгүй гэсэн хуучин payment copy хэрэглэж байсан. Шалтгаан: Шинэ order хадгалагдаад amount=null байх үед shared OrderPayment нь Хэрхэн төлөх вэ?, Төлөх дүн, Төлөгдөөгүй гэсэн хуучин payment copy хэрэглэж байсан.
- Route: `/order → /api/orders`. Хариуцах файл: [src/app/api/orders/route.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/api/orders/route.ts>), [src/lib/order-workflow/recovery.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/recovery.ts>), [src/components/order/OrderPayment.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/OrderPayment.tsx>).
- Засвар: 201/200 pending хадгалалт/recovery-г хэвээр хадгалж, success receipt-ийн quotation copy-г зөв болгосон.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [before/saved-intake-user-reported.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/saved-intake-user-reported.png>), [after/intake-pending-success.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/intake-pending-success.png>), [pending-ui-test.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/pending-ui-test.log>), [before/receipt-premature-payment-copy.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/receipt-premature-payment-copy.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-035 — SMTP readiness

- Анхны төлөв: **INCORRECTLY_IMPLEMENTED**. Хүлээсэн үр дүн: SMTP credentials болон origin хоёуланг шалгаж бодит төлөв харуулах.
- Илэрсэн байдал: Origin байхгүй байхад SMTP credentials-only readiness харуулсан. Шалтгаан: Origin байхгүй байхад SMTP credentials-only readiness харуулсан.
- Route: `/admin/settings`. Хариуцах файл: [src/app/admin/(panel)/settings/page.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/admin/(panel)/settings/page.tsx>).
- Засвар: Credentials + origin шаардсан; live missing-origin admin screen browser UNVERIFIED.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=Configured branch VERIFIED; live missing-origin screen UNVERIFIED.
- Шалгалт: Settings configured branch browser + live config presence probe; missing-origin private screen UNVERIFIED. Нотолгоо: [live-schema-readonly.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/live-schema-readonly.json>).
- Локал төлөв: **PARTIALLY_IMPLEMENTED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-036 — Schedule request алдаа

- Анхны төлөв: **INCORRECTLY_IMPLEMENTED**. Хүлээсэн үр дүн: Network exception гарвал busy тайлагдаж дахин оролдох.
- Илэрсэн байдал: prepare() exception үед finally байхгүй. Шалтгаан: prepare() exception үед finally байхгүй.
- Route: `/admin/orders/[id]`. Хариуцах файл: [src/components/admin/AdminOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/admin/AdminOrderWorkflow.tsx>).
- Засвар: Network abort → catch/message → enabled retry → successful dialog.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/admin-payment-dialog.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/admin-payment-dialog.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-037 — Анкет submit текст

- Анхны төлөв: **INCORRECTLY_IMPLEMENTED**. Хүлээсэн үр дүн: Үнийн санал хянахын өмнө шууд төлбөр рүү гэж амлахгүй.
- Илэрсэн байдал: Анкет илгээх copy шууд payment рүү амласан. Шалтгаан: Анкет илгээх copy шууд payment рүү амласан.
- Route: `/order`. Хариуцах файл: [src/components/order/OrderForm.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/OrderForm.tsx>).
- Засвар: Анкет илгээх нэр нь draft/admin review урсгалтай нийцсэн.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/questionnaire-review.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/questionnaire-review.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

### REC-038 — SMTP Message-ID

- Анхны төлөв: **PARTIALLY_IMPLEMENTED**. Хүлээсэн үр дүн: Provider accepted Message-ID-г lease хамгаалалттай хадгалж зөвхөн админд үзүүлэх.
- Илэрсэн байдал: Outbox-д SMTP Message-ID хадгалагдаагүй. Шалтгаан: Outbox-д SMTP Message-ID хадгалагдаагүй.
- Route: `/admin/orders/[id]`. Хариуцах файл: [src/lib/order-workflow/email.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/email.ts>), [supabase/migrations/20261125210000_email_receipts.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125210000_email_receipts.sql>).
- Засвар: Service-only receipt RPC, active lease predicate, admin-only display.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/smtp-accepted.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/smtp-accepted.json>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-039 — Шилжүүлгийн confirmation

- Анхны төлөв: **PARTIALLY_IMPLEMENTED**. Хүлээсэн үр дүн: Батлахын өмнө amount/ref/bank/instruction дахин харагдах.
- Илэрсэн байдал: Confirmation дотор дүн, банк, reference дахин харагдаагүй. Шалтгаан: Confirmation дотор дүн, банк, reference дахин харагдаагүй.
- Route: `/order/pay/[token]`. Хариуцах файл: [src/components/order/CustomerOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/CustomerOrderWorkflow.tsx>).
- Засвар: Confirmation summary-д authoritative quote amount, real reference, verified bank нэмсэн.
- Холболт: frontend=CONNECTED; backend=LOCAL_VERIFIED; database=LOCAL_VERIFIED; LIVE_ENVIRONMENT_BLOCKED; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [workflow/customer-transfer-confirmation.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-transfer-confirmation.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **ENVIRONMENT_BLOCKED**.

### REC-040 — Админы чимээгүй алга болох хэсэг

- Анхны төлөв: **INCORRECTLY_IMPLEMENTED**. Хүлээсэн үр дүн: RPC байхгүй бол анкет хадгалсан, workflow холбогдоогүй гэсэн тайлбар харагдах.
- Илэрсэн байдал: RPC null бол workflow && component бүхэлд нь чимээгүй нуусан. Шалтгаан: RPC null бол workflow && component бүхэлд нь чимээгүй нуусан.
- Route: `/admin/orders/[id]`. Хариуцах файл: [src/app/admin/(panel)/orders/[id]/page.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/admin/(panel)/orders/[id]/page.tsx>).
- Засвар: Admin warning; same missing RPC browser scenario before/after.
- Холболт: frontend=CONNECTED; backend=VERIFIED_OR_NOT_APPLICABLE; database=NOT_APPLICABLE; browser=VERIFIED_LOCAL.
- Шалгалт: Actual Next production browser regression болон холбогдох SQL/unit assertions. Нотолгоо: [before/admin-missing-workflow.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/admin-missing-workflow.png>), [after/admin-missing-workflow.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/admin-missing-workflow.png>).
- Локал төлөв: **VERIFIED**. Үндсэн орчны бэлэн байдлыг тооцсон эцсийн төлөв: **VERIFIED**.

## C. Илрүүлсэн бүх алдаа

Доорх нь энэ сэргээх шалгалтын 15 шинэ ID. Өмнөх ID-уудын түүх [AXORA_BUG_REGISTER.md](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/AXORA_BUG_REGISTER.md>) дотор хадгалагдсан.

### AXORA-BUG-024 — Төлбөр батлах хэсэг dialog болоогүй

- Түвшин/төлөв: P1, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: AdminOrderWorkflow inline div; cancel болон customer note байхгүй.
- Файл: [src/components/admin/AdminOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/admin/AdminOrderWorkflow.tsx>), [src/components/ui/BottomSheet.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/ui/BottomSheet.tsx>), [supabase/migrations/20261125200000_workflow_recovery.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125200000_workflow_recovery.sql>).
- Засвар: BottomSheet dialog, нэр/байгууллага/email/ref, нэг date, workload, тайлбар, cancel/confirm; note DB/customer/email-д холбосон.
- Дахин үүсгэх: Reported test order → admin → төлбөр баталгаажуулах.
- Баталгаа: Browser lifecycle: role=dialog, date override, cancel/reopen, note refresh.
- Нотолгоо: [workflow/admin-payment-dialog.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/admin-payment-dialog.png>).

### AXORA-BUG-025 — Үнийн саналын хуудас/функцийн тойм дутуу

- Түвшин/төлөв: P2, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: QuoteBreakdown зөвхөн мөнгөн мөрүүдтэй; requirements snapshot дэлгэцэд гараагүй.
- Файл: [src/components/order/CustomerOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/CustomerOrderWorkflow.tsx>).
- Засвар: Snapshot-оос багц/хуудас/нэмэлт хуудас/selected features харуулна; legacy missing утгыг зохиохгүй.
- Дахин үүсгэх: Customer official quotation нээх.
- Баталгаа: Actual form → official quote browser screenshot.
- Нотолгоо: [workflow/customer-quote.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-quote.png>).

### AXORA-BUG-026 — Lifecycle имэйлийн subject ба агуулга буруу

- Түвшин/төлөв: P1, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: Шаардсан payment subject биш; actual state/start/completion/thank-you дутуу.
- Файл: [src/lib/order-workflow/email.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/email.ts>), [src/lib/order-workflow/email-message.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/email-message.ts>).
- Засвар: Нэг formatter; exact subject, Монгол төлөв, approved deadline, actual timestamps, tracking/thank-you.
- Дахин үүсгэх: Admin payment/start/complete action.
- Баталгаа: Unit + local SMTP protocol accepted 5 message-ийн decoded body assertions.
- Нотолгоо: [workflow/smtp-accepted.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/smtp-accepted.json>).

### AXORA-BUG-027 — SMTP Message-ID хадгалагдаагүй

- Түвшин/төлөв: P2, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: SMTP acknowledgement ирсэн ч outbox-д message identifier байхгүй.
- Файл: [src/lib/order-workflow/email.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/email.ts>), [supabase/migrations/20261125210000_email_receipts.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125210000_email_receipts.sql>).
- Засвар: Service-only, active lease-д холбогдсон receipt RPC; admin-only Message-ID; receipt алдаанаас болж дахин email илгээхгүй.
- Дахин үүсгэх: Verified payment → outbox харах.
- Баталгаа: SQL stale lease/permission + browser 5 SMTP Message-ID.
- Нотолгоо: [workflow/smtp-accepted.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/smtp-accepted.json>).

### AXORA-BUG-028 — SMTP readiness origin-ийг шалгаагүй

- Түвшин/төлөв: P2, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: SMTP user/password байвал tracking origin дутуу ч тохируулсан гэж харагдсан.
- Файл: [src/app/admin/(panel)/settings/page.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/admin/(panel)/settings/page.tsx>).
- Засвар: SMTP credentials ба NEXT_PUBLIC_SITE_URL хоёуланг шалгана; accepted ≠ inbox delivered тайлбар.
- Дахин үүсгэх: Admin Settings → холболтууд.
- Баталгаа: Settings browser render + read-only environment probe; live false branch admin accessгүй.
- Нотолгоо: [live-schema-readonly.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/live-schema-readonly.json>).

### AXORA-BUG-029 — Өөрчлөлт хүсэх товчны нэр зөрсөн

- Түвшин/төлөв: P3, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: Customer page-д Засвар хүсэх гэж гарсан.
- Файл: [src/components/order/CustomerOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/CustomerOrderWorkflow.tsx>).
- Засвар: Шаардсан Өөрчлөлт хүсэх нэрийг хэрэглэж үйлдлийг хэвээр хадгалсан.
- Дахин үүсгэх: Official quote → Өөрчлөлт хүсэх.
- Баталгаа: Mobile browser submit/reload/admin request assertion.
- Нотолгоо: [mobile/customer-revision.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/mobile/customer-revision.png>).

### AXORA-BUG-030 — Анкетын submit шууд төлбөр амласан

- Түвшин/төлөв: P3, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: Илгээгээд төлбөр рүү үргэлжлүүлэх гэсэн нэртэй, admin quotation review-ийг алгассан ойлголт өгсөн.
- Файл: [src/components/order/OrderForm.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/OrderForm.tsx>).
- Засвар: Анкет илгээх гэж өөрчилсөн; бодит draft quotation урсгалтай тохирсон.
- Дахин үүсгэх: 7-step form review.
- Баталгаа: Actual UI questionnaire submit 201.
- Нотолгоо: [workflow/questionnaire-review.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/questionnaire-review.png>).

### AXORA-BUG-031 — Schedule fetch exception busy-г тайлаагүй

- Түвшин/төлөв: P2, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: prepare() try/finallyгүй тул server-action network exception дараа товч disabled үлдэх эрсдэлтэй.
- Файл: [src/components/admin/AdminOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/admin/AdminOrderWorkflow.tsx>).
- Засвар: catch-д алдааны тайлбар; finally-д busy=false; дахин товшиж санал авах боломжтой.
- Дахин үүсгэх: Payment reported → schedule action request-г abort.
- Баталгаа: Browser explicitly aborts first POST; error visible, button enabled, second attempt succeeds.
- Нотолгоо: [workflow/admin-payment-dialog.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/admin-payment-dialog.png>).

### AXORA-BUG-032 — Workflow RPC байхгүй үед admin хэсэг чимээгүй алга болсон

- Түвшин/төлөв: P1, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: workflow && component нөхцөл null RPC response-г тайлбаргүй нуусан.
- Файл: [src/app/admin/(panel)/orders/[id]/page.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/admin/(panel)/orders/[id]/page.tsx>).
- Засвар: Анкет хадгалсан, quotation workflow холбогдоогүй гэдгийг admin-д ил тод харуулсан.
- Дахин үүсгэх: Fixture workflow RPC=PGRST202 → order detail.
- Баталгаа: BEFORE assertion failed; AFTER same assertion passes.
- Нотолгоо: [before/admin-missing-workflow.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/admin-missing-workflow.png>), [after/admin-missing-workflow.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/admin-missing-workflow.png>).

### AXORA-BUG-033 — Шилжүүлэг батлах panel-д дүн/банк/утга давтагдаагүй

- Түвшин/төлөв: P2, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: Confirmation panel зөвхөн optional reference/note харуулсан; amount/bank/ref өмнөх panel-д байсан.
- Файл: [src/components/order/CustomerOrderWorkflow.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/CustomerOrderWorkflow.tsx>).
- Засвар: Confirmation дотор amount, real order reference, bank, instruction харуулна.
- Дахин үүсгэх: Accepted quote → төлбөр мэдэгдэх → confirmation.
- Баталгаа: Browser confirmation region contains bank and captured actual screenshot.
- Нотолгоо: [workflow/customer-transfer-confirmation.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-transfer-confirmation.png>).

### AXORA-BUG-034 — Үнэ хадгалахад банкны баталгаажилт арилсан

- Түвшин/төлөв: P1, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: JSON.stringify object key-order ялгааг банкны өөрчлөлт гэж үзсэн. parseContent bank=name/account/holder; JSONB verified snapshot=name/holder/account.
- Файл: [src/app/admin/(panel)/settings/page.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/admin/(panel)/settings/page.tsx>).
- Засвар: Validated банкны name/holder/account-ийг тус бүрээр нь харьцуулна; pricing-only save банкны verified snapshot-г арилгахгүй.
- Дахин үүсгэх: Accept quote → settings price save → customer reload → bank hidden.
- Баталгаа: Before screenshot; strengthened pricing browser asserts account stays visible, old price frozen, new price current; following lifecycle passes.
- Нотолгоо: [before/bank-cleared-after-pricing.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/bank-cleared-after-pricing.png>), [workflow/accepted-price-frozen.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/accepted-price-frozen.png>).

### AXORA-BUG-035 — Live workflow schema API-д бэлэн биш

- Түвшин/төлөв: P1, **ENVIRONMENT_BLOCKED**.
- Алдаа ба шалтгаан: Таван required public table-ийн read-only REST probe HTTP404/PGRST205. SQL migration history унших DATABASE_URL байхгүй.
- Файл: [supabase/migrations/20261125000000_order_workflow.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125000000_order_workflow.sql>), [supabase/migrations/20261125200000_workflow_recovery.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125200000_workflow_recovery.sql>), [supabase/migrations/20261125210000_email_receipts.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125210000_email_receipts.sql>).
- Засвар: Локал disposable PostgreSQL дээр migration баталсан. Холбогдсон DB-д migration applied гэж тэмдэглээгүй.
- Дахин үүсгэх: Live read-only schema probe.
- Баталгаа: HTTP status/code evidence; no live SQL/data write.
- Нотолгоо: [live-schema-readonly.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/live-schema-readonly.json>).

### AXORA-BUG-036 — Live имэйлийн tracking origin дутуу

- Түвшин/төлөв: P1, **ENVIRONMENT_BLOCKED**.
- Алдаа ба шалтгаан: SMTP credentials байгаа ч NEXT_PUBLIC_SITE_URL байхгүй; worker mail claim хийхээс өмнө configured=false.
- Файл: [src/lib/order-workflow/email.ts](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/lib/order-workflow/email.ts>), [.env.example](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/.env.example>).
- Засвар: Missing-config readiness тайлбар зассан; жинхэнэ sender/inbox хүргэлтийг зохиогоогүй.
- Дахин үүсгэх: Live environment configuration probe.
- Баталгаа: SMTP sandbox accepted verified; real inbox delivery UNVERIFIED.
- Нотолгоо: [live-schema-readonly.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/live-schema-readonly.json>).

### AXORA-BUG-037 — Богино viewport-д notification popover тасарсан

- Түвшин/төлөв: P2, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: Popover-ийн 488px өндөр нь 300px viewport-д y=61-ээс 549px хүртэл гарч, жагсаалт дотроо scroll хийхгүй байсан.
- Файл: [src/app/admin-refinement.css](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/app/admin-refinement.css>).
- Засвар: Radix available-height-аар parent max-height тогтоож flex/min-height:0-ээр зөвхөн ul жагсаалтыг дотроо гүйлгэдэг болгосон.
- Дахин үүсгэх: 1440×300 admin → notification товч.
- Баталгаа: BEFORE bbox.bottom=549; AFTER bbox.bottom=284.5, list clientHeight=81/scrollHeight=345, thin scrollbar, scrollTop өөрчлөгдөнө; 300/1000px browser regression 2 passed.
- Нотолгоо: [before/notification-short-viewport.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/notification-short-viewport.png>), [after/notification-short-viewport.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/notification-short-viewport.png>), [notification-before.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/notification-before.json>), [notification-after.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/notification-after.json>), [notification-tests.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/notification-tests.log>).

### AXORA-BUG-038 — Анкетын success receipt үнийн саналын өмнө төлбөрийн copy харуулсан

- Түвшин/төлөв: P3, **VERIFIED_LOCAL**.
- Алдаа ба шалтгаан: Шинэ order хадгалагдаад amount=null байх үед shared OrderPayment нь Хэрхэн төлөх вэ?, Төлөх дүн, Төлөгдөөгүй гэсэн хуучин payment copy хэрэглэж байсан.
- Файл: [src/components/order/OrderPayment.tsx](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/src/components/order/OrderPayment.tsx>).
- Засвар: awaitingQuote төлөвөөр quotation preparation heading/status/summary гаргана. Amount-тай legacy төлбөрийн rendering хэвээр.
- Дахин үүсгэх: Questionnaire UI → saved receipt, quotation schema unavailable эсвэл official price хараахан үүсээгүй.
- Баталгаа: Pending UI expects Үнийн санал бэлтгэж байна and no Хэрхэн төлөх вэ?; legacy paid/unpaid two browser regressions.
- Нотолгоо: [before/receipt-premature-payment-copy.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/receipt-premature-payment-copy.png>), [after/intake-pending-success.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/intake-pending-success.png>), [pending-ui-test.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/pending-ui-test.log>).

## D. Харагдах байдлын бодит өөрчлөлт

| Хэсэг | Before | After / баталгаа |
|---|---|---|
| Үндсэн public дэлгэцүүд, 390/1440px | [before/](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/>) | [after/](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/>), [runtime-before.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/runtime-before.json>), [runtime-after.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/runtime-after.json>) |
| Dropdown | [before/dropdown-1440.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/dropdown-1440.png>) | [after/dropdown-1440.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/dropdown-1440.png>); [live-public-navigation.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/live-public-navigation.json>) |
| Admin missing workflow | [before/admin-missing-workflow.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/admin-missing-workflow.png>) | [after/admin-missing-workflow.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/admin-missing-workflow.png>) |
| Үнэ хадгалаад банк алга болох | [before/bank-cleared-after-pricing.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/bank-cleared-after-pricing.png>) | [workflow/accepted-price-frozen.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/accepted-price-frozen.png>) |
| Notification clipping, 1440×300 | [before/notification-short-viewport.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/notification-short-viewport.png>) | [after/notification-short-viewport.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/notification-short-viewport.png>); bottom 549 → 284.5px |
| Хадгалсан анкетын warning | [before/saved-intake-user-reported.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/before/saved-intake-user-reported.png>) | [after/intake-pending-success.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/intake-pending-success.png>); бодит UI 201 + saved answers + no retry |
| Жинхэнэ streamed loading | Өмнөх screenshot өнгийг reference болгосон; энэ удаа хуучин green кодыг буцааж суулгаагүй | [after/loading-light.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/loading-light.png>), [after/loading-dark.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/after/loading-dark.png>); computed gradient RGB(22,32,49) / RGB(41,56,77) |
| Quote/payment/dialog/tracking | Live DB бэлэн биш тул анхны live admin/quote зураг авах боломжгүй байсан | [workflow/customer-quote.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-quote.png>), [workflow/customer-payment.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-payment.png>), [workflow/customer-transfer-confirmation.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-transfer-confirmation.png>), [workflow/admin-payment-dialog.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/admin-payment-dialog.png>), [workflow/customer-tracking.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/customer-tracking.png>) |
| Mobile workflow | Шинэ QA order-оор авсан | [mobile/customer-quote.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/mobile/customer-quote.png>), [mobile/customer-payment.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/mobile/customer-payment.png>), [mobile/admin-payment-dialog.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/mobile/admin-payment-dialog.png>), [mobile/filter-drawer-scrollbar.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/mobile/filter-drawer-scrollbar.png>) |

Before зураг байхгүй хэсэгт хуучин кодыг түр сольж зураг зохиогоогүй. Анкетын before зураг нь хэрэглэгчийн өгсөн screenshot-ийн хуулбар; бусад шинэ нотолгоо Playwright browser-оос авсан. Functional desktop screenshot нь ихэвчлэн 1280×720, public харьцуулалт 1440×1000/390×1000, notification pair 1440×300. Богино notification pair болон банкны pair нь тус тус ижил нөхцөлтэй.

Global document, Builder sidebar/DOM preview, admin nav/content, dropdown, filter drawer, payment dialog, table-ийн scroll-ийг [nested-scrollbars.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/nested-scrollbars.json>) болон [overlay-scrollbars.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/overlay-scrollbars.json>) дотор хэмжсэн. Notification хэвийн өндөрт багтдаг тул scrollbar шаардлагагүй; 300px өндөрт actual list scroll баталсан. Builder preview iframe биш. Thumb radius 999px, arrow display none, scrollbar-width thin; scrollTop/scrollLeft хөдөлсөн.

## E. Шинээр ажиллаж байгаа функцүүд

- Үндсэн сайт: [localhost:3000](http://localhost:3000/) → Загварууд: loading/filter; Веб бүтээгч: workspace/context toolbar; Анкет: quotation fields, зөв submit copy, saved/pending success. 14 public route-ийн header/dropdown-ийг actual server дээр дахин нээж хэмжсэн.
- Тусгаарласан QA: [QA сайт](http://localhost:43435/). Auth/банк/төлбөр/имэйл нь зөвхөн test environment; жинхэнэ данс эсвэл production payment биш. Admin login: [QA Admin](http://localhost:43435/admin/login), `admin@example.invalid` / `fixture-admin-only-2026`. Эдгээр нь test-only credential, production Supabase-д хүчинтэй биш.
- Admin → Веб захиалгууд → AX-3F2588D5: [захиалгын дэлгэрэнгүй](http://localhost:43435/admin/orders/8621377d-1a97-44d5-a070-60505ba16cba). Анкетыг UI-аар шинээр үүсгэж quotation-ийг илгээж/зөвшөөрүүлэн test transfer reported төлөвт үлдээсэн. Төлбөр баталгаажуулах товчоор хугацааны dialog нээгдэнэ. Энэ order-ийг paid болгож худал тэмдэглээгүй.
- [Тухайн хэрэглэгчийн хуудас](http://localhost:43435/order/pay/tGYl3lNgm4YsVfU6l1xVanrfv4iDqUPA): accepted quotation, bank details, payment reported state. Энэ холбоос нь зөвхөн loopback QA record.
- [Бүтэн циклээр хүлээлгэн өгсөн QA захиалга](http://localhost:43435/order/pay/1LnRBa45xcaq11FPH9IH3mXUrrPOiTJt) болон [түүний admin хуудас](http://localhost:43435/admin/orders/1a4d757b-5c2f-4121-aae2-1f675503c636): agreed deadline, actual start/completion, sent events, delivery state. Delivery destination `example.invalid` нь тестийн URL.
- Admin → Тохиргоо → Веб хөгжүүлэлтийн үнэ, хугацаа, банк: package/add-on/duration/discount/rush/maintenance/capacity/workdays/buffer/queue/bank. Test-ийн Starter өөрчлөлтийг UI-аар 100000₮ рүү буцаасан; бодит owner/admin тохиргоонд гар хүрээгүй.
- Admin order → Үнийн саналын шинэ хувилбар: actual line price 210000, discount 10000 болгож version 2/200000₮ official quote үүсгэхийг UI-аар шалгасан. Accepted snapshot нь settings өөрчлөгдөхөд хэвээр, шинэ order шинэ үнээр бодогдсон.
- Admin order → Үнийн хувилбар, имэйлийн төлөв, түүх: outbox attempts/error/SMTP Message-ID. Sent нь SMTP accepted гэсэн local нотолгоо; inbox delivery баталгаагүй.
- Admin project → Захиалгын ажиллагааг нээх: managed project-ийн date/status-ийг order workflow-оос удирдана. Manual start inputгүй; start/complete action нь timestamp бүртгэнэ. [workflow/project-date-controls.png](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/project-date-controls.png>).

QA app-ийг шинэ CSS build-ээр restart хийхдээ зөвхөн өөрийн танигдсан app PID-г зогсоож, PostgreSQL fixture-г ажиллаж үлдээсэн; одоогийн test order-ууд хадгалагдсан. Process metadata: [workflow/review-servers.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/workflow/review-servers.json>). QA database нь disposable in-memory PostgreSQL: app restart persistence шалгасан, DB fixture process restart persistence гэж тайлагнаагүй.

## F. Database болон backend

- Одоо байгаа orders/projects/notifications/site_content structures, workflow functions/guards/leases/RLS-ийг ашигласан. Шинэ quotation calculator давхар үүсгээгүй. Server нь authoritative pricing; included/duplicate features, pages, discounts, rush, monthly/external зардал тусдаа. Unsupported шаардлага final үнэ болж зохиогдохгүй.
- Энэ удаа нэмсэн additive migrations: [supabase/migrations/20261125200000_workflow_recovery.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125200000_workflow_recovery.sql>) (verification_note, existing function replacement) ба [supabase/migrations/20261125210000_email_receipts.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125210000_email_receipts.sql>) (provider_message_id, service-only active-lease receipt, admin email metadata).
- Өмнөх foundation [supabase/migrations/20261125000000_order_workflow.sql](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/supabase/migrations/20261125000000_order_workflow.sql>) болон catalog guard-тай хамт disposable PostgreSQL/PGlite-д SQL-ээр ажиллуулж шалгасан. Live Supabase-д SQL migration **ажиллуулаагүй**; applied version history **UNVERIFIED**. Бэлэн REST contract таван table дээр PGRST205, projects table read 200.
- Refresh, шинэ context, navigation, хоёр owned production-server restart-ийн үед шинэ UI application хадгалагдсан. Legacy paid/unpaid record-ийг historical fixture хэлбэрээр үүсгэж, rendering/refresh нь amount/payment_status/workflow_managed/quote count-ийг өөрчлөөгүй. New order-ийн үндсэн lifecycle-г шууд DB insert-ээр орлуулаагүй.
- Customer token нь 32 тэмдэгт; reference дангаараа access биш. Server actions auth/admin, origin, stale version, amount, deadlines, legal transitions, duplicate keys-ийг шалгасан. Customer response-д admin customerEmail/emailEvents нэмэгдээгүй. RLS/receipt permission test unauthorized request-ийг хориглосон. Authentication-г production кодод унтраагаагүй.
- Service credentials хэвлээгүй; жинхэнэ customer record/payment/email-д write/send хийгээгүй. Admin-only JSON exports хэвээр; ordinary customer JSON товчгүй. Upload ticket/binding integration шалгасан, live Storage upload delivery тусад нь UNVERIFIED.
- Production-ийн 67 output trace manifest-д qa-evidence эсвэл workflow fixture файл bundle хийгдээгүй: [bundle-evidence-check.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/bundle-evidence-check.json>).

## G. Тестийн бодит үр дүн

| Команд | Exit | Тест | Log |
|---|---:|---:|---|
| `npm run test:ecosystem` | 0 | 41 passed | [unit-tests.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/unit-tests.log>) |
| `npm run test:ecosystem:e2e` | 0 | 19 passed | [ecosystem-browser-tests.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/ecosystem-browser-tests.log>) |
| `AXORA_QA_REVIEW=1 npx playwright test -c playwright.orders.config.ts` | 0 | 17 passed | [browser-tests.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/browser-tests.log>) |
| `AXORA_QA_REVIEW=1 npx playwright test -c playwright.orders.config.ts --grep 'saved questionnaire UI|legacy .* order renders'` | 0 | 3 passed | [pending-ui-test.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/pending-ui-test.log>) |
| `AXORA_QA_REVIEW=1 npx playwright test -c playwright.orders.config.ts --grep 'notification popover stays'` | 0 | 2 passed | [notification-tests.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/notification-tests.log>) |
| `npm run typecheck` | 0 | route typegen + tsc | [typecheck.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/typecheck.log>) |
| `npm run lint` | 0 | 0 error, 4 өмнөх warning | [lint.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/lint.log>) |
| `npm run build` | 0 | 63 static/PPR page generation | [build.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/build.log>) |
| `node scripts/recovery-production.mjs` | 0 | 10 public page read-only checks; pageerror/console/HTTP/non-cancelled network errors=[] | [production-runtime.json](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/production-runtime.json>) |
| `node scripts/check-protected-assets.mjs` | 0 | 11 protected files/composition unchanged | [asset-checks.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/asset-checks.log>) |
| `node artifacts/cleanup/verify-archive.cjs` | 0 | 72 archive files; 24 protected assets unchanged | [archive-checks.log](<C:/Users/tulhu/OneDrive/Desktop/websites/Axora/Axora/qa-evidence/axora-upgrade/archive-checks.log>) |

Эцсийн давхардалгүй тест: **80 passed, 0 failed, 0 skipped** (41 unit/SQL + 19 existing browser + 17 workflow browser + 1 pending UI + 2 notification). Pending UI-ийн хамгийн сүүлийн target run нь legacy хоёр regression-тэй нийлээд 3 passed; тэдгээр legacy 2 нь үндсэн 17-д аль хэдийн багтсан тул давхар тоолоогүй. Давтан target run-уудыг нэмж тоолоогүй. Chromium өргөнүүд 320/360/375/390/430/768/1024/1280/1440/1920; WebKit 390/1024/1440. Firefox launch probe exit 1, `spawn UNKNOWN`: ENVIRONMENT_BLOCKED, Firefox passed гэж тэмдэглээгүй.

Завсрын тестүүд унасан түүхийг нуухгүй: missing RPC before test хүлээгдсэн байдлаар унасан; pricing save → bank cleared жинхэнэ regression илэрсэн; notification clipping хэмжигдсэн. Shared test-results path collision, ижил synthetic IP rate-limit, hidden/mobile table selector, давхар текст selector, MIME base64 decoder, stream-д detached skeleton хэмжсэн race, Windows signal-terminated child cleanup, anti-bot minimum dwell зэрэг test harness асуудлыг засаж affected test-үүдийг дахин явуулсан. Rate limiter/anti-bot/auth-ийг production-д сулруулаагүй; synthetic хэрэглэгчдийг тусдаа test IP-гаар төлөөлүүлж, бодит minimum fill хугацааг хүлээсэн.

## H. Үлдсэн бодит хязгаарлалт

1. **BLOCKED — live workflow schema/RPC.** REST contract-д таван required table харагдахгүй. SQL access байхгүй тул physical schema/applied versions эсвэл schema cache reload-ийг батлаагүй. Authorized development DB SQL connectionгүйгээр live migration applied гэж дүгнэх боломжгүй.
2. **BLOCKED — live email origin.** NEXT_PUBLIC_SITE_URL байхгүй. SMTP credential байна; жинхэнэ sender acceptance/inbox delivery тест хийгээгүй. Зөвхөн local SMTP accepted ба outbox status батлагдсан.
3. **UNVERIFIED — live private admin болон бодит хуучин customer order.** Нууц хэрэглэгчийн data/credentials хэрэглээгүй. Тэдний оронд зөвшөөрөгдсөн local fixture-д browser/SQL шалгалт хийсэн. Missing-origin Settings false branch-ийн live browser зураг байхгүй.
4. **ENVIRONMENT_BLOCKED — Firefox** spawn UNKNOWN. Chromium/WebKit coverage тусдаа батлагдсан.
5. QA банк нь Fixture Bank / TEST123456, QA Auth нь loopback fixture. Энэ нь бодит банкны тохиргоо баталгаажсан эсвэл live Supabase Auth deployment бүхэлдээ батлагдсан гэсэн үг биш. QA PostgreSQL fixture-г зогсоовол synthetic record-ууд алга болно; үндсэн database-ийн хадгалалттай андуурахгүй.
6. Өмнөх generator болон хамгаалагдсан hand rig-д дөрвөн unused-variable lint warning үлдсэн; build/lint exit 0. Хамгаалагдсан artwork-ийг warning дарахын тулд өөрчлөөгүй.
7. Existing ecosystem-ийн unavailable external Dashboard provisioning-ийг энэ сэргээх ажлаар ажиллаж эхэлсэн гэж тайлагнаагүй. Push/deploy хийгээгүй.

Энэ тайлан нь QA checklist-ийг хэрэглэгчид шилжүүлээгүй: техникийн боломжтой UI/SQL/browser шалгалтуудыг ажиллуулж нотолгоо хадгалсан; орчны бодит саадуудыг VERIFIED гэж тэмдэглээгүй.
