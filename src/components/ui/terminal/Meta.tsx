import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface MetaProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Meta({ label, children, className }: MetaProps) {
  return (
    <span className={cn("text-neutral-500 text-sm sm:text-base", className)}>
      <span className="text-violet-600">{label}</span>
      {children}
    </span>
  );
}
