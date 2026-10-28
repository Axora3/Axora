import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { isCatalogConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Админ нэвтрэх", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-wrap bg-[#F3F5EE]">
      <div aria-hidden="true" className="relative hidden flex-[1_1_520px] flex-col justify-between overflow-hidden bg-ink p-12 text-bg min-[861px]:flex">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-lime">
            <svg width="19" height="19" viewBox="0 0 24 24">
              <path d="M4 20L12 4l8 16h-4.2L12 12.2 8.2 20z" fill="#17251E" />
            </svg>
          </span>
          <span className="text-xl font-extrabold tracking-[0.08em]">AXORA</span>
          <span className="rounded-md border border-[#3C5446] px-2 py-1 text-xs font-extrabold text-lime">ADMIN</span>
        </div>
        <div className="ax-spin absolute top-1/2 -right-[180px] -mt-[260px] h-[520px] w-[520px] rounded-full border border-dashed border-[#3C5446] [animation-duration:40s]" />
        <div className="absolute top-1/2 -right-[60px] -mt-[140px] h-[280px] w-[280px] rounded-full border border-[#3C5446]" />
        <div className="relative flex max-w-[440px] flex-col gap-3.5">
          <h2 className="text-[44px] leading-[1.05] font-extrabold tracking-[-0.03em]">
            Захиалга, хүсэлтээ <span className="serif text-lime">нэг дороос.</span>
          </h2>
          <p className="text-base leading-relaxed text-dark-muted">Веб захиалга, template хүсэлт, бүтээгдэхүүнээ удирдах самбар.</p>
        </div>
      </div>
      <main id="main" className="flex flex-[1_1_480px] items-center justify-center px-5 py-10">
        <div className="flex w-full max-w-[400px] flex-col gap-6">
          <div className="ax-in-sm flex flex-col gap-2">
            <h1 className="text-[32px] font-extrabold tracking-[-0.025em]">Админ нэвтрэх</h1>
            <p className="text-[15px] leading-[1.55] text-muted">Зөвхөн админ эрхтэй хэрэглэгч нэвтэрнэ. Шинэ бүртгэл энд үүсгэх боломжгүй.</p>
          </div>
          <Suspense>
            <LoginForm configured={isCatalogConfigured()} />
          </Suspense>
          <Link href="/" className="self-center inline-flex min-h-11 items-center text-sm font-bold">
            ← Сайт руу буцах
          </Link>
        </div>
      </main>
    </div>
  );
}
