import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionTitleProps {
  children: ReactNode;
  prefix?: string;
  className?: string;
}

export function SectionTitle({
  children,
  prefix = "❯",
  className,
}: SectionTitleProps) {
  return (
    <h2 className={cn("text-lg font-bold mb-4 text-neutral-800", className)}>
      {prefix ? <span className="text-emerald-600 mr-2">{prefix}</span> : null}
      {children}
    </h2>
  );
}
