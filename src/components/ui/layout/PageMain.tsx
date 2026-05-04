import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageMainProps {
  children: ReactNode;
  className?: string;
}

export function PageMain({ children, className }: PageMainProps) {
  return (
    <main className={cn("max-w-3xl mx-auto px-4 py-8 sm:py-12", className)}>
      {children}
    </main>
  );
}
