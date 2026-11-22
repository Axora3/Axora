"use client";

import { useEffect, useRef } from "react";

/** One persistent viewport layer, reusing the existing transparent articulated rig. */
export function AnimatedHandsBackground() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void import("./hands/scene").then(async ({ createHandsBackground }) => {
      if (cancelled || !hostRef.current || !canvasRef.current) return;
      const runtime = createHandsBackground(canvasRef.current, hostRef.current, document.documentElement);
      dispose = runtime.dispose;
      await runtime.ready;
    }).catch(() => { if (hostRef.current) hostRef.current.dataset.state = "unavailable"; });
    return () => { cancelled = true; dispose?.(); };
  }, []);
  return <div ref={hostRef} aria-hidden="true" className="ax-global-hands" data-axora-hands-background=""><canvas ref={canvasRef} /></div>;
}
