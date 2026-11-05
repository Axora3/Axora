import { PageEnter } from "@/components/ui/page-enter";

/** Remounts on every navigation, so each route gets the same quiet entrance. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageEnter>{children}</PageEnter>;
}
