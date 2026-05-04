import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FormRowProps {
  children: ReactNode;
  className?: string;
}

export function FormRow({ children, className }: FormRowProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-2 sm:gap-3", className)}>
      {children}
    </div>
  );
}
