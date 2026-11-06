import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Adapted from shadcn/ui Table (MIT). See THIRD_PARTY_NOTICES.md.
// The look lives in .ax-table. The wrapper scrolls, so a wide table never widens the page.
export function Table({ className, wrapperClassName, ...props }: ComponentProps<"table"> & { wrapperClassName?: string }) {
  return (
    <div data-slot="table-wrapper" className={cn("w-full overflow-x-auto", wrapperClassName)}>
      <table data-slot="table" className={cn("ax-table", className)} {...props} />
    </div>
  );
}

export function TableHeader(props: ComponentProps<"thead">) {
  return <thead data-slot="table-header" {...props} />;
}

export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" {...props} />;
}

export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={cn("border-t border-line bg-soft-2 font-bold [&_td]:px-3 [&_td]:py-3", className)} {...props} />;
}

export function TableRow(props: ComponentProps<"tr">) {
  return <tr data-slot="table-row" {...props} />;
}

export function TableHead({ scope = "col", ...props }: ComponentProps<"th">) {
  return <th data-slot="table-head" scope={scope} {...props} />;
}

export function TableCell(props: ComponentProps<"td">) {
  return <td data-slot="table-cell" {...props} />;
}

export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("ax-caption px-5 py-3 text-left [caption-side:bottom]", className)} {...props} />;
}
