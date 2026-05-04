import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  className?: string;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "px-4 py-1.5 bg-neutral-800 text-white rounded hover:bg-neutral-700",
  secondary:
    "px-4 py-1.5 border border-neutral-200 rounded hover:bg-neutral-50",
  link: "p-0 text-sm text-neutral-400 hover:text-sky-600",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const base = `text-base transition-colors disabled:opacity-50 ${VARIANT_CLASS[variant]}`;
  return <button className={cn(base, className)} {...props} />;
}
