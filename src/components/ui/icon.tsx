import type { SVGProps } from "react";
import type { IconName } from "./icon-names";

export type { IconName } from "./icon-names";
export type IconProps = Omit<SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> & {
  name: IconName;
  size?: number | string;
  /** Defaults to decorative unless an accessible label is supplied. */
  decorative?: boolean;
  label?: string;
};

/** Server/client-safe renderer. All geometry comes from the generated Regen sprite. */
export function Icon({ name, size = 20, decorative, label, className, ...props }: IconProps) {
  const hidden = decorative ?? !(label || props["aria-label"] || props["aria-labelledby"]);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={hidden ? undefined : "img"}
      aria-hidden={hidden ? true : undefined}
      aria-label={hidden ? undefined : label}
      className={`inline-block shrink-0 align-middle${className ? ` ${className}` : ""}`}
      {...props}
    >
      <use href={`/icons/regen.svg#${name}`} />
    </svg>
  );
}
