import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Нууцлал ба мэдээлэл ашиглалт",
  description: "AXORA таны илгээсэн мэдээлэл, файлыг ямар зорилгоор ашиглах тухай.",
};

const H2 = "mt-8 text-xl font-extrabold tracking-tight";
const P = "mt-2 text-[15px] leading-relaxed text-muted";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader mobileBack={{ href: "/", label: "Нүүр рүү буцах", title: "Нууцлал" }} />
      <main id="main" className="mx-auto max-w-[860px] px-5 pt-8 pb-16 min-[900px]:px-10 min-[900px]:pt-14 min-[900px]:pb-24">
        <header>
          <p className="text-sm font-extrabold tracking-[0.08em] text-brand uppercase">AXORA</p>
          <h1 className="mt-2 text-[34px] leading-tight font-extrabold tracking-[-0.03em] min-[900px]:text-5xl">Нууцлал ба мэдээлэл ашиглалт</h1>
          <p className={P}>Энэ хуудсанд AXORA-д хүсэлт илгээх үед таны мэдээллийг хэрхэн ашигладгийг энгийнээр тайлбарлав.</p>
        </header>

        <section>
          <h2 className={H2}>Ямар мэдээлэл авдаг вэ?</h2>
          <p className={P}>Холбоо барих зурваст нэр, холбоо барих мэдээлэл, таны бичсэн зурвас орно. Загвар авах хүсэлтэд нэр, сонгосон холбоо барих суваг, холбоо барих мэдээлэл болон таны нэмэлт тэмдэглэл орж болно.</p>
          <p className={P}>Веб захиалгын анкетад таны нэр, утас, имэйл, бизнесийн мэдээлэл, вебийн шаардлага, тохиргоо болон хавсаргасан файл орж болно. Файл хавсаргах нь сонголттой.</p>
        </section>

        <section>
          <h2 className={H2}>Ямар зорилгоор ашиглах вэ?</h2>
          <p className={P}>Илгээсэн мэдээллийг хүсэлтэд хариу өгөх, ажлын хэрэгцээг ойлгох, үнийн санал бэлтгэх, загварын хүсэлтийг боловсруулах, захиалгатай холбоотойгоор тантай холбогдоход ашиглана. Таны анкетын мэдээлэл эсвэл файлыг зөвшөөрөлгүйгээр нийтлэх зориулалтгүй.</p>
        </section>

        <section>
          <h2 className={H2}>Хаана хадгалж, хэн үзэх вэ?</h2>
          <p className={P}>Бодит горимд илгээсэн хүсэлт, анкет болон файлыг AXORA-ийн Supabase өгөгдлийн сан, хамгаалалттай файл хадгалах сан боловсруулна. Зөвхөн AXORA-ийн эрх олгосон админ хүсэлтийг удирдах зорилгоор үзэх боломжтой.</p>
          <p className={P}>Анкетын ноорог таны төхөөрөмж дээр түр хадгалагдаж болно. Урт хугацаанд хадгалах сонголтыг та өөрөө идэвхжүүлсэн тохиолдолд л төхөөрөмжийн local storage-д хадгална. Сайттай холболтгүй туршилтын горимд илгээх үйлдэл мэдээллийг серверт хадгалахгүй.</p>
        </section>

        <section>
          <h2 className={H2}>Хадгалалтын хугацаа</h2>
          <p className={P}>Мэдээлэл болон файлыг хадгалах тодорхой хугацааг AXORA одоогоор тогтоогоогүй байна. Иймээс шаардлагагүй болсон хүсэлт, файлыг хэзээ устгах талаар тодорхой амлалт өгөх боломжгүй. Хадгалалтын хугацааг тогтоосны дараа энэ хуудсыг шинэчилнэ.</p>
        </section>

        <section>
          <h2 className={H2}>Мэдээллээ өөрчлүүлэх эсвэл устгуулах хүсэлт</h2>
          <p className={P}>Илгээсэн мэдээллийн талаар асуух, засуулах, устгуулах хүсэлтээ <a href="/contact" className="ax-link font-bold text-ink">Холбоо барих</a> хуудсаар илгээнэ үү. Хүсэлтийг тань шалгаж, боломжтой арга хэмжээг хариу мэдэгдэнэ.</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
