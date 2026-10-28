import { Alert, Info } from "@/components/icons";

/** Yellow test-mode / demo notice and red error box from the design. */
export function TestModeNotice({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <p role="note" className={`flex items-start gap-2 rounded-[10px] bg-warn-bg px-3 py-2.5 text-[13px] leading-normal font-bold text-warn-ink ${className}`}>
      <Info size={16} className="mt-px shrink-0" />
      <span>{children ?? "Туршилтын горим — мэдээлэл илгээгдэхгүй."}</span>
    </p>
  );
}

export function ErrorBox({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="alert" className={`ax-shake flex items-start gap-2.5 rounded-xl border border-danger-line bg-danger-bg px-3.5 py-3 text-sm leading-normal font-bold text-danger-ink ${className}`}>
      <Alert size={18} strokeWidth={2.2} className="mt-px shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Inline field error: icon + text, never colour alone. */
export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} className="inline-flex items-start gap-1.5 text-[13px] font-bold text-danger">
      <span aria-hidden="true">✕</span>
      <span>{children}</span>
    </span>
  );
}
