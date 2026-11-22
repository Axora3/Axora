import Image from "next/image";

export function GlobalBackground() {
  return <div className="ax-global-background" aria-hidden="true">
    <Image src="/images/cinematic/global-background-rotated.webp" alt="" fill sizes="100vw" preload className="object-cover object-center" />
    <div className="ax-cinematic-overlay" />
  </div>;
}

