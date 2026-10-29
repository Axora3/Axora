/** Fallback while an admin page checks rights and loads data (also used by loading.tsx). */
export function AdminPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Ачаалж байна" className="flex flex-col gap-5 p-[clamp(16px,3vw,32px)]">
      <div className="ax-sk h-7 w-56 rounded-lg" />
      <div className="ax-sk h-28 rounded-[18px]" />
      <div className="ax-sk h-64 rounded-[18px]" />
    </div>
  );
}
