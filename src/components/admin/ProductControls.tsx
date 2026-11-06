"use client";

import { Icon } from "@/components/ui/icon";

import { runAdminAction } from "@/lib/admin/action-client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTemplateAction, setTemplatePublishedAction } from "@/app/admin/template-actions";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button, buttonStyles } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ErrorBox } from "@/components/ui/Notice";
import { useToast } from "@/components/ui/Toast";

/**
 * Permanent delete, always behind a confirmation. A published product cannot be
 * deleted, so the dialog explains that instead of offering an action that would fail.
 */
export function DeleteProductButton({ id, title, published, labelled = false }: { id: string; title: string; published: boolean; labelled?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function remove() {
    setError("");
    start(async () => {
      const r = await runAdminAction(() => deleteTemplateAction({ id }));
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setOpen(false);
      toast({ kind: "ok", text: `“${title}” устгагдлаа.` });
      router.push("/admin/templates");
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError("");
      }}
    >
      <DialogTrigger aria-label={`${title} — устгах`} title="Устгах" className={buttonStyles(labelled ? "danger" : "quiet", labelled ? "" : "w-11 px-0 text-danger")}>
        <Icon name="trash" size={labelled ? 16 : 18} />
        {labelled && "Устгах"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{published ? "Эхлээд нийтлэлээс буулгана уу" : "Бүтээгдэхүүнийг устгах уу?"}</DialogTitle>
          <DialogDescription>
            {published
              ? `“${title}” сайтад нийтлэгдсэн байна. Устгахын өмнө нийтлэлээс буулгаж ноорог болгоно уу.`
              : `“${title}” болон түүний зураг, хамгаалагдсан файл бүрмөсөн устана. Энэ үйлдлийг буцаах боломжгүй.`}
          </DialogDescription>
        </DialogHeader>
        {error && <ErrorBox>{error}</ErrorBox>}
        <DialogFooter>
          <DialogClose className={buttonStyles("secondary")}>{published ? "Ойлголоо" : "Болих"}</DialogClose>
          {!published && <Button variant="danger" loading={pending} onClick={remove}>{pending ? "Устгаж байна…" : "Тийм, устгах"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Publish switch on a product card. While saving it is disabled and shows
 * the target state; the server validates (same rules as the editor, plus the
 * database guard). On failure the switch returns to the saved state and a
 * sheet lists what is missing with an “Засах” action. Unpublishing asks first
 * because it removes the product from the public site.
 */
export function PublishSwitch({ id, title, published, editHref }: { id: string; title: string; published: boolean; editHref: string }) {
  const router = useRouter();
  const toast = useToast();
  const [saved, setSaved] = useState(published);
  const [seen, setSeen] = useState(published);
  if (seen !== published) {
    setSeen(published);
    setSaved(published);
  }
  const [target, setTarget] = useState<boolean | null>(null);
  const [sheet, setSheet] = useState<null | "confirm" | "errors">(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const shown = target ?? saved;

  function commit(next: boolean) {
    setTarget(next);
    start(async () => {
      const r = await runAdminAction(() => setTemplatePublishedAction({ id, publish: next }));
      setTarget(null);
      if (!r.ok) {
        const reasons = "reasons" in r ? r.reasons ?? [] : [];
        setReasons(reasons);
        setMsg(r.message);
        if (reasons.length || r.code === "validation") setSheet("errors");
        else toast({ kind: "err", text: r.message, action: { label: "Дахин", onClick: () => commit(next) } });
        return;
      }
      setSaved(r.status === "published");
      setSheet(null);
      router.refresh();
      toast({ kind: "ok", text: r.status === "published" ? `“${title}” нийтлэгдлээ — сайтад харагдана.` : `“${title}” ноорог боллоо — сайтаас нуугдлаа.` });
    });
  }

  return (
    <>
      <label className={`inline-flex min-h-11 items-center gap-2.5 text-[13px] font-bold ${pending ? "cursor-wait" : "cursor-pointer"}`}>
        <span aria-live="polite">{pending ? "Хадгалж байна…" : shown ? "Нийтэлсэн" : "Ноорог"}</span>
        <input
          type="checkbox"
          role="switch"
          checked={shown}
          disabled={pending}
          aria-label={`${title} — нийтлэх`}
          onChange={(e) => (e.target.checked ? commit(true) : setSheet("confirm"))}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`relative h-7 w-[46px] shrink-0 rounded-full transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${shown ? "bg-primary" : "bg-line-strong"} ${pending ? "opacity-60" : ""}`}
        >
          <span className={`absolute top-[3px] left-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform ${shown ? "translate-x-[18px]" : ""}`} />
        </span>
      </label>

      <BottomSheet
        open={sheet === "confirm"}
        onClose={() => setSheet(null)}
        title="Нийтлэлээс буулгах уу?"
        description={title}
        footer={
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setSheet(null)} className="ax-btn min-h-12 flex-1 cursor-pointer rounded-control border border-line-strong bg-surface text-[15px] font-bold text-ink">
              Үгүй
            </button>
            <button type="button" disabled={pending} onClick={() => commit(false)} className="ax-btn min-h-12 flex-[2] cursor-pointer rounded-control border border-danger-line bg-danger-bg text-[15px] font-bold text-danger-ink">
              {pending ? "Хадгалж байна…" : "Тийм, ноорог болгох"}
            </button>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed">Бүтээгдэхүүн нийтийн жагсаалт болон дэлгэрэнгүй хуудаснаас нуугдана. Ирсэн хүсэлтүүд хэвээр үлдэнэ.</p>
      </BottomSheet>

      <BottomSheet
        open={sheet === "errors"}
        onClose={() => setSheet(null)}
        title="Нийтлэх боломжгүй"
        description={title}
        footer={
          <Link href={editHref} className="ax-btn ax-primary flex min-h-13 w-full items-center justify-center rounded-control bg-primary text-base font-bold text-on-primary no-underline">
            Засах
          </Link>
        }
      >
        <div role="alert" className="flex flex-col gap-2.5">
          <p className="text-[15px] font-bold">{msg}</p>
          {reasons.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {reasons.map((x) => (
                <li key={x} className="flex gap-2 rounded-control bg-danger-bg px-3 py-2 text-sm font-semibold text-danger-ink">
                  <span aria-hidden="true"><Icon name="x" size={16} /></span>
                  {x}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[13px] text-muted">Бүтээгдэхүүн ноорог хэвээр байна.</p>
        </div>
      </BottomSheet>
    </>
  );
}
