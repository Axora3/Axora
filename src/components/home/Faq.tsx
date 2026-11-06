import { Plus } from "@/components/icons";

/** Native <details> sharing one name: one answer open at a time, with no JavaScript. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="ax-reveal flex flex-col border-t border-line">
      {items.map((f, i) => (
        <details key={f.q} name="faq" open={i === 0} className="ax-details border-b border-line">
          <summary>
            <h3 className="text-inherit">{f.q}</h3>
            <span aria-hidden="true" className="ax-details-icon">
              <Plus size={16} strokeWidth={2.2} />
            </span>
          </summary>
          <p className="ax-in-sm pr-[52px] pb-[22px] text-base leading-[1.65] text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
