"use client";
import { useEffect, useRef, useState } from "react";

/** Decorative effects mount only in view on capable devices; all subscriptions clean up. */
export function useVisualActivity() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const small = matchMedia("(max-width: 767px)");
    let visible = false;
    const update = () =>
      setActive(
        visible && !document.hidden && !motion.matches && !small.matches,
      );
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    small.addEventListener("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
      small.removeEventListener("change", update);
    };
  }, []);
  return { ref, active };
}
