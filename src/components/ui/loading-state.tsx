import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** With reduced motion the spin stops, so always pair it with text or an accessible name. */
export function Spinner({ size = 20, label, className }: { size?: number; label?: string; className?: string }) {
  return <LoaderCircle size={size} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn("animate-spin text-brand", className)} />;
}

/** For a wait with no known layout. If the layout is known, use Skeleton instead. */
export function LoadingState({ label = "Ачаалж байна…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" data-slot="loading-state" className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
      <Spinner size={24} />
      <p className="text-sm font-semibold text-muted">{label}</p>
    </div>
  );
}
