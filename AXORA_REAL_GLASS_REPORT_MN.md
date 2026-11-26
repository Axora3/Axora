# AXORA — Real Liquid Glass шилжилтийн тайлан

Огноо: 2026-11-26, Asia/Ulaanbaatar. Existing checkout дээр хэрэгжүүлсэн; deployment хийгээгүй. Бодит хэрэглэгчийн захиалга, төлбөр, database болон email-д өөрчлөлт оруулаагүй. Backend regression нь loopback PostgreSQL/Auth/SMTP fixture ашигласан.

## Хэрэгжүүлэлт

`@samasante/liquid-glass@0.1.1`-ийг exact version-оор суулгаж, `AxoraGlass`, төвлөрсөн дөрвөн optical preset, capability detection, нэг хөдөлгөөнт `GlassActiveIndicator` нэмэв. MIT лицензийг THIRD_PARTY_NOTICES.md-д бүтнээр хадгалсан. Upstream API, packaged implementation, map generator cleanup, Material dispatch, README/BROWSERS болон notification жишээг судалсан. Эх сурвалж: https://github.com/samasante/liquid-glass. Судалгааны хуулбар: `qa-evidence/real-liquid-glass/upstream/`.

Энэ нь зөвхөн CSS blur биш: Blink дээр бодит SDF displacement map → feImage → RGB feDisplacementMap → backdrop-filter URL ашиглана. Optical layer нь pointer-events:none, aria-hidden; semantic link/button, текст, input болон focus нь өөрийн DOM элемент дээр хэвээр. DOM screenshot, html2canvas, page clone, тусдаа media renderer ашиглаагүй.

| Бодит интерфэйс | Шилжилт |
| --- | --- |
| Public header | Navigation material, route lens, theme control, үндсэн CTA |
| Бусад dropdown | Existing portal/ref/placement/Escape логиктой panel material |
| Mobile dock | 340×66 floating navigation, нэг хөдөлгөөнт lens |
| Segmented/Radix tabs | Нэг shared measured lens; selected state observer |
| Builder | Зөвхөн toolbar; preview palette ба configuration logic хэвээр |
| Marketplace | Native sort select-ийн гаднах control; mobile filter sheet panel |
| Dialog/BottomSheet | Shared panel; focus trap, scroll, keyboard ба unsaved confirmation хэвээр |
| Admin | Notification popover, mobile dock/lens |
| Customer order | Сонгосон copy controls, shared dialogs |
| Home primary CTA | Control material; section бүхэлд нь glass болгоогүй |

Process болон full-width home sections-д шинэ glass shell нэмээгүй. Product cards, form sections болон Builder preview-г optical panel болгож хувиргаагүй. Protected зургийг дахин үүсгээгүй, өнгө/хэмжээ/байршлыг өөрчлөөгүй. Өмнөх R3F custom logo/shader хэвээр; API дутсан үед existing SVG fallback ашиглана. Paper liquid-logo болон ShaderGradient-ийн шинэ код хуулж оруулаагүй; эдгээрийн өмнөх custom implementations-ийг official integration гэж нэрлэхгүй. Dashersw engine/html2canvas active dependency/consumer олдоогүй тул байгаа мэтээр dependency устгаагүй. Ашиглагдахаа больсон `.ax-segment-pill` renderer CSS, duplicate local indicator хэмжилтийг shared adapter-аар сольсон.

## Илэрсэн ба зассан асуудал

1. **AXORA-BUG-039:** Upstream dispatch дээр child байхгүй эсвэл filterResolution өгвөл Material биш өөр path сонгогдож байсан. Empty decorative child, live=false, filterResolution-гүй болгосон. Import болон SVG count дангаараа pass болохгүй.
2. **AXORA-BUG-040:** Standard property-гийн араас WebKit prefix бичсэнээр CSS optimizer зөвхөн prefix үлдээж, Chrome host-ийн хуучин blur хэвээр байсан. Энэ нь гаднах backdrop refraction-ийг хаасан. Prefix-ийг эхэлж бичин host backdrop none болгосон; external grid pixel ablation-аар шалгасан.
3. **AXORA-BUG-041:** Dock нь цайвар preview дээр жижиг текстийн contrast 2.8–4.39:1 болсон. Navigation tint-ийг .84 болгон бараан болгож, бодит axe contrast suite дахин тэнцсэн.
4. **AXORA-BUG-042:** ResizeObserver байхгүй үед хуучин footer/hands resize listener болон R3F logo mount нь app-level error гаргаж байсан. Observer optional guard, Builder guard, existing SVG logo fallback нэмсэн. Hands rig-ийн geometry, painting, scroll animation болон зургийн өгөгдөл өөрчлөгдөөгүй; `scene.js`-ийн API guard өөрчлөгдсөн тул бүх source hash unchanged гэж тайлагнахгүй.
5. BottomSheet-ийн хуучин lint suppression буруу мөр дээр байсныг зөв мөрөнд шилжүүлсэн. Confirmation ажиллагааг өөрчлөөгүй.

## Браузер ба нотолгоо

Chrome-д actual material node, non-zero displacement scale, feImage map, filter URL болон pixel ablation шалгасан. Header-ийн **гадна** байрласан controlled grid дээр displacement scale=0 болгоход **11,327 пиксел**, RGB нийт **321,464** нэгж өөрчлөгдсөн (`browsers/results.json`). Diagnostic grid зөвхөн түр browser session-д үүсдэг, production route/code-д үлддэггүй. Энэ шалгалт анх хуучин host blur асуудлыг илрүүлж, засварын дараа тэнцсэн. Forced-colors болон ResizeObserver-гүй production probe: pass, pageerror=[] (`browsers/audit.log`).

WebKit нь `frost-fallback` ашиглана. Safari/Firefox-ийн arbitrary live DOM backdrop refraction-ийг Chrome-той адил гэж зарлаагүй. Firefox executable энэ орчинд `spawn UNKNOWN` алдаагаар асахгүй тул бодит Firefox pass байхгүй. Forced-colors болон missing ResizeObserver fallback-ийг тусад нь шалгана; reduced motion нь lens transition-ийг шууд settle болгоно.

Before/after: `qa-evidence/real-liquid-glass/before/`, `after/`: /, /builder, /templates, /order, /admin/login тус бүр 390/1440px. Browser screenshots болон optical proof: `browsers/`. Public desktop/mobile 10 screenshot capture-д pageerror=[]; horizontal overflow хэмжилт runtime.json-д. Dropdown trigger-ийн доор, dock 390px viewport-д x=25, width=340, height=66; selected lens alignment шалгасан. Before authenticated Admin тусдаа зураг энэ migration-д аваагүй; өмнөх audit evidence-ийг шинэ baseline мэт нэрлээгүй.

## Автомат шалгалт

- TypeScript: pass.
- ESLint: 0 error; generator/illustrated-rig дэх өмнөх 4 unused warning хэвээр.
- SQL/unit/integration: **41 passed**.
- Ecosystem production browser: эхний run 17/19; contrast болон хуучирсан host-blur assertion зассаны дараах run **19 passed**, `after/ecosystem-browser.log`.
- Order production browser: **20 passed**. Admin/customer lifecycle, frozen quote, payment, scheduling, settings, SMTP outbox, pending intake, legacy, nested scroll, responsive Chrome/WebKit хамрагдсан.
- Production build: pass; эцсийн лог `after/production-build.log`.
- Optical/fallback audit: `browsers/audit.log`, `browsers/results.json` нь хамгийн сүүлийн бодит үр дүнгийн эх сурвалж.
- Archive verification: 72 файл / 21,168,799 bytes, 24 protected assets. Visual composition checker-ийн source hash өөрчлөлт дээрх optional API guard-аар хязгаарлагдана; artwork/composition rules өөрчлөгдөөгүй.

## Гүйцэтгэл ба хязгаар

`measure-real-glass.mjs` нь ижил 1440×1000 Chrome дээр 2 секундийн rAF sample, JS heap estimate, visible canvas/filter/material count авсан. Before sample p50/p95≈6.1ms, material=0, canvas=1. Final isolated after sample: **318 frames, p50=6.1ms, p95=6.2ms, 7 material/18 displacement nodes, canvas=1** (`after/performance.json`). JS heap estimate **46.6MB → 72.4MB**; optical runtime-ийн нэмэлт memory зардлыг нуухгүй. Богино sample, тусдаа QA instance-ууд нь төхөөрөмжийн benchmark, яг ижил retained heap comparison эсвэл memory leak proof биш. Concurrent browser test үеийн 260.5ms p95 sample-ийг engine-ийн дан зардал гэж тайлбарлаагүй; isolated хэмжилтээр сольсон.

Adapter нь тасралтгүй screenshot/render loop нэмэхгүй. Upstream SDF map нь mount/geometry өөрчлөлтөд үүсэж, ResizeObserver болон generator disposal нь unmount үед цэвэрлэгдэнэ. Short lens width animation-д map дахин үүсэх боломжтой; “хэзээ ч per-frame map update байхгүй” гэж батлаагүй. Шинэ visible canvas нэмээгүй; existing brand canvas хэвээр. Mobile бодит төхөөрөмжийн GPU/power profile, урт хугацааны heap-leak audit болон Firefox runtime шалгалт хийгдээгүй.

Live Supabase-ийн өмнө илэрсэн workflow schema/config хязгаарлалт нь UI migration-аар шийдэгдсэн гэж зарлахгүй. Бизнес урсгалын автомат тест нь бодит SQL/backend/frontend-ийг disposable fixture дээр шалгасан. Production migration/deployment тусдаа ажиллагаа хэвээр.

Хөгжүүлэгчийн API, preset, fallback, scope болон upgrade trap: **AXORA_GLASS_COMPONENT_GUIDELINES.md**.
