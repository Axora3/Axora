"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { m, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

/** Scroll parallax and ambient drift use separate layers; neither moves footer UI. */
export function AnimatedCloudFooter() {
  const region = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(region, { margin: "100px" });
  const { scrollY, scrollYProgress } = useScroll({ target: region, offset: ["start end", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 65, damping: 24, mass: 0.8 });
  const y = useTransform(progress, [0, 1], [150, -24]);
  const opacity = useTransform(progress, [0, 0.35, 1], [0, 0.65, 1]);
  const tipY = useMotionValue(0);

  // Keep a feathered opening over the existing rig's viewport-based fingertip anchor.
  // This mask stays on the stationary region, independent of both cloud transforms.
  function updateTipWindow() {
    if (!region.current) return;
    const focalY = innerHeight * (innerWidth < 700 ? 0.68 : 0.60);
    tipY.set(focalY - region.current.getBoundingClientRect().top);
  }
  useMotionValueEvent(scrollY, "change", updateTipWindow);
  useEffect(() => {
    const update = () => {
      if (!region.current) return;
      tipY.set(innerHeight * (innerWidth < 700 ? 0.68 : 0.60) - region.current.getBoundingClientRect().top);
    };
    update();
    const observer = new ResizeObserver(update);
    if (region.current) observer.observe(region.current);
    window.addEventListener("resize", update);
    return () => { observer.disconnect(); window.removeEventListener("resize", update); };
  }, [tipY]);
  const tipPosition = useTransform(tipY, (value) => `${value}px`);

  return (
    <m.div
      ref={region}
      className="ax-cloud-footer"
      aria-hidden="true"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={{ "--ax-cloud-tip-y": tipPosition } as CSSProperties}
    >
      <m.div className="ax-cloud-scroll" style={{ y: reducedMotion ? 0 : y, opacity: reducedMotion ? 1 : opacity }}>
        <div className="ax-cloud-float" data-floating={!reducedMotion && inView ? "true" : "false"}>
          <Image src="/images/cinematic/footer-clouds.webp" alt="" fill sizes="(max-width: 699px) 180vw, 100vw" className="ax-cloud-footer-image" />
        </div>
      </m.div>
    </m.div>
  );
}
