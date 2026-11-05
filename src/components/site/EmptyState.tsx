import { Icon } from "@/components/ui/icon";
import Link from "next/link";

export function EmptyState({ title, description, href = "/templates", label = "Загварууд үзэх" }: { title: string; description: string; href?: string; label?: string }) {
  return <div className="ax-empty"><span aria-hidden="true" className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-soft text-2xl text-brand"><Icon name="diamond" size={24} /></span><h2 className="text-xl font-extrabold">{title}</h2><p className="mt-3 max-w-lg leading-relaxed text-muted">{description}</p><Link href={href} className="ax-button mt-5">{label}</Link></div>;
}
