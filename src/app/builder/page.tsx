import type { Metadata } from "next";
import { Builder } from "@/components/builder/Builder";

export const metadata: Metadata = {
  title: "Website Builder",
  description: "Бизнесийн төрөл, хэв маяг, өнгө, агуулгаа сонгоод вебсайт тань хэрхэн харагдахыг шууд хараарай.",
  alternates: { canonical: "/builder" },
};

/** A full-height workspace with its own toolbar, so it has no site header or footer. */
export default function BuilderPage() {
  return (
    <main id="main">
      <h1 className="sr-only">Website Builder</h1>
      <Builder />
    </main>
  );
}
