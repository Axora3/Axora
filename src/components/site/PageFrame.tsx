import "server-only";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PageFrame({ title, accent, lead, children, active }: { title: string; accent?: string; lead?: string; children: React.ReactNode; active?: string }) {
  return <><SiteHeader active={active} /><main id="main" className="ax-page"><header className="mb-7"><h1 className="ax-title">{title} {accent && <span className="serif text-brand">{accent}</span>}</h1>{lead && <p className="mt-3 max-w-3xl leading-relaxed text-muted">{lead}</p>}</header>{children}</main><SiteFooter /></>;
}
