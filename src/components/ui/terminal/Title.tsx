import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TitleSize = "lg" | "md" | "sm";

interface TitleProps {
  children: ReactNode;
  size?: TitleSize;
  className?: string;
}

const SIZE_CLASS: Record<TitleSize, string> = {
  lg: "text-2xl sm:text-3xl font-bold break-words",
  md: "text-xl sm:text-2xl font-bold break-words",
  sm: "text-lg sm:text-xl font-bold break-words",
};

export function Title({ children, size = "lg", className }: TitleProps) {
  const base = SIZE_CLASS[size];
  return <h1 className={cn(base, className)}>{children}</h1>;
}
