import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  const base =
    "px-3 py-2 text-base border border-neutral-200 rounded bg-white focus:outline-none focus:border-neutral-400 transition-colors";
  return <input className={cn(base, className)} {...props} />;
}
