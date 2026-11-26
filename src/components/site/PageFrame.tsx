import "server-only";
import { SiteFooter } from "@/components/site/SiteFooter";

export function PageFrame({ title, accent, lead, children }: { title: string; accent?: string; lead?: string; children: React.ReactNode; active?: string }) {
  return <><main id="main" className="ax-page"><header className="ax-page-heading"><p className="ax-eyebrow mb-4">AXORA / {title}</p><h1 className="ax-title">{title} {accent && <span className="serif text-brand">{accent}</span>}</h1>{lead && <p className="mt-4 max-w-3xl leading-relaxed text-muted">{lead}</p>}</header>{children}</main><SiteFooter /></>;
}
