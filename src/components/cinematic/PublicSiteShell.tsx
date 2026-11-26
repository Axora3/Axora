"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GlobalBackground } from "./GlobalBackground";
import { AnimatedHandsBackground } from "@/components/background/AnimatedHandsBackground";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MobileTabBar } from "@/components/site/MobileTabBar";

/** Lives outside the route template so decorative layers survive navigation. */
export function PublicSiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const privatePage = pathname.startsWith("/admin") || pathname.startsWith("/dev");
  if (privatePage) return <>{children}</>;
  return <div className="ax-public"><GlobalBackground /><AnimatedHandsBackground /><SiteHeader />{children}<MobileTabBar pathname={pathname} /></div>;
}
