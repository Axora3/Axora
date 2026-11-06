import Link from "next/link";
import { EmptyState as BaseEmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";

export function EmptyState({ title, description, href = "/templates", label = "Загварууд үзэх" }: { title: string; description: string; href?: string; label?: string }) {
  return <BaseEmptyState frame headingLevel={2} title={title} description={description} icon={<Icon name="diamond" size={24} />} action={<Link href={href} className="ax-button">{label}</Link>} />;
}
