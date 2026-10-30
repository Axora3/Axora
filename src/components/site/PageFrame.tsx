import Link from "next/link";
import { SiteHeader } from "./SiteHeader";

export function PageFrame({ title, accent, lead, children, active }: { title: string; accent?: string; lead?: string; children: React.ReactNode; active?: string }) {
  return <><SiteHeader active={active} /><main id="main" className="ax-page"><header className="mb-7"><h1 className="ax-title">{title} {accent && <span className="serif text-brand">{accent}</span>}</h1>{lead && <p className="mt-3 max-w-3xl leading-relaxed text-muted">{lead}</p>}</header>{children}</main></>;
}
export function EmptyState({ title, description, href = "/templates", label = "Загварууд үзэх" }: { title: string; description: string; href?: string; label?: string }) {
  return <div className="ax-empty"><span aria-hidden="true" className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-soft text-2xl text-brand">◇</span><h2 className="text-xl font-extrabold">{title}</h2><p className="mt-3 max-w-lg leading-relaxed text-muted">{description}</p><Link href={href} className="ax-button mt-5">{label}</Link></div>;
}
