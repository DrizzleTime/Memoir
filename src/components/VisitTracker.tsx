"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isPublicVisitPath } from "@/lib/visits";

export function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    if (!isPublicVisitPath(path) || lastTrackedPath.current === path) {
      return;
    }

    lastTrackedPath.current = path;

    const title = document.title.trim();

    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, title, referrer: document.referrer }),
      keepalive: true,
    }).catch(() => {
      lastTrackedPath.current = null;
    });
  }, [pathname, searchParams]);

  return null;
}
