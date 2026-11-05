/** Fallback while an admin page checks rights and loads data (also used by loading.tsx). */
export function AdminPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Ачаалж байна" className="flex flex-col gap-5 p-[clamp(16px,3vw,32px)]">
      <div className="ax-sk h-7 w-56 rounded-lg" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="ax-surface space-y-4 p-5"><div className="ax-sk h-3 w-20 rounded" /><div className="ax-sk h-8 w-16 rounded" /><div className="ax-sk h-3 w-24 rounded" /></div>)}
      </div>
      <div className="ax-sk h-64 rounded-[18px]" />
    </div>
  );
}
