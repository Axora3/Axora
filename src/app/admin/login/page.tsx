import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { isCatalogConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Админ нэвтрэх", robots: { index: false, follow: false } };

function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center rounded-[10px] bg-lime" style={{ width: size, height: size }}>
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20L12 4l8 16h-4.2L12 12.2 8.2 20z" fill="currentColor" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-[0.08em]">AXORA</span>
      <span className="rounded-md border border-band-ring px-2 py-1 text-xs font-extrabold text-lime">ADMIN</span>
    </span>
  );
}

/** Sign-in only — no admin navigation is rendered here (the panel layout is not used). */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-band min-[861px]:flex-row min-[861px]:bg-bg-admin">
      {/* Desktop: brand panel. */}
      <div aria-hidden="true" className="relative hidden flex-[1_1_520px] flex-col justify-between overflow-hidden bg-band p-12 text-on-band min-[861px]:flex">
        <Logo />
        <div className="ax-spin absolute top-1/2 -right-[180px] -mt-[260px] h-[520px] w-[520px] rounded-full border border-dashed border-band-ring [animation-duration:40s]" />
        <div className="absolute top-1/2 -right-[60px] -mt-[140px] h-[280px] w-[280px] rounded-full border border-band-ring" />
        <div className="relative flex max-w-[440px] flex-col gap-3.5">
          <h2 className="text-[44px] leading-[1.05] font-extrabold tracking-[-0.03em]">
            Захиалга, хүсэлтээ <span className="serif text-lime">нэг дороос.</span>
          </h2>
          <p className="text-base leading-relaxed text-band-muted">Веб захиалга, template хүсэлт, бүтээгдэхүүнээ удирдах самбар.</p>
        </div>
      </div>

      {/* Phones: brand header on the dark band, form on a sheet below. */}
      <div className="relative overflow-hidden px-6 pt-[calc(20px+env(safe-area-inset-top))] pb-9 text-on-band min-[861px]:hidden">
        <div aria-hidden="true" className="ax-spin absolute -top-[110px] -right-[150px] h-[360px] w-[360px] rounded-full border border-dashed border-band-ring [animation-duration:36s]" />
        <div className="relative flex items-center justify-between gap-3">
          <Logo size={36} />
          <ThemeToggle tone="band" />
        </div>
        <p className="relative mt-8 text-[36px] leading-[1.06] font-extrabold tracking-[-0.03em]">
          Захиалгаа <span className="serif text-lime">хаанаас ч</span> удирд.
        </p>
      </div>

      <main
        id="main"
        className="relative flex flex-1 flex-col rounded-t-[28px] bg-bg-admin px-[22px] pt-7 pb-[calc(28px+env(safe-area-inset-bottom))] min-[861px]:flex-[1_1_480px] min-[861px]:items-center min-[861px]:justify-center min-[861px]:rounded-none min-[861px]:px-5 min-[861px]:py-10"
      >
        <div className="absolute top-4 right-4 hidden min-[861px]:block">
          <ThemeToggle />
        </div>
        <div className="flex w-full max-w-[400px] flex-1 flex-col gap-6 self-center min-[861px]:flex-none">
          <div className="ax-in-sm flex flex-col gap-2">
            <h1 className="text-[24px] font-extrabold tracking-[-0.02em] min-[861px]:text-[32px]">Админ нэвтрэх</h1>
            <p className="text-[15px] leading-[1.55] text-muted">Зөвхөн админ эрхтэй хэрэглэгч нэвтэрнэ. Шинэ бүртгэл энд үүсгэх боломжгүй.</p>
          </div>
          <Suspense>
            <LoginForm configured={isCatalogConfigured()} />
          </Suspense>
          <Link href="/" className="mt-auto inline-flex min-h-11 items-center self-center text-sm font-bold min-[861px]:mt-0">
            ← Сайт руу буцах
          </Link>
        </div>
      </main>
    </div>
  );
}
