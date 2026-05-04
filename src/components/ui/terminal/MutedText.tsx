import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type MutedTag = "p" | "span" | "div";

type MutedTextProps<T extends MutedTag = "p"> = {
  children: ReactNode;
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function MutedText<T extends MutedTag = "p">({
  children,
  as,
  className,
  ...props
}: MutedTextProps<T>) {
  const Component = as ?? "p";

  return (
    <Component className={cn("text-neutral-500", className)} {...props}>
      {children}
    </Component>
  );
}
