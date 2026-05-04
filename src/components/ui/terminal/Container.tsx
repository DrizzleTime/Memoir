import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("memoir-site font-mono text-neutral-800 w-full overflow-x-hidden", className)}>
      {children}
    </div>
  );
}
