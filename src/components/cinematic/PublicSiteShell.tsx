"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GlobalBackground } from "./GlobalBackground";
import { AnimatedHandsBackground } from "@/components/background/AnimatedHandsBackground";

/** Lives outside the route template so decorative layers survive navigation. */
export function PublicSiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const privatePage = pathname.startsWith("/admin") || pathname.startsWith("/dev");
  if (privatePage) return <>{children}</>;
  return <div className="ax-public"><GlobalBackground /><AnimatedHandsBackground />{children}</div>;
}
