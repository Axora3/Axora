"use client";
import { Glass } from "@samasante/liquid-glass";
import { useSyncExternalStore, type CSSProperties } from "react";
import { GLASS_PRESETS, type GlassPreset } from "./glass-presets";
import { readGlassMode, subscribeGlassMode } from "./glass-capabilities";
/** Decorative material only. The host retains semantics, refs, layout and crisp controls.
 * No page copies, DOM screenshots, media renderer or continuous map re-rasterization.
 */
export function AxoraGlass({
  preset = "panel",
  className = "",
  style,
}: {
  preset?: GlassPreset;
  className?: string;
  style?: CSSProperties;
}) {
  const mode = useSyncExternalStore(
    subscribeGlassMode,
    readGlassMode,
    () => "pending" as const,
  );
  const props = {
    className: `ax-glass-layer ax-glass-${preset} ${className}`,
    style: {
      position: "absolute",
      inset: 0,
      display: "block",
      borderRadius: "inherit",
      pointerEvents: "none",
      ...style,
    } as CSSProperties,
    "aria-hidden": true as const,
    "data-ax-glass": preset,
    "data-ax-glass-mode": mode,
  };
  return mode === "live-backdrop" ? (
    <Glass {...props} optics={GLASS_PRESETS[preset]} live={false}>
      <span aria-hidden="true" />
    </Glass>
  ) : (
    <div {...props} />
  );
}
