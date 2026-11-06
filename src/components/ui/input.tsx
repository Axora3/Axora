import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FieldError } from "./Notice";

// Server-safe. The look lives in .ax-input (globals.css); inputs never go below
// 16px, so iOS does not zoom on focus.
export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("ax-input", className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} data-slot="textarea" className={cn("ax-input resize-y leading-normal", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label data-slot="label" className={cn("text-sm font-bold", className)} {...props} />;
}

/** The ids a control should point at through aria-describedby. */
export function fieldDescribedBy(id: string, { hint, error }: { hint?: unknown; error?: unknown }) {
  return [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
}

/**
 * Label, control, hint and error in the standard stack. Pass the control's id as
 * `htmlFor`, and give the control aria-describedby={fieldDescribedBy(id, …)} and
 * aria-invalid when there is an error.
 */
export function Field({ htmlFor, label, hint, error, required, className, children }: { htmlFor: string; label: ReactNode; hint?: ReactNode; error?: ReactNode; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div data-slot="field" className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-danger">*</span>}
      </Label>
      {children}
      {hint && <p id={`${htmlFor}-hint`} className="ax-caption">{hint}</p>}
      {error && <FieldError id={`${htmlFor}-error`}>{error}</FieldError>}
    </div>
  );
}
