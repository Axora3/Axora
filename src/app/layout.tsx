import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Cormorant_Garamond, Lora, Manrope, Onest, Rubik } from "next/font/google";
import { BuilderProvider } from "@/components/builder/BuilderProvider";
import { MobileTabBar } from "@/components/site/MobileTabBar";
import { SITE } from "@/lib/site";
import "./globals.css";

// Every face loads the Cyrillic subset so Ө, Ү and the rest render in the real font.
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const lora = Lora({ variable: "--font-lora", subsets: ["latin", "cyrillic"], weight: ["500", "600"], style: ["normal", "italic"], display: "swap" });
// Builder demo faces (used only inside the preview).
const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"], weight: ["500", "700", "800"], display: "swap", preload: false });
const rubik = Rubik({ variable: "--font-rubik", subsets: ["latin", "cyrillic"], weight: ["500", "700"], display: "swap", preload: false });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin", "cyrillic"], weight: ["500", "600"], display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "AXORA — Бэлэн загвар ба захиалгат веб", template: "%s — AXORA" },
  description: SITE.description,
  applicationName: "AXORA",
  openGraph: { type: "website", locale: "mn_MN", siteName: "AXORA", title: "AXORA — Бэлэн загвар ба захиалгат веб", description: SITE.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F8F2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${manrope.variable} ${lora.variable} ${onest.variable} ${rubik.variable} ${cormorant.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only-focusable fixed top-2 left-2 z-[100] rounded-lg bg-ink px-4 py-3 font-bold text-white"
        >
          Үндсэн агуулга руу шилжих
        </a>
        <BuilderProvider>
          {children}
          <Suspense fallback={null}>
            <MobileTabBar />
          </Suspense>
        </BuilderProvider>
      </body>
    </html>
  );
}
