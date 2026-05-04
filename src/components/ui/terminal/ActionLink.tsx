import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type LinkVariant = "primary" | "muted" | "subtle";

interface ActionLinkProps extends ComponentProps<typeof Link> {
  variant?: LinkVariant;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASS: Record<LinkVariant, string> = {
  primary: "text-sky-700 hover:text-sky-800 hover:underline font-medium break-words",
  muted: "text-neutral-600 hover:text-sky-700",
  subtle: "text-neutral-500 hover:text-sky-700",
};

export function ActionLink({
  variant = "muted",
  className,
  children,
  ...props
}: ActionLinkProps) {
  const base = `rounded-[2px] transition-colors underline-offset-4 focus-visible:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${VARIANT_CLASS[variant]}`;
  return (
    <Link {...props} className={cn(base, className)}>
      {children}
    </Link>
  );
}
