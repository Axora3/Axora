import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CircleCheck, Globe, LayoutGrid, Package, Search, Settings } from "lucide-react";
import { DialogDemo, DropdownDemo, LoadingButtonDemo, MotionDemo, SelectDemo, TabsDemo, TooltipDemo } from "@/components/design-system/InteractiveDemos";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Field, Input, Textarea, fieldDescribedBy } from "@/components/ui/input";
import { LoadingState, Spinner } from "@/components/ui/loading-state";
import { NativeSelect } from "@/components/ui/native-select";
import { Sidebar, SidebarGroup, SidebarLink } from "@/components/ui/sidebar";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Design system (dev)", robots: { index: false, follow: false } };

const SWATCHES: { title: string; items: [string, string][] }[] = [
  { title: "Брэнд", items: [["Primary", "--ax-primary"], ["Primary hover", "--ax-primary-hover"], ["Brand (текст)", "--ax-brand"], ["Accent / Lime", "--ax-lime"], ["Band", "--ax-band"]] },
  { title: "Гадаргуу", items: [["Page", "--ax-bg"], ["Sunken", "--ax-sunken"], ["Surface", "--ax-surface"], ["Elevated", "--ax-elevated"], ["Soft", "--ax-soft"]] },
  { title: "Текст ба хүрээ", items: [["Ink", "--ax-ink"], ["Muted", "--ax-muted"], ["Faint", "--ax-faint"], ["Line", "--ax-line"], ["Line strong", "--ax-line-strong"]] },
  { title: "Төлөв", items: [["Success", "--ax-success"], ["Info", "--ax-info"], ["Warning", "--ax-warn"], ["Danger", "--ax-danger"], ["Neutral", "--ax-neutral"]] },
  { title: "Forest ramp", items: [["50", "--ax-forest-50"], ["100", "--ax-forest-100"], ["300", "--ax-forest-300"], ["500", "--ax-forest-500"], ["700", "--ax-forest-700"], ["800", "--ax-forest-800"], ["950", "--ax-forest-950"]] },
  { title: "Citron ramp", items: [["100", "--ax-citron-100"], ["300", "--ax-citron-300"], ["400", "--ax-citron-400"], ["600", "--ax-citron-600"], ["900", "--ax-citron-900"]] },
];

const TYPE: [string, string][] = [
  ["ax-display", "Display"],
  ["ax-h1", "H1 — Өөрийн вебсайтаа бүтээ"],
  ["ax-h2", "H2 — Бэлэн загвар ба захиалгат веб"],
  ["ax-h3", "H3 — Өргөн сонголт, үнэн зөв мэдээлэл"],
  ["ax-h4", "H4 — Төлбөрийн нөхцөл"],
  ["ax-lead", "Lead 17 — Монгол бичвэрийн Ө, Ү, ө, ү үсгүүд бусадтайгаа нэг фонтоор харагдана."],
  ["ax-body", "Body 15 — Өнөөдөр бүтээгдэхүүнээ үзүүлэх үүрэгтэй вебсайтаа түргэн хугацаанд үүсгээрэй."],
  ["text-sm", "Small 14 — Хүргэлт, үйлчилгээний нөхцөл"],
  ["ax-caption", "Caption 13 — Сүүлд шинэчилсэн: өнөөдөр"],
  ["text-xs", "XS 12 — Шинэ загвар"],
  ["ax-eyebrow", "Eyebrow — Өнгөний систем"],
  ["serif text-2xl", "Serif accent — Үнэ цэнэтэй бүтээл"],
];

const SPACING = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];
const RADII: [string, string][] = [["rounded-inner", "inner 8"], ["rounded-control", "control 12"], ["rounded-popover", "popover 14"], ["rounded-card", "card 20"], ["rounded-panel", "panel 28"], ["rounded-full", "pill"]];
const SHADOWS: [string, string][] = [["shadow-xs", "xs"], ["shadow-card", "card"], ["shadow-raised", "raised"], ["shadow-popover", "popover"]];
const BREAKPOINTS: [string, string, string][] = [["xs", "480", "Жижиг утас, том утас"], ["sm", "640", "Том утас"], ["md", "768", "Таблет; Dialog голлоно"], ["nav", "900", "Утасны таб цэс алга болно"], ["lg", "1024", "Админ sidebar гарна"], ["desk", "1100", "Толгойн бүтэн цэс"], ["xl", "1280", "Том дэлгэц"]];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-8">
      <h2 className="ax-h3">{title}</h2>
      {children}
    </section>
  );
}

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="ax-caption font-bold">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/** Development-only reference for every token and component. 404 in production, and it holds no real data. */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main id="main" className="ax-page flex flex-col gap-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="ax-eyebrow">Phase 1</span>
          <h1 className="ax-h1">AXORA дизайн систем</h1>
          <p className="ax-lead max-w-[60ch]">Токен, бүрэлдэхүүн хэсэг, хөдөлгөөн. Цайвар ба бараан горимд баталгаажуулах дэлгэц.</p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Өнгө">
        <div className="grid gap-6 md:grid-cols-2">
          {SWATCHES.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <p className="ax-caption font-bold">{group.title}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map(([label, token]) => (
                  <div key={token} className="flex w-[84px] flex-col gap-1">
                    <span className="h-12 rounded-inner border border-line" style={{ background: `var(${token})` }} />
                    <span className="text-2xs font-semibold text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Типографи (Manrope, Lora)">
        <div className="flex flex-col gap-4">
          {TYPE.map(([className, text]) => <p key={className} className={className}>{text}</p>)}
        </div>
      </Section>

      <Section title="Зай, радиус, сүүдэр, цэгүүд">
        <div className="flex flex-wrap items-end gap-3">
          {SPACING.map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <span className="block rounded-[3px] bg-brand" style={{ width: size, height: size }} />
              <span className="text-2xs text-muted">{size}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {RADII.map(([className, label]) => <span key={label} className={`flex h-20 w-24 items-center justify-center border border-line-strong bg-surface text-xs font-bold ${className}`}>{label}</span>)}
        </div>
        <div className="flex flex-wrap gap-4">
          {SHADOWS.map(([className, label]) => <span key={label} className={`flex h-20 w-28 items-center justify-center rounded-control border border-line bg-surface text-xs font-bold ${className}`}>{label}</span>)}
        </div>
        <Table wrapperClassName="ax-surface">
          <TableHeader><TableRow><TableHead>Цэг</TableHead><TableHead>px</TableHead><TableHead>Хэрэглээ</TableHead></TableRow></TableHeader>
          <TableBody>{BREAKPOINTS.map(([name, px, use]) => <TableRow key={name}><TableCell className="font-bold">{name}</TableCell><TableCell>{px}</TableCell><TableCell className="text-muted">{use}</TableCell></TableRow>)}</TableBody>
        </Table>
      </Section>

      <Section title="Button">
        <Demo label="Variant">
          <Button variant="primary">Захиалах</Button>
          <Button>Дэлгэрэнгүй</Button>
          <Button variant="lime">Эхлэх</Button>
          <Button variant="quiet">Болих</Button>
          <Button variant="danger">Устгах</Button>
          <Button variant="link">Холбоос</Button>
        </Demo>
        <Demo label="Size, state">
          <Button size="sm">Жижиг</Button>
          <Button>Дунд</Button>
          <Button size="lg">Том</Button>
          <Button size="icon" aria-label="Хайх"><Search aria-hidden="true" size={18} /></Button>
          <Button disabled>Идэвхгүй</Button>
          <LoadingButtonDemo />
        </Demo>
      </Section>

      <Section title="Input, Select">
        <div className="grid max-w-[720px] gap-5 md:grid-cols-2">
          <Field htmlFor="ds-name" label="Нэр" required hint="Захиалгын баримтад харагдана."><Input id="ds-name" placeholder="Болд" aria-describedby={fieldDescribedBy("ds-name", { hint: true })} /></Field>
          <Field htmlFor="ds-mail" label="Имэйл" error="Имэйл хаягаа шалгана уу."><Input id="ds-mail" type="email" defaultValue="bold@" aria-invalid="true" aria-describedby={fieldDescribedBy("ds-mail", { error: true })} /></Field>
          <Field htmlFor="ds-native" label="Энгийн сонголт (үндсэн)">
            <NativeSelect id="ds-native" defaultValue="excel">
              <option value="excel">Excel загвар</option>
              <option value="notion">Notion загвар</option>
            </NativeSelect>
          </Field>
          <div className="flex flex-col gap-2"><span className="text-sm font-bold">Radix сонголт</span><SelectDemo /></div>
          <Field htmlFor="ds-note" label="Тэмдэглэл" className="md:col-span-2"><Textarea id="ds-note" placeholder="Нэмэлт тайлбар" /></Field>
          <Field htmlFor="ds-off" label="Идэвхгүй"><Input id="ds-off" defaultValue="Засах боломжгүй" disabled /></Field>
        </div>
      </Section>

      <Section title="Card, Badge">
        <Card className="max-w-[440px]">
          <CardHeader>
            <div className="flex flex-col gap-1"><CardTitle>Төслийн тойм</CardTitle><CardDescription>Туршилтын жишээ агуулга</CardDescription></div>
            <Badge tone="success"><CircleCheck aria-hidden="true" size={14} /> Идэвхтэй</Badge>
          </CardHeader>
          <CardContent><p className="ax-body text-muted">Card нь Server Component хэвээр үлдэнэ. Хэсгүүдийг хэрэгцээгээр хослуулна.</p></CardContent>
          <CardFooter><Button variant="primary">Нээх</Button><Button variant="quiet">Болих</Button></CardFooter>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Badge>Brand</Badge><Badge tone="solid">Solid</Badge><Badge tone="lime">Шинэ</Badge><Badge tone="neutral">Ноорог</Badge><Badge tone="info">Мэдээлэл</Badge><Badge tone="success">Амжилттай</Badge><Badge tone="warn">Хүлээгдэж буй</Badge><Badge tone="danger">Алдаа</Badge>
        </div>
      </Section>

      <Section title="Dialog, Dropdown, Tooltip">
        <div className="flex flex-wrap items-center gap-3"><DialogDemo /><DropdownDemo /><TooltipDemo /></div>
      </Section>

      <Section title="Tabs"><TabsDemo /></Section>

      <Section title="Table">
        <Card className="overflow-hidden">
          <Table>
            <TableCaption>Туршилтын өгөгдөл. Өргөн хүснэгт өөрөө гүйлгэгдэж, хуудсыг өргөсгөхгүй.</TableCaption>
            <TableHeader><TableRow><TableHead>Захиалга</TableHead><TableHead>Төлөв</TableHead><TableHead>Төрөл</TableHead><TableHead>Огноо</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell className="font-bold">Жишээ 001</TableCell><TableCell><Badge tone="warn">Хүлээгдэж буй</Badge></TableCell><TableCell>Вебсайт</TableCell><TableCell className="whitespace-nowrap">2026-01-01</TableCell></TableRow>
              <TableRow><TableCell className="font-bold">Жишээ 002</TableCell><TableCell><Badge tone="success">Дууссан</Badge></TableCell><TableCell>Загвар</TableCell><TableCell className="whitespace-nowrap">2026-01-02</TableCell></TableRow>
            </TableBody>
          </Table>
        </Card>
      </Section>

      <Section title="Sidebar (Lucide ба Regen дүрс)">
        <div className="flex flex-wrap items-start gap-4">
          <Sidebar className="rounded-card">
            <SidebarGroup label="Үндсэн">
              <SidebarLink href="#main" active icon={<LayoutGrid aria-hidden="true" size={20} />} label="Самбар" adornment={<Badge tone="solid">3</Badge>} />
              <SidebarLink href="#main" icon={<Package aria-hidden="true" size={20} />} label="Бүтээгдэхүүн" />
            </SidebarGroup>
            <SidebarGroup label="Систем">
              <SidebarLink href="#main" icon={<Globe aria-hidden="true" size={20} />} label="Lucide Globe" />
              <SidebarLink href="#main" icon={<Icon name="globe" size={20} />} label="Regen globe" />
            </SidebarGroup>
          </Sidebar>
          <Sidebar collapsed className="rounded-card">
            <SidebarGroup label="Үндсэн" collapsed>
              <SidebarLink href="#main" collapsed active icon={<LayoutGrid aria-hidden="true" size={20} />} label="Самбар" />
              <SidebarLink href="#main" collapsed icon={<Settings aria-hidden="true" size={20} />} label="Тохиргоо" />
            </SidebarGroup>
          </Sidebar>
        </div>
      </Section>

      <Section title="Skeleton, Empty, Loading">
        <div className="grid gap-4 md:grid-cols-3">
          <Card aria-busy="true" aria-label="Ачаалж байна" className="flex flex-col gap-3 p-5"><Skeleton className="h-32 rounded-control" /><Skeleton className="h-5 w-2/3" /><SkeletonText lines={2} /></Card>
          <Card><EmptyState title="Захиалга алга" description="Шинэ захиалга ирэхэд энд харагдана." action={<Button variant="primary">Шинээр үүсгэх</Button>} /></Card>
          <Card><LoadingState /><div className="flex justify-center pb-6"><Spinner label="Ачаалж байна" /></div></Card>
        </div>
        <EmptyState frame headingLevel={3} title="Хүрээтэй хувилбар" description="Хуудасны түвшний хоосон төлөв." />
      </Section>

      <Section title="Motion"><MotionDemo /></Section>
    </main>
  );
}
