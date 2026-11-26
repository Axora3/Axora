import type { Metadata } from "next";
import { Builder } from "@/components/builder/Builder";

export const metadata: Metadata = {
  title: "Website Builder",
  description: "Бизнесийн төрөл, хэв маяг, өнгө, агуулгаа сонгоод вебсайт тань хэрхэн харагдахыг шууд хараарай.",
  alternates: { canonical: "/builder" },
};

/** Public navigation lives in the persistent shell; the editor keeps its contextual toolbar. */
export default function BuilderPage() {
  return (
    <main id="main" className="ax-builder-page">
      <h1 className="sr-only">Website Builder</h1>
      <Builder />
    </main>
  );
}
