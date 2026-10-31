import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell, SignOutButton } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: { default: "Админ", template: "%s — AXORA Admin" },
  robots: { index: false, follow: false },
};

// Admin navigation must validate the current session on the server per request.
// These routes can block on auth, so don't treat them as instant-navigation UI.
export const instant = false;

function Centered({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-bg-admin p-5">
      <div className="flex w-full max-w-[460px] flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-6">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

async function Guard({ children }: { children: React.ReactNode }) {
  const c = await requireAdminPage();
  if (c.kind === "no-config") {
    return (
      <Centered title="Supabase холбогдоогүй">
        <p className="text-[15px] leading-relaxed text-muted">
          Админ самбар бодит өгөгдөл, нэвтрэлт шаарддаг тул туршилтын өгөгдлөөр ажиллахгүй. README-ийн “Админ тохируулах” хэсгийн дагуу орчны хувьсагч, migration-оо тохируулна уу.
        </p>
        <Link href="/" className="font-bold">
          ← Сайт руу буцах
        </Link>
      </Centered>
    );
  }
  if (c.kind === "forbidden") {
    return (
      <Centered title="Админ эрхгүй байна">
        <p className="text-[15px] leading-relaxed text-muted">
          {c.email ? `“${c.email}” хаягаар нэвтэрсэн` : "Та нэвтэрсэн"} боловч энэ бүртгэлд админ эрх олгогдоогүй байна. Эрхийг зөвхөн серверийн тохиргоогоор олгоно.
        </p>
        <SignOutButton className="ax-btn ax-primary min-h-12 rounded-xl border-0 bg-primary px-5 font-bold text-on-primary" />
      </Centered>
    );
  }
  if (c.kind === "error") {
    return (
      <Centered title="Эрх шалгаж чадсангүй">
        <p role="alert" className="text-[15px] leading-relaxed text-danger-ink">
          Сервертэй холбогдоход алдаа гарлаа. Хуудсыг дахин ачаална уу. Migration ажилласан эсэхийг шалгаарай.
        </p>
      </Centered>
    );
  }
  const { db } = c.ctx;
  const [o, r, s, n] = await Promise.all([
    db.from("website_orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("template_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("admin_notifications").select("id", { count: "exact", head: true }).eq("admin_id", c.ctx.user.id).is("read_at", null),
  ]);
  return (
    <AdminShell counts={{ orders: o.count, requests: r.count, support: s.count, notifications: n.count }} email={c.ctx.user.email ?? "admin"}>
      {children}
    </AdminShell>
  );
}

function ShellLoading() {
  return (
    <div className="flex min-h-dvh bg-bg-admin" aria-busy="true" aria-label="Ачаалж байна">
      <div className="hidden w-[240px] shrink-0 bg-band min-[1024px]:block" />
      <div className="flex-1 p-8">
        <div className="ax-sk h-8 w-60 rounded-lg" />
        <div className="ax-sk mt-6 h-40 rounded-2xl" />
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellLoading />}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}
