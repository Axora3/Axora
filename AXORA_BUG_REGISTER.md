# AXORA bug register

Audit: 2026-11-24. Permanent identifiers retained; 11 findings, all verified locally. One finding (006) was a temporary development regression introduced and corrected during this audit; ten pre-existed. No production deployment. Initial discovery log is preserved under artifacts/full-audit/bug-register-discovery.md.

## AXORA-BUG-001 — Хүсэлтийн урсгал тасрахад API хяналтгүй алдаа гаргасан

- Category: API, найдвартай ажиллагаа. Severity / priority: P2 (Дунд). Final status: VERIFIED.
- Affected feature: Contact, анкет, загвар авах хүсэлт болон JSON ашигладаг API.
- Locations: src/lib/server/http.ts:27.
- Initial behavior: Уншиж буй хүсэлтийн урсгал алдаа өгөхөд readJson өөрөө exception шидэж, стандарт алдааны хариу буцаахгүй байсан.
- Expected behavior: Тасарсан хүсэлтэд хяналттай 400, хэт том хүсэлтэд 413 хариу өгөх.
- Reproduction: ReadableStream-ийг client disconnected алдаагаар тасалж readJson дуудах.
- Root cause: reader.read болон cancel нь JSON parse-ийн try/catch-ийн гадна байсан.
- Evidence: Засварын өмнөх шинэ тест client disconnected алдаагаар унасан; дараах тестүүд давсан.
- Proposed and actual correction: Урсгал уншихыг хамгаалж, reader-ийн түгжээг finally дотор сулласан. Цуцлалт өөрөө алдаа өгсөн ч 413 төлөв хадгалагдана.
- Tests: http-boundaries.test.ts: тасарсан урсгал, эвдэрсэн JSON, хэт том body.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Present before the relevant correction.

## AXORA-BUG-002 — Эвдэрсэн эсвэл хаалттай хадгалалт анкетыг унагасан

- Category: Хэрэглэгчийн анкет, төлөв сэргээх. Severity / priority: P2 (Дунд). Final status: VERIFIED.
- Affected feature: /order.
- Locations: src/components/order/OrderForm.tsx:14; src/lib/order/draft.ts:26.
- Initial behavior: Дутуу хадгалсан ноорог fileNames.length дээр унасан. Browser sessionStorage-д хандахыг хориглоход анкет мөн алдаа гаргасан.
- Expected behavior: Буруу нооргийг алгасаж, хадгалалтгүй үед ч бөглөж болох анкет харуулах.
- Reproduction: sessionStorage-д {v:1,answers:{}} хадгалах, эсвэл sessionStorage getter-ийг SecurityError шиддэг болгоод /order нээх.
- Root cause: Нооргийн дотоод бүтцийг cast-аар шууд зөв гэж үзсэн; storage getter хамгаалалтын гадна үнэлэгдсэн.
- Evidence: Chrome дахь анхны хоёр нөхцөл хоёулаа runtime алдаатай байсан; засварын дараа анкетын талбарыг бөглөж чадсан.
- Proposed and actual correction: Нооргийн бүх шаардлагатай талбар, алхам, түлхүүрийг Zod-оор шалгадаг болсон. Storage-д хандах үйлдлийг хамгаалсан функцэд шилжүүлж, зөвшөөрлийг сэргээхгүй хэвээр үлдээсэн.
- Tests: order-draft.test.ts болон audit.spec.ts: эвдэрсэн ноорог, хаалттай хадгалалт, кирилл өгөгдөл, зөвшөөрөл дахин асуух.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Present before the relevant correction.

## AXORA-BUG-003 — Footer-ийн лого холбоос уншигдах нэргүй байсан

- Category: Хүртээмж, навигац. Severity / priority: P2 (Дунд). Final status: VERIFIED.
- Affected feature: Footer харагдах нийтийн хуудсууд.
- Locations: src/components/site/SiteFooter.tsx:23.
- Initial behavior: Харагдах SVG лого screen reader-ээс нуугдсан боловч түүнийг ороосон Home холбоос нэргүй байсан.
- Expected behavior: Холбоосын зорилгыг туслах технологи уншиж таних.
- Reproduction: Нүүр, templates, contact хуудсанд axe-core-ийн link-name шалгалт ажиллуулах.
- Root cause: Текст логог SVG болгох үед эцэг холбоосын хүртээмжтэй нэрийг нөхөөгүй.
- Evidence: Анхны accessibility.json-д link-name зөрчил бүртгэгдсэн; дараах шалгалтад байхгүй.
- Proposed and actual correction: Холбоост AXORA нүүр хуудас руу буцах гэсэн aria-label өгсөн. Харагдах лого өөрчлөгдөөгүй.
- Tests: axe-core-ийн mobile/desktop шалгалт, browser дахь логоор нүүр рүү шилжих тест.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Present before the relevant correction.

## AXORA-BUG-004 — Зарим текстийн өнгө дэвсгэрээс хангалттай ялгараагүй

- Category: Хүртээмж, текстийн уншигдах байдал. Severity / priority: P2 (Дунд). Final status: VERIFIED.
- Affected feature: Нүүр, templates, admin login.
- Locations: src/components/home/foreground.css:232; src/app/cinematic.css:23; src/app/admin-refinement.css:4.
- Initial behavior: Нийтийн цэнхэр текстийн харьцаа 3.76:1, admin-ийн цайвар дэвсгэр дээрх lime текст 1.11:1, preview-ийн тайлбарууд 2.64–4.46:1 байсан.
- Expected behavior: Энгийн текст 4.5:1, том текст 3:1-аас багагүй ялгарах.
- Reproduction: 390 ба 1440 өргөнд axe-core color-contrast шалгалт ажиллуулах.
- Root cause: Өмнөх дэвсгэрт зориулсан accent өнгийг текстэд дахин ашиглаж, preview-ийн бичгийг хэт бүдэг болгосон.
- Evidence: accessibility.json-д анхны selector/харьцаанууд; accessibility-after.json болон эцсийн browser тестүүдэд батлагдсан зөрчилгүй.
- Proposed and actual correction: Зөвхөн асуудалтай текстийн өнгийг тухайн хэсэгт нь тохируулсан. Товчны fill, зураг, layout болон хөдөлгөөнийг өөрчлөөгүй.
- Tests: 6 үндсэн хуудсанд хоёр өргөнөөр axe-core; дараа нь production browser regression.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Present before the relevant correction.

## AXORA-BUG-005 — Утасны дугаарын шалгалт үсэгтэй утгыг зөвшөөрсөн

- Category: Өгөгдлийн баталгаажуулалт. Severity / priority: P2 (Дунд). Final status: VERIFIED.
- Affected feature: Contact, анкет, загварын хүсэлтийн browser/server шалгалт.
- Locations: src/lib/requests/validation.ts:3; src/lib/order/questions.ts:7; src/lib/requests/phone.ts:2.
- Initial behavior: abc88001234, 8800<script>1234 зэрэг утгыг зөв утас гэж үзсэн.
- Expected behavior: Ердийн зай, хаалт, зураас, улсын кодтой дугаарыг зөвшөөрч, үсэг болон markup-ийг татгалзах.
- Reproduction: Дээрх утгуудыг contactError, phoneOrEmailError болон анкетын q4 шалгалтад өгөх.
- Root cause: Тоон бус тэмдэгтийг арилгаад зөвхөн үлдсэн цифрийн тоог шалгасан.
- Evidence: Шинэ unit тест засварын өмнө унаж, дараа нь хүчинтэй/хүчингүй жишээнүүд давсан.
- Proposed and actual correction: Хоёр талд ашиглах нэг телефон syntax шалгалт нэмсэн; хүчинтэй форматтай дугааруудыг хэвээр зөвшөөрсөн.
- Tests: contact-validation.test.ts; contact API-д буруу утас 422 болох integration тест.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Present before the relevant correction.

## AXORA-BUG-006 — Нооргийн эхний засвар TypeScript-ийн зөрчил үүсгэсэн

- Category: Засварын явц дахь regression. Severity / priority: P3 (Бага). Final status: VERIFIED.
- Affected feature: TypeScript шалгалт, анкетын buildDraft.
- Locations: src/lib/order/draft.ts:14.
- Initial behavior: Эхний засварын дараа TS2322 гарсан. Санах ой дахь Answers төрөл undefined агуулж болох ч inferred record үүнийг хориглосон.
- Expected behavior: Одоо байгаа анкетын төрлийг зөв хүлээн авч, хадгалсан өгөгдлийн runtime шалгалтыг сулруулахгүй байх.
- Reproduction: AXORA-BUG-002-ийн эхний хэрэгжүүлэлтийн дараа npm run typecheck ажиллуулах.
- Root cause: Хоёр төрлийг intersection хийхэд нарийн index signature арилаагүй.
- Evidence: Засварын үеийн TS2322 баримт бүртгэгдсэн; эцсийн typecheck/build давсан. Production-д байршуулсан алдаа биш.
- Proposed and actual correction: Omit ашиглан inferred answers гишүүнийг зөв Answers төрлөөр сольсон. Ямар ч any, ts-ignore нэмж дараагүй.
- Tests: TypeScript, нооргийн regression тестүүд, эцсийн production build.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Introduced during the initial draft-parser implementation; corrected before delivery.

## AXORA-BUG-007 — Builder reset-ийн дараа хуучин лого буцаж гарсан

- Category: Асинхрон төлөвийн өрсөлдөөн. Severity / priority: P2 (Дунд). Final status: VERIFIED.
- Affected feature: /builder, хадгалсан лого сэргээх.
- Locations: src/components/builder/BuilderProvider.tsx:58.
- Initial behavior: Хуучин лого удаан сэргээгдэж байх үед reset хийхэд дууссан fetch нь хуучин логог буцаасан. Хуучин fetch алдаа өгөх нь шинэ логог хадгалалтаас арилгах эрсдэлтэй ижил салаа байсан.
- Expected behavior: Reset, хасах болон шинэ файл сонгох хамгийн сүүлийн үйлдэл хүчинтэй үлдэх.
- Reproduction: Хадгалсан data URL-ийн fetch-ийг саатуулаад reset хийх; мөн шинэ лого сонгосны дараа хуучин хүсэлтийг алдаагаар дуусгах.
- Root cause: Асинхрон хариу зөвхөн logo=null эсэхийг шалгасан; тухайн хариунаас хойших хэрэглэгчийн шийдвэрийг ялгаагүй.
- Evidence: logo-before.json-д reset-ийн дараа хуучин лого буцсан=true; эцсийн хоёр тест давсан.
- Proposed and actual correction: Логоны revision болон effect cleanup цуцлалтыг шалгаж, хуучирсан амжилт/алдаа шинэ төлөв болон хадгалалтад нөлөөлөхийг хориглосон.
- Tests: audit.spec.ts: delayed reset болон stale failure/new upload гэсэн хоёр regression тест.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Present before the relevant correction.

## AXORA-BUG-008 — Стандарт checklist зэрэг нэмэгдэхэд давхардсан

- Category: Admin өгөгдлийн бүрэн бүтэн байдал. Severity / priority: P2 (Дунд). Final status: VERIFIED.
- Affected feature: Admin төслийн стандарт ажлын жагсаалт.
- Locations: src/app/admin/project-actions.ts:9; src/lib/admin/standard-checklist.ts:8.
- Initial behavior: Хоёр хүсэлт хоёулаа хоосон жагсаалт харж, тус бүр 7 мөр нэмээд нийт 14 мөр үүсгэсэн.
- Expected behavior: Зэрэг даралт, хоёр tab-аас нэмэхэд нэг 7 мөртэй жагсаалт үүсэх.
- Reproduction: Бодит project_milestones schema дээр хоёр count=0 уншилтын дараа хоёр insert хийх.
- Root cause: Count болон insert нь тусдаа үйлдэл, шинэ мөрүүдийн UUID бүр санамсаргүй байсан.
- Evidence: checklist-before.json-д 14 мөр; засварын дараах disposable PostgreSQL тестэд 7 мөр. Production migration шаардахгүй.
- Proposed and actual correction: Стандарт алхамд project namespace дотор тогтвортой UUID өгдөг болсон. Одоо байгаа primary key нь давхар bulk insert-ийг бүхлээр нь хориглоно; action conflict хариу өгнө.
- Tests: standard-checklist.test.ts: хоёр зэрэг insert-ийн нэг нь 23505, эцсийн мөрийн тоо 7; өөр project тусдаа ID-тай.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Present before the relevant correction.

## AXORA-BUG-009 — Backend тохиргоогүй үед татах холбоос exception гаргасан

- Category: API-ийн алдааны төлөв. Severity / priority: P2 (Дунд). Final status: VERIFIED.
- Affected feature: /download/[token], GET ба POST.
- Locations: src/app/download/[token]/route.ts:2.
- Initial behavior: Зөв бүтэцтэй token серверийн түлхүүргүй орчинд adminClient exception-д хүргэсэн.
- Expected behavior: Үйлчилгээ бэлэн бишийг 503 хуудсаар тайлбарлаж, нууц мэдээлэл задлахгүй байх.
- Reproduction: Тусгаарласан тестэд серверийн түлхүүрийг түр тохиргоогүй болгоод 64 hex token-оор handler дуудах; сүлжээний хүсэлт хийхгүй.
- Root cause: Бусад public API-аас ялгаатай нь backend тохиргооны guard байхгүй байсан.
- Evidence: Засварын өмнө Supabase server key is not configured алдаа; дараа нь бүх нөхцөл давсан.
- Proposed and actual correction: GET/POST-д backend guard нэмсэн. Буруу token 404, өөр origin-ийн POST 403, нэг удаагийн таталтын логик хэвээр.
- Tests: download-availability.test.ts: 503/no-store, нууцгүй хариу, 404 ба 403 нөхцөл.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Present before the relevant correction.

## AXORA-BUG-010 — English Words admin хуудсанд үндсэн агуулгын landmark байгаагүй

- Category: Хүртээмж, гарын навигац. Severity / priority: P3 (Бага). Final status: VERIFIED.
- Affected feature: /admin/english-words.
- Locations: src/app/admin/(panel)/english-words/page.tsx:10; src/app/admin/(panel)/error.tsx:4.
- Initial behavior: Хуудасны мэдээлэл харагдавч main landmark болон глобал skip холбоосын #main байгаагүй.
- Expected behavior: Ачаалж буй, алдаатай, амжилттай бүх төлөв нэг үндсэн агуулгын бүстэй байх.
- Reproduction: Нэвтэрсэн fixture browser-аар /admin/english-words нээгээд main landmark шалгах.
- Root cause: Хуудас main wrapper-гүй Suspense/div буцаасан.
- Evidence: Өргөтгөсөн тест анх zero main гэж унасан; эцсийн matrix давсан.
- Proposed and actual correction: Padding/layout-ийг өөрчлөхгүй main#main, tabIndex=-1 wrapper нэмсэн. Холбогдох admin error boundary-ийн main-д мөн #main, tabIndex=-1 нэмсэн; error boundary-г зориуд runtime-аар унагаах тусдаа тест ажиллуулаагүй.
- Tests: Бүх admin хуудсын landmark болон 15 өргөний production browser matrix.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Present before the relevant correction.

## AXORA-BUG-011 — Далд хүснэгт 320px dashboard-ийг өргөсгөсөн

- Category: Responsive layout. Severity / priority: P3 (Бага). Final status: VERIFIED.
- Affected feature: /admin, 320px.
- Locations: src/components/admin/DashboardInsights.tsx:107.
- Initial behavior: Screen reader-ийн хүснэгт дотоод minimum өргөнөөсөө болж 321.484375px хүрч, хуудсанд хэвтээ overflow үүсгэсэн.
- Expected behavior: Туслах технологийн хүснэгт хэвээр байж, хуудасны өргөнд нөлөөлөхгүй байх.
- Reproduction: Нэвтэрсэн admin dashboard-ийг 320px болгоод scrollWidth/innerWidth болон хүснэгтийн geometry шалгах.
- Root cause: sr-only-г table дээр шууд тавихад intrinsic table layout нь 1px clipping box-ийн өргөнийг баримтлаагүй.
- Evidence: overflow-_admin-320.json/PNG болон хоёр давтагдсан тестийн уналт; засварын дараа matrix бүхэлдээ давсан.
- Proposed and actual correction: Semantic хүснэгтийг өөрчлөхгүй, sr-only clipping-ийг гаднах block wrapper-т шилжүүлсэн. Global overflow-x-hidden нэмээгүй.
- Tests: Тусдаа geometry diagnostic, дараа нь бүх 240 admin layout нөхцөлтэй production browser matrix.
- Verification: final 35 unit/database tests + 19 production browser tests passed; TypeScript passed.
- History: DISCOVERED → reproduced/registered → FIXING → FIXED → VERIFIED on 2026-11-24. Present before the relevant correction.

## AXORA-BUG-012 — Dropdown trigger-ээсээ зүүн тийш шилжсэн

- Category: Layout / navigation. Priority: P2. Status: VERIFIED, 2026-11-25.
- Reproduction/evidence: Header-ийн Бусад товчийг нээх; baseline-ui.json-д trigger баруун зах 969px байхад menu 925px-д төгсөж, y98-д байрласан.
- Root cause: backdrop-filter бүхий header нь fixed элементийн containing block болсон.
- Correction: body portal, viewport дотор clamp/flip, 10px зай, opaque navy surface. Keyboard, Escape, outside press хэвээр.
- Verification: Chromium/WebKit desktop geometry + keyboard test; after/dropdown-*.png.

## AXORA-BUG-013 — Marketplace skeleton ногоон өнгөтэй байсан

- Category: Visual consistency. Priority: P4. Status: VERIFIED; runtime CSS, reduced-motion and forced-colors checks passed, 2026-11-25.
- Root cause: Dark skeleton tokens #1b2520/#28342d нь интерфэйсийн navy өнгөтэй зөрсөн.
- Correction: Light neutral #e7ecf2/#f4f7fa, dark navy #162031/#29384d; public theme override мөн ижил.
- Verification: globals.css/cinematic.css centralized tokens, production compilation; reduced-motion animation override.

## AXORA-BUG-014 — Каталогийн шүүлтүүрүүд шахцалдсан

- Category: Responsive layout. Priority: P3. Status: VERIFIED, 2026-11-25.
- Evidence: Хэрэглэгчийн marketplace screenshot; тусдаа ангилал, үнэ, хадгалсан сонголтуудын hierarchy сул байсан.
- Correction: Desktop fieldset-үүд, mobile BottomSheet, active count, цэвэрлэх/үр дүн харах; URL/search/sort/favorite/comparison хэвээр.
- Verification: Fixture-ийн 6 бүтээгдэхүүн дээр үнэ шүүж 3 үр дүн болохыг Chromium 10, WebKit 3 өргөнд шалгасан.

## AXORA-BUG-015 — Builder-ийн доор 1000px гаруй хоосон зай гарсан

- Category: Overflow / layout. Priority: P2. Status: VERIFIED, 2026-11-25.
- Evidence: 1440×1000 baseline-д main bottom 1020 боловч documentHeight 2160; далд file input y2159-д байрласан.
- Root cause: Absolute sr-only input-д дотоод positioned containing block байгаагүй; desktop workspace viewport хэмжээнд тохироогүй.
- Correction: Sidebar position:relative, desktop height max(480px,100dvh−240px); тусдаа sidebar/preview native scrolling хадгалсан.
- Verification: Chromium/WebKit desktop documentHeight 1000px, workspace bottom 964–968px. Global scroll disable хэрэглээгүй.

## AXORA-BUG-016 — Native scrollbar-ууд зузаан, сумтай, хоорондоо зөрүүтэй байсан

- Category: Visual consistency / scrolling. Priority: P4. Status: VERIFIED, 2026-11-25.
- Evidence: Хэрэглэгчийн хоёр scrollbar crop screenshot.
- Correction: Нийтлэг thin native scrollbar, navy/neutral thumb, transparent track, WebKit arrow reset, nested 6px, forced-colors fallback. Native drag/wheel/keyboard хэвээр.
- Verification: Chromium/WebKit responsive layout болон computed scrollbar-width:thin; screenshots.

## AXORA-BUG-017 — Үнийн санал зөвшөөрөгдөхөөс өмнө төлбөрийн заавар харагдсан

- Category: Payment workflow. Priority: P2. Status: VERIFIED, 2026-11-25.
- Root cause: OrderPayment нь amount null үед ч PaymentInstructions render хийсэн; хэрэглэгчийн acceptance үе шат байгаагүй.
- Correction: Post-submit нь private tracking холбоос; customer accepted quote + verified bank snapshot таарсан үед л банк харагдана. Reported ≠ paid.
- Verification: Real SQL + browser full lifecycle; draft үед банк байхгүй, accepted үед гарч, админ exact amount батлахад л paid болсон.

## AXORA-BUG-018 — Хэрэглэгчийн энгийн урсгалд JSON export гарсан

- Category: Customer UX. Priority: P3. Status: VERIFIED, 2026-11-25.
- Evidence: Payment screenshot болон OrderForm/OrderPayment customer download handler.
- Correction: Customer JSON download handler, button, test-mode copy-г хассан. Админы зориулалтын prompt/data tools хадгалсан.
- Verification: Customer components source search + delivered tracking browser page-д JSON UI байхгүй.

## AXORA-BUG-019 — Данс эзэмшигч дутуу ч банкны заавар идэвхтэй байсан

- Category: Payment instructions. Priority: P2. Status: VERIFIED, 2026-11-25.
- Root cause: PaymentInstructions зөвхөн bank.name && bank.account шалгасан.
- Correction: Holder мөн заавал; шинэ урсгалд банк/данс/эзэмшигчийн validation + admin verification + published-bank equality.
- Verification: SQL bank_not_verified rejection, accepted quote gate, local browser fixture-ийн бүтэн банкны мэдээлэл.

## AXORA-BUG-020 — Каталог нийтлэх шалгалт буруу PostgreSQL array cast хийсэн

- Category: Database / validation. Priority: P2. Status: VERIFIED, 2026-11-25.
- Reproduction: short_description/file дутуу published template INSERT хийхэд 22P02: Array value must start with "{" гарсан.
- Root cause: missing text[] || 'short_description' нь scalar text-ийг array literal гэж тайлбарласан.
- Correction: Өмнөх migration-ийг өөрчлөхгүй 20261125100000_catalog_publish_guard.sql-д array_append ашигласан.
- Verification: Disposable real PostgreSQL дээр одоо publish_requirements гэсэн зөв P0001 validation; бүрэн мэдээлэлтэй fixture products нийтлэгдэж шүүлтүүрт орсон.

## AXORA-BUG-021 — Захиалгын түүхийн огноо React hydration зөрчил үүсгэсэн

- Category: SSR / localization. Priority: P2. Status: VERIFIED, 2026-11-25.
- Evidence: Full browser lifecycle test React #418 text mismatch-ээр унасан; төлбөр, хүргэлт, 5 SMTP message амжилттай байсан ч client/server огноо өөр форматтай байсан.
- Root cause: Node/browser ICU-ийн mn-MN default toLocaleString формат ялгаатай.
- Correction: Нэг shared workflowTime функцээр ISO-д тулгуурласан Asia/Ulaanbaatar YYYY-MM-DD HH:mm:ss (УБ) текст гаргана. Hydration warning-г дараагүй.
- Verification: Final full lifecycle production browser test pageerror=[]; огноотой customer/admin түүх, actual-start rendering хэвээр.

## AXORA-BUG-022 — Анкетын шинэ талбаруудын admin prompt-д undefined дугаар гарсан

- Category: Admin prompt / questionnaire integration. Priority: P3. Status: VERIFIED, 2026-11-25.
- Evidence: Browser trace-ийн admin prompt-д “undefined. Нийт хуудасны тоо: 1” болон бусад шинэ талбарын undefined prefix харагдсан.
- Root cause: Шинэ optional талбарууд n дугааргүй боловч prompt formatter үргэлж f.n хэвлэсэн.
- Correction: Дугаартай хуучин 39 асуултаа хэвээр хадгалж, шинэ дугааргүй талбаруудыг label-ээр хэвлэнэ.
- Verification: Actual buildOrderPrompt unit assertion нь qPages=1-г багтааж, undefined. prefix байхгүйг шалгасан.

## AXORA-BUG-023 — Хадгалсан анкетыг quotation migration дутуугаас илгээлтийн алдаа болгосон

- Category: Intake / partial failure. Priority: P2. Status: VERIFIED, 2026-11-25.
- Evidence: Хэрэглэгчийн screenshot; live read-only query website_workflow_settings хүснэгтэд PGRST205 буцаасан. create_website_order амжилттай болсны дараах initializeWorkflow catch HTTP 503 буцааж, upload ticket алхмыг алгассан.
- Root cause: Үнийн саналын дараагийн ажиллагааны бэлэн байдлыг аль хэдийн commit болсон анкетын амжилттай төлөвтэй хольсон.
- Correction: Saved intake нь 201/200 + reference/upload grant/tickets хэвийн буцаана; quotationStatus=pending, customer success тайлбар, серверийн durable marker, migration бэлэн болсны дараах worker recovery. Duplicate хүсэлт нэг orderId-гаар үргэлжилнэ, өмнөх хариултууд хадгалагдана.
- Verification: New disposable browser/API regression + normal intake regression: 2 passed; build/typecheck/targeted lint passed. Missing settings → saved + pending + attachment ticket → restore settings → one recovered quote → duplicate retry ready. Live database-д SQL/data write хийгээгүй.

## AXORA-BUG-024 — Төлбөр батлах хэсэг dialog болоогүй

- Түвшин: P1. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: AdminOrderWorkflow inline div; cancel болон customer note байхгүй.
- Файл: src/components/admin/AdminOrderWorkflow.tsx; src/components/ui/BottomSheet.tsx; supabase/migrations/20261125200000_workflow_recovery.sql
- Дахин үүсгэх: Reported test order → admin → төлбөр баталгаажуулах.
- Засвар: BottomSheet dialog, нэр/байгууллага/email/ref, нэг date, workload, тайлбар, cancel/confirm; note DB/customer/email-д холбосон.
- Шалгалт: Browser lifecycle: role=dialog, date override, cancel/reopen, note refresh.
- Нотолгоо: qa-evidence/axora-upgrade/workflow/admin-payment-dialog.png

## AXORA-BUG-025 — Үнийн саналын хуудас/функцийн тойм дутуу

- Түвшин: P2. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: QuoteBreakdown зөвхөн мөнгөн мөрүүдтэй; requirements snapshot дэлгэцэд гараагүй.
- Файл: src/components/order/CustomerOrderWorkflow.tsx
- Дахин үүсгэх: Customer official quotation нээх.
- Засвар: Snapshot-оос багц/хуудас/нэмэлт хуудас/selected features харуулна; legacy missing утгыг зохиохгүй.
- Шалгалт: Actual form → official quote browser screenshot.
- Нотолгоо: qa-evidence/axora-upgrade/workflow/customer-quote.png

## AXORA-BUG-026 — Lifecycle имэйлийн subject ба агуулга буруу

- Түвшин: P1. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: Шаардсан payment subject биш; actual state/start/completion/thank-you дутуу.
- Файл: src/lib/order-workflow/email.ts; src/lib/order-workflow/email-message.ts
- Дахин үүсгэх: Admin payment/start/complete action.
- Засвар: Нэг formatter; exact subject, Монгол төлөв, approved deadline, actual timestamps, tracking/thank-you.
- Шалгалт: Unit + local SMTP protocol accepted 5 message-ийн decoded body assertions.
- Нотолгоо: qa-evidence/axora-upgrade/workflow/smtp-accepted.json

## AXORA-BUG-027 — SMTP Message-ID хадгалагдаагүй

- Түвшин: P2. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: SMTP acknowledgement ирсэн ч outbox-д message identifier байхгүй.
- Файл: src/lib/order-workflow/email.ts; supabase/migrations/20261125210000_email_receipts.sql
- Дахин үүсгэх: Verified payment → outbox харах.
- Засвар: Service-only, active lease-д холбогдсон receipt RPC; admin-only Message-ID; receipt алдаанаас болж дахин email илгээхгүй.
- Шалгалт: SQL stale lease/permission + browser 5 SMTP Message-ID.
- Нотолгоо: qa-evidence/axora-upgrade/workflow/smtp-accepted.json

## AXORA-BUG-028 — SMTP readiness origin-ийг шалгаагүй

- Түвшин: P2. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: SMTP user/password байвал tracking origin дутуу ч тохируулсан гэж харагдсан.
- Файл: src/app/admin/(panel)/settings/page.tsx
- Дахин үүсгэх: Admin Settings → холболтууд.
- Засвар: SMTP credentials ба NEXT_PUBLIC_SITE_URL хоёуланг шалгана; accepted ≠ inbox delivered тайлбар.
- Шалгалт: Settings browser render + read-only environment probe; live false branch admin accessгүй.
- Нотолгоо: qa-evidence/axora-upgrade/live-schema-readonly.json

## AXORA-BUG-029 — Өөрчлөлт хүсэх товчны нэр зөрсөн

- Түвшин: P3. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: Customer page-д Засвар хүсэх гэж гарсан.
- Файл: src/components/order/CustomerOrderWorkflow.tsx
- Дахин үүсгэх: Official quote → Өөрчлөлт хүсэх.
- Засвар: Шаардсан Өөрчлөлт хүсэх нэрийг хэрэглэж үйлдлийг хэвээр хадгалсан.
- Шалгалт: Mobile browser submit/reload/admin request assertion.
- Нотолгоо: qa-evidence/axora-upgrade/mobile/customer-revision.png

## AXORA-BUG-030 — Анкетын submit шууд төлбөр амласан

- Түвшин: P3. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: Илгээгээд төлбөр рүү үргэлжлүүлэх гэсэн нэртэй, admin quotation review-ийг алгассан ойлголт өгсөн.
- Файл: src/components/order/OrderForm.tsx
- Дахин үүсгэх: 7-step form review.
- Засвар: Анкет илгээх гэж өөрчилсөн; бодит draft quotation урсгалтай тохирсон.
- Шалгалт: Actual UI questionnaire submit 201.
- Нотолгоо: qa-evidence/axora-upgrade/workflow/questionnaire-review.png

## AXORA-BUG-031 — Schedule fetch exception busy-г тайлаагүй

- Түвшин: P2. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: prepare() try/finallyгүй тул server-action network exception дараа товч disabled үлдэх эрсдэлтэй.
- Файл: src/components/admin/AdminOrderWorkflow.tsx
- Дахин үүсгэх: Payment reported → schedule action request-г abort.
- Засвар: catch-д алдааны тайлбар; finally-д busy=false; дахин товшиж санал авах боломжтой.
- Шалгалт: Browser explicitly aborts first POST; error visible, button enabled, second attempt succeeds.
- Нотолгоо: qa-evidence/axora-upgrade/workflow/admin-payment-dialog.png

## AXORA-BUG-032 — Workflow RPC байхгүй үед admin хэсэг чимээгүй алга болсон

- Түвшин: P1. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: workflow && component нөхцөл null RPC response-г тайлбаргүй нуусан.
- Файл: src/app/admin/(panel)/orders/[id]/page.tsx
- Дахин үүсгэх: Fixture workflow RPC=PGRST202 → order detail.
- Засвар: Анкет хадгалсан, quotation workflow холбогдоогүй гэдгийг admin-д ил тод харуулсан.
- Шалгалт: BEFORE assertion failed; AFTER same assertion passes.
- Нотолгоо: qa-evidence/axora-upgrade/before/admin-missing-workflow.png; qa-evidence/axora-upgrade/after/admin-missing-workflow.png

## AXORA-BUG-033 — Шилжүүлэг батлах panel-д дүн/банк/утга давтагдаагүй

- Түвшин: P2. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: Confirmation panel зөвхөн optional reference/note харуулсан; amount/bank/ref өмнөх panel-д байсан.
- Файл: src/components/order/CustomerOrderWorkflow.tsx
- Дахин үүсгэх: Accepted quote → төлбөр мэдэгдэх → confirmation.
- Засвар: Confirmation дотор amount, real order reference, bank, instruction харуулна.
- Шалгалт: Browser confirmation region contains bank and captured actual screenshot.
- Нотолгоо: qa-evidence/axora-upgrade/workflow/customer-transfer-confirmation.png

## AXORA-BUG-034 — Үнэ хадгалахад банкны баталгаажилт арилсан

- Түвшин: P1. Төлөв: VERIFIED_LOCAL. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: JSON.stringify object key-order ялгааг банкны өөрчлөлт гэж үзсэн. parseContent bank=name/account/holder; JSONB verified snapshot=name/holder/account.
- Файл: src/app/admin/(panel)/settings/page.tsx
- Дахин үүсгэх: Accept quote → settings price save → customer reload → bank hidden.
- Засвар: Validated банкны name/holder/account-ийг тус бүрээр нь харьцуулна; pricing-only save банкны verified snapshot-г арилгахгүй.
- Шалгалт: Before screenshot; strengthened pricing browser asserts account stays visible, old price frozen, new price current; following lifecycle passes.
- Нотолгоо: qa-evidence/axora-upgrade/before/bank-cleared-after-pricing.png; qa-evidence/axora-upgrade/workflow/accepted-price-frozen.png

## AXORA-BUG-035 — Live workflow schema API-д бэлэн биш

- Түвшин: P1. Төлөв: ENVIRONMENT_BLOCKED. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: Таван required public table-ийн read-only REST probe HTTP404/PGRST205. SQL migration history унших DATABASE_URL байхгүй.
- Файл: supabase/migrations/20261125000000_order_workflow.sql; supabase/migrations/20261125200000_workflow_recovery.sql; supabase/migrations/20261125210000_email_receipts.sql
- Дахин үүсгэх: Live read-only schema probe.
- Засвар: Локал disposable PostgreSQL дээр migration баталсан. Холбогдсон DB-д migration applied гэж тэмдэглээгүй.
- Шалгалт: HTTP status/code evidence; no live SQL/data write.
- Нотолгоо: qa-evidence/axora-upgrade/live-schema-readonly.json

## AXORA-BUG-036 — Live имэйлийн tracking origin дутуу

- Түвшин: P1. Төлөв: ENVIRONMENT_BLOCKED. Огноо: 2026-11-25.
- Анхны байдал / шалтгаан: SMTP credentials байгаа ч NEXT_PUBLIC_SITE_URL байхгүй; worker mail claim хийхээс өмнө configured=false.
- Файл: src/lib/order-workflow/email.ts; .env.example
- Дахин үүсгэх: Live environment configuration probe.
- Засвар: Missing-config readiness тайлбар зассан; жинхэнэ sender/inbox хүргэлтийг зохиогоогүй.
- Шалгалт: SMTP sandbox accepted verified; real inbox delivery UNVERIFIED.
- Нотолгоо: qa-evidence/axora-upgrade/live-schema-readonly.json

## AXORA-BUG-037 — Богино viewport-д notification popover тасарсан

- Түвшин: P2. Төлөв: VERIFIED_LOCAL.
- Анхны байдал/шалтгаан: Popover-ийн 488px өндөр нь 300px viewport-д y=61-ээс 549px хүртэл гарч, жагсаалт дотроо scroll хийхгүй байсан.
- Файл: src/app/admin-refinement.css
- Дахин үүсгэх: 1440×300 admin → notification товч.
- Засвар: Radix available-height-аар parent max-height тогтоож flex/min-height:0-ээр зөвхөн ul жагсаалтыг дотроо гүйлгэдэг болгосон.
- Шалгалт: BEFORE bbox.bottom=549; AFTER bbox.bottom=284.5, list clientHeight=81/scrollHeight=345, thin scrollbar, scrollTop өөрчлөгдөнө; 300/1000px browser regression 2 passed.
- Нотолгоо: qa-evidence/axora-upgrade/before/notification-short-viewport.png; qa-evidence/axora-upgrade/after/notification-short-viewport.png; qa-evidence/axora-upgrade/notification-before.json; qa-evidence/axora-upgrade/notification-after.json; qa-evidence/axora-upgrade/notification-tests.log

## AXORA-BUG-038 — Анкетын success receipt үнийн саналын өмнө төлбөрийн copy харуулсан

- Түвшин/төлөв: P3, VERIFIED_LOCAL.
- Шалтгаан: Шинэ order хадгалагдаад amount=null байх үед shared OrderPayment нь Хэрхэн төлөх вэ?, Төлөх дүн, Төлөгдөөгүй гэсэн хуучин payment copy хэрэглэж байсан.
- Файл: src/components/order/OrderPayment.tsx
- Дахин үүсгэх: Questionnaire UI → saved receipt, quotation schema unavailable эсвэл official price хараахан үүсээгүй.
- Засвар: awaitingQuote төлөвөөр quotation preparation heading/status/summary гаргана. Amount-тай legacy төлбөрийн rendering хэвээр.
- Шалгалт: Pending UI expects Үнийн санал бэлтгэж байна and no Хэрхэн төлөх вэ?; legacy paid/unpaid two browser regressions.
- Нотолгоо: qa-evidence/axora-upgrade/before/receipt-premature-payment-copy.png; qa-evidence/axora-upgrade/after/intake-pending-success.png; qa-evidence/axora-upgrade/pending-ui-test.log

## AXORA-BUG-039 — Optical package буруу rendering mode сонгосон

- P2, VERIFIED_LOCAL. Child байхгүй эсвэл filterResolution өгсөн нь upstream GlassMaterial dispatch-ийг алгассан.
- Засвар: AxoraGlass нь hidden child, live=false, зөвхөн optics preset ашиглана.
- Нотолгоо: qa-evidence/real-liquid-glass/browsers/results.json; actual Material, SVG map/filter URL болон rendered pixel ablation.

## AXORA-BUG-040 — CSS prefix ordering бодит гаднах refraction-ийг хаасан

- P2, VERIFIED_LOCAL. Optimizer standard property-гийн араас prefix ирэхэд зөвхөн -webkit-backdrop-filter үлдээж, Chrome-д хуучин host blur ажилласан.
- Засвар: prefix эхэлж, standard property сүүлд; host backdrop-filter none. Decorative engine filter нь child дээр дангаараа байна.
- Нотолгоо: audit-real-glass.mjs host computed-none assertion, гаднах diagnostic grid-ийн pixel proof.

## AXORA-BUG-041 — Цайвар backdrop дээр dock contrast хангалтгүй

- P2, VERIFIED_LOCAL. 11px label 2.8–4.39:1 болсон.
- Засвар: navigation tint alpha .84; original route/semantic controls хэвээр.
- Нотолгоо: after/ecosystem-browser.log — contrast suite болон нийт 19 browser regression passed.

## AXORA-BUG-042 — ResizeObserver байхгүй үед legacy visual code crash

- P2, VERIFIED_LOCAL production fallback. Hands scene/footer/Builder observer guard, existing SVG logo fallback нэмсэн.
- Artwork, rig geometry, scroll painting болон animation parameters өөрчлөгдөөгүй. scene.js source hash нь optional API guard-аар өөрчлөгдсөн.
- Нотолгоо: qa-evidence/real-liquid-glass/browsers/audit.log, missing-API production probe. DevTools өөрийн ResizeObserver ашигладаг тул хиймэл missing-API probe-ийг Next dev дээр pass гэж тайлагнаагүй.
