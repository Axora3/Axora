"use client";
import { type ReactNode } from "react";
import { GlassActiveIndicator } from "@/components/glass/GlassActiveIndicator";
type Option<T extends string> = {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
};
/** Semantic pressed buttons with one shared moving optical lens. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
  itemClassName = "",
}: {
  options: readonly Option<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`ax-segment ax-optical-nav ${className}`}
    >
      <GlassActiveIndicator
        selection={value}
        selector='[aria-pressed="true"]'
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          aria-label={option.ariaLabel}
          onClick={() => onChange(option.value)}
          className={`ax-segment-item ${itemClassName}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
