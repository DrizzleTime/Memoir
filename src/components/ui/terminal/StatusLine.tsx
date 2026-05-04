import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatusLineProps {
  children: ReactNode;
  className?: string;
}

export function StatusLine({ children, className }: StatusLineProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base text-neutral-500",
        className
      )}
    >
      {children}
    </div>
  );
}
