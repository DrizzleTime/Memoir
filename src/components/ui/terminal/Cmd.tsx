import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CmdProps {
  children: ReactNode;
  className?: string;
}

export function Cmd({ children, className }: CmdProps) {
  return (
    <span className={cn("text-neutral-500 text-base sm:text-lg", className)}>
      <span className="text-violet-600 mr-2">$</span>
      {children}
    </span>
  );
}
