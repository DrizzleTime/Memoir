import { cn } from "@/lib/cn";

interface CursorProps {
  text?: string;
  className?: string;
}

export function Cursor({ text, className }: CursorProps) {
  return (
    <span className={cn("text-emerald-600", className)}>
      {text}
      <span className="animate-blink">_</span>
    </span>
  );
}
