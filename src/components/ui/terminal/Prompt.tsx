import type { ReactNode } from "react";

interface PromptProps {
  children?: ReactNode;
  symbol?: string;
  className?: string;
}

export function Prompt({ children, symbol = "❯", className }: PromptProps) {
  return (
    <span className={className}>
      <span className="text-emerald-600 font-bold mr-2">{symbol}</span>
      {children}
    </span>
  );
}
