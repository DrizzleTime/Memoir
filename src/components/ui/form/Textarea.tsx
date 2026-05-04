import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function Textarea({ className, ...props }: TextareaProps) {
  const base =
    "w-full px-3 py-2 text-base border border-neutral-200 rounded bg-white focus:outline-none focus:border-neutral-400 transition-colors resize-none";
  return <textarea className={cn(base, className)} {...props} />;
}
