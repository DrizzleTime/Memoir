import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TreeItemProps {
  children: ReactNode;
  isLast?: boolean;
  className?: string;
}

export function TreeItem({ children, isLast = false, className }: TreeItemProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <span aria-hidden="true" className="text-neutral-400 shrink-0">
        {isLast ? "└─" : "├─"}
      </span>
      <div className="flex-1 min-w-0 break-words">{children}</div>
    </div>
  );
}
