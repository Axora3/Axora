"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Refresh } from "@/components/icons";

export function RetryButton({ label = "Дахин оролдох" }: { label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
      className="ax-btn ax-primary inline-flex min-h-12 items-center gap-2 rounded-xl border-0 bg-brand px-5 text-[15px] font-bold text-white"
    >
      <Refresh size={16} />
      {pending ? "Ачаалж байна…" : label}
    </button>
  );
}

export function LoadError({ title = "Загваруудыг ачаалж чадсангүй" }: { title?: string }) {
  return (
    <div role="alert" className="mt-5 flex flex-col items-center gap-3.5 rounded-[18px] border border-danger-line bg-danger-bg px-6 py-12 text-center">
      <h2 className="text-[22px] font-extrabold text-danger-ink">{title}</h2>
      <p className="max-w-[30em] text-base leading-relaxed text-danger-ink">
        Сервертэй холбогдоход алдаа гарлаа. Интернэт холболтоо шалгаад дахин оролдоно уу.
      </p>
      <RetryButton />
    </div>
  );
}
