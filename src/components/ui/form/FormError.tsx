import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FormErrorProps {
  children: ReactNode;
  className?: string;
}

export function FormError({ children, className }: FormErrorProps) {
  return <p className={cn("text-red-500 text-sm", className)}>{children}</p>;
}
