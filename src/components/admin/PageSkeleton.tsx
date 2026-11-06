import { Skeleton } from "@/components/ui/skeleton";

/** Fallback while an admin page checks rights and loads data (also used by loading.tsx). */
export function AdminPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Ачаалж байна" className="flex flex-col gap-5 p-[clamp(16px,3vw,32px)]">
      <Skeleton className="h-7 w-56 rounded-lg" />
      <div className="grid grid-cols-2 gap-3.5 min-[900px]:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="ax-stat justify-between"><Skeleton className="h-3 w-24 rounded" /><div className="flex flex-col gap-2"><Skeleton className="h-8 w-14 rounded" /><Skeleton className="h-3 w-28 rounded" /></div></div>)}
      </div>
      <div className="ax-surface flex flex-col gap-4 p-5">
        <Skeleton className="h-4 w-40 rounded" />
        {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-9 rounded-control" />)}
      </div>
    </div>
  );
}
