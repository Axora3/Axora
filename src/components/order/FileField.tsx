"use client";

import { useState } from "react";
import { Check, Close, Refresh, Upload } from "@/components/icons";
import { FieldError } from "@/components/ui/Notice";
import { ACCEPT_ATTR, LIMITS_TEXT, formatSize } from "@/lib/order/attachments";
import type { LocalFile } from "./uploads";

type Props = {
  id: string;
  num: number | string | undefined;
  label: string;
  files: LocalFile[];
  fileErr: string;
  onAdd: (list: FileList | null) => void;
  onRemove: (ref: string) => void;
  drive: string;
  onDrive: (v: string) => void;
  later: boolean;
  onLater: (v: boolean) => void;
  driveErr: string;
  /** After submission files can no longer be added or removed — only retried. */
  locked?: boolean;
  onRetry?: (ref: string) => void;
};

const STATUS: Record<LocalFile["status"], { text: string; color: string }> = {
  selected: { text: "Сонгогдсон — серверт илгээгдээгүй", color: "var(--ax-muted)" },
  uploading: { text: "Илгээж байна…", color: "var(--ax-brand)" },
  uploaded: { text: "Серверт хадгалагдсан", color: "var(--ax-brand)" },
  failed: { text: "Илгээгдсэнгүй", color: "var(--ax-danger)" },
  rejected: { text: "Хүлээн авах боломжгүй", color: "var(--ax-danger)" },
};

export function FileField(p: Props) {
  const [drag, setDrag] = useState(false);
  const hintId = `h-${p.id}`;
  return (
    <div className="flex flex-col gap-2">
      <span id={`lbl-${p.id}`} className="text-[15px] leading-snug font-bold">
        {p.num}. {p.label} <span className="font-semibold text-muted">(заавал биш)</span>
      </span>
      {!p.locked && (
        <label
          htmlFor={`f-${p.id}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            p.onAdd(e.dataTransfer?.files ?? null);
          }}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-[14px] border-2 border-dashed px-4 py-[22px] text-center transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand"
          style={{ borderColor: drag ? "var(--ax-brand)" : "var(--ax-line-mid)", background: drag ? "var(--ax-soft)" : "var(--ax-surface)" }}
        >
          <Upload size={26} className="text-brand" />
          <span className="text-[15px] font-bold">Файл сонгох эсвэл энд чирж оруулах</span>
          <span id={hintId} className="text-[13px] text-muted">
            {LIMITS_TEXT}
          </span>
          <input
            id={`f-${p.id}`}
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            aria-labelledby={`lbl-${p.id}`}
            aria-describedby={hintId}
            onChange={(e) => {
              p.onAdd(e.target.files);
              e.target.value = "";
            }}
            className="sr-only"
          />
        </label>
      )}
      {p.fileErr && (
        <span role="alert">
          <FieldError id={`fe-${p.id}`}>{p.fileErr}</FieldError>
        </span>
      )}
      {p.files.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label="Сонгосон файлууд">
          {p.files.map((f) => {
            const s = STATUS[f.status];
            return (
              <li key={f.ref} className="ax-in-sm flex items-center gap-3 rounded-xl border border-line bg-sunken py-2 pr-2 pl-3.5">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-bold">{f.name}</span>
                  <span className="text-xs" style={{ color: s.color, fontWeight: f.status === "selected" ? 400 : 700 }}>
                    {f.status === "uploaded" && <Check size={12} strokeWidth={3} className="mr-1 inline" />}
                    {formatSize(f.size)} · {s.text}
                    {f.error ? ` — ${f.error}` : ""}
                  </span>
                </span>
                {p.locked && f.status === "failed" && p.onRetry && (
                  <button
                    type="button"
                    onClick={() => p.onRetry!(f.ref)}
                    className="ax-btn ax-ghost inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-3 text-sm font-bold text-ink"
                  >
                    <Refresh size={14} />
                    Дахин илгээх
                  </button>
                )}
                {!p.locked && (
                  <button
                    type="button"
                    onClick={() => p.onRemove(f.ref)}
                    aria-label={`${f.name} файлыг устгах`}
                    className="ax-btn ax-ghost inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line-strong bg-surface text-ink"
                  >
                    <Close size={16} strokeWidth={2.2} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!p.locked && (
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="flex flex-[1_1_260px] flex-col gap-1.5">
            <label htmlFor={`f-${p.id}d`} className="text-sm font-bold">
              Эсвэл Google Drive холбоос
            </label>
            <input
              id={`f-${p.id}d`}
              type="url"
              inputMode="url"
              placeholder="https://drive.google.com/…"
              value={p.drive}
              onChange={(e) => p.onDrive(e.target.value)}
              aria-invalid={!!p.driveErr}
              aria-describedby={p.driveErr ? `e-${p.id}` : undefined}
              className="min-h-12 rounded-[11px] bg-sunken px-3.5 text-base text-ink"
              style={{ border: p.driveErr ? "2px solid var(--ax-danger)" : "1px solid var(--ax-line-strong)" }}
            />
          </div>
          <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={p.later} onChange={(e) => p.onLater(e.target.checked)} className="m-0 h-5 w-5" />
            Дараа илгээнэ
          </label>
        </div>
      )}
    </div>
  );
}
