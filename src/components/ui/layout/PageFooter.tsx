import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageFooterProps {
  children: ReactNode;
  className?: string;
}

export function PageFooter({ children, className }: PageFooterProps) {
  return (
    <footer className={cn("text-center text-sm text-neutral-500 py-6", className)}>
      {children}
    </footer>
  );
}
