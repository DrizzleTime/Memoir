import { cn } from "@/lib/cn";

interface DividerProps {
  className?: string;
}

export function Divider({ className }: DividerProps) {
  return (
    <div className={cn("text-neutral-300 text-center text-sm tracking-widest py-4", className)}>
      ────────────────────────
    </div>
  );
}
