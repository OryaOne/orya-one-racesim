import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em]",
  {
    variants: {
      variant: {
        default: "border-primary/25 bg-primary/10 text-primary",
        muted: "border-border bg-card/70 text-muted-foreground",
        success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
        warning: "border-amber-300/25 bg-amber-300/10 text-amber-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

