"use client";
import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { useVisualActivity } from "@/hooks/useVisualActivity";
import { AxoraMonogram } from "./AxoraLogo";

const BrandScene = dynamic(() => import("@/components/three/BrandScene"), {
  ssr: false,
});
class VisualBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function AxoraLiquidLogo() {
  const { ref, active } = useVisualActivity();
  return (
    <div ref={ref} className="ax-liquid-logo" aria-hidden="true">
      <AxoraMonogram className="ax-liquid-logo-static" />
      {active && typeof ResizeObserver !== "undefined" && (
        <VisualBoundary>
          <BrandScene />
        </VisualBoundary>
      )}
    </div>
  );
}
