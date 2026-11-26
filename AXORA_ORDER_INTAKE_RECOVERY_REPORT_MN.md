# Анкет хадгалагдсаны дараах үнийн саналын алдаа — 2026-11-25

## Батлагдсан шалтгаан

Холбогдсон Supabase санд зөвхөн унших шалгалт хийсэн. `website_workflow_settings` хүснэгтийн хүсэлт `PGRST205: Could not find the table public.website_workflow_settings in the schema cache` буцаасан. Шинэ үнийн саналын migration хэрэгжээгүй байна. DATABASE_URL тохируулаагүй тул энэ засварын үеэр live database-д SQL ажиллуулаагүй.

`/api/orders` нь анкетыг амжилттай хадгалсны дараа quotation initialize алдахад HTTP 503 буцааж, signed upload ticket-үүдийг ч үүсгэлгүй тасалж байсан. Ингэснээр хэрэглэгч хадгалсан захиалгаа амжилтгүй гэж ойлгон дахин илгээх нөхцөл үүссэн.

## Засвар

- Хадгалалт дууссан бол quotation-ийн алдаагаар илгээлтийг буцаахгүй. Created/duplicate төлөв, захиалгын дугаар, upload grant болон attachment ticket-үүдийг хэвийн буцаана.
- `quotationStatus: pending` эсвэл `ready` гэж ялгана. Бодит tracking token үүссэн үед л холбоос харуулна. Зохиомол үнэ/токен/баталгаажуулалт үүсгэхгүй.
- Customer result дэлгэц нь анкет хүлээн авсныг баталж, үнийн санал бэлтгэж байгааг тайлбарлана. Дахин илгээхийг шаардахгүй.
- Шинэ хүсэлтэд `answers.quotation_requested=true` гэсэн серверийн durable marker хадгална. Өмнөх алдаатай duplicate хүсэлтийг дахин ирэхэд хуучин answers-ийг хадгалан, updated_at харьцуулж marker нөхнө.
- Worker болон хамгаалсан `/api/jobs/orders` нь migration бэлэн болсны дараа зөвхөн marker-тэй, workflow эхлээгүй шинэ захиалгын саналыг нөхөж үүсгэнэ. Хуучин захиалгуудыг бөөнөөр хөрвүүлэхгүй, зөвшөөрсөн үнэ өөрчлөхгүй. SQL initialize-ийн lock/version хамгаалалт давхар quote үүсэхээс сэргийлнэ.

Өөрчилсөн гол файлууд: `src/app/api/orders/route.ts`, `src/lib/order-workflow/recovery.ts`, `src/app/api/jobs/orders/route.ts`, `scripts/order-worker.ts`, order response/receipt төрлүүд, `OrderForm.tsx`, `OrderPayment.tsx`, disposable fixture болон `intake-recovery.spec.ts`.

## Шалгалт

Шинэ тусгаарласан тестэд quotation settings-ийн PGRST205 нөхцөл үүсгэж, анкет 201, давтан хүсэлт 200 болж нэг orderId буцаах, upload grant/attachment ticket хадгалагдах, quote байхгүй үед pending төлөвтэй байх, settings сэргээсний дараа worker нэг quote үүсгэх, дахин хүсэлт ready төлөвтэй болохыг шалгасан. Эцсийн targeted browser/API үр дүн: **2 passed**, үүнд шинэ recovery болон өмнөх normal intake тест багтсан. Production build мөн амжилттай. Fixture-д Storage service ажиллуулахгүй тул signed upload token биш, хадгалсан attachment binding/ticket болон upload grant-ийг шалгасан.

TypeScript болон өөрчилсөн файлуудын ESLint шалгалт алдаагүй. Бодит хэрэглэгчийн захиалгыг тестээр шинээр илгээгээгүй, live database-д migration/өгөгдлийн өөрчлөлт хийгээгүй.

Автомат үнийн саналын бүх боломж live санд ажиллахад `20261125000000_order_workflow.sql` migration болон worker scheduler шаардлагатай хэвээр. Энэ засвар нь хийгдсэн хадгалалтыг алдаа гэж буцаах доголдлыг арилгаж, дараа нөхөх ажиллагааг холбосон.
