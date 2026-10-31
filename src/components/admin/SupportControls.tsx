"use client";

import { runAdminAction } from "@/lib/admin/action-client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateContactMessageStatusAction } from "@/app/admin/actions";
import { CONTACT_STATUSES, CONTACT_STATUS, type ContactStatus } from "@/lib/admin/projects";
import { useToast } from "@/components/ui/Toast";
import { btn, field } from "./ui";

export function SupportStatusControl({ id, updatedAt, status }: { id: string; updatedAt: string; status: ContactStatus }) {
  const router = useRouter();
  const toast = useToast();
  const [expected, setExpected] = useState(updatedAt);
  const [value, setValue] = useState<ContactStatus>(status);
  const [pending, start] = useTransition();

  return (
    <form className="flex flex-col gap-3" onSubmit={(event) => {
      event.preventDefault();
      start(async () => {
        const result = await runAdminAction(() => updateContactMessageStatusAction({ id, expected, status: value }));
        if (!result.ok) return toast({ kind: "err", text: result.message, action: result.code === "conflict" ? { label: "Шинэчлэх", onClick: () => router.refresh() } : undefined });
        setExpected(result.updatedAt);
        toast({ kind: "ok", text: `Төлөв: ${CONTACT_STATUS[value].label}. Энэ нь зөвхөн дотоод бүртгэл.` });
        router.refresh();
      });
    }}>
      <label className="flex flex-col gap-1.5"><span className={field.label}>Дотоод төлөв</span><select className={field.input} value={value} onChange={(event) => setValue(event.target.value as ContactStatus)}>{CONTACT_STATUSES.map((s) => <option key={s} value={s}>{CONTACT_STATUS[s].label}</option>)}</select></label>
      <p className="text-xs leading-relaxed text-muted">“Хариулсан” нь гадуур өөрөө хариу илгээснийг тэмдэглэнэ. Энэ самбар имэйл эсвэл мессеж илгээхгүй.</p>
      <button className={btn.primary} disabled={pending || value === status}>{pending ? "Хадгалж байна…" : "Төлөв хадгалах"}</button>
    </form>
  );
}
