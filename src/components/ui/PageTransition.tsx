"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const transitionKey = `${pathname}?${searchParams.toString()}`;

  return (
    <div key={transitionKey} className="memoir-page-transition">
      {children}
    </div>
  );
}
