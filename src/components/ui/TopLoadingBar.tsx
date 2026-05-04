"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(false);
      setProgress(0);
    });
  }, [pathname, searchParams]);

  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");

    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    if (
      href.startsWith("http") ||
      href.startsWith("#") ||
      anchor.target === "_blank" ||
      anchor.hasAttribute("download")
    ) {
      return;
    }

    const currentPath = window.location.pathname + window.location.search;
    const newUrl = new URL(href, window.location.origin);
    const newPath = newUrl.pathname + newUrl.search;

    if (currentPath === newPath) return;

    setLoading(true);
    setProgress(0);
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [handleClick]);

  useEffect(() => {
    if (!loading) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        const increment = prev < 30 ? 15 : prev < 60 ? 8 : 3;
        return Math.min(prev + increment, 90);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [loading]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      <div
        className="h-full bg-emerald-500 transition-all duration-200 ease-out"
        style={{
          width: loading ? `${progress}%` : "100%",
          opacity: loading ? 1 : 0,
          transition: loading
            ? "width 200ms ease-out"
            : "width 150ms ease-out, opacity 300ms ease-out 100ms",
        }}
      />
    </div>
  );
}
