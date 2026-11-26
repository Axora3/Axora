import type { ReactNode } from "react";

/** Static material companion to the original GLSL field in BrandScene. */
export function ShaderGradient({ children }: { children: ReactNode }) {
  return <div className="ax-shader-surface">{children}</div>;
}
