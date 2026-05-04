/* eslint-disable @next/next/no-img-element */

import { forwardRef } from "react";
import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type RawImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt"> & {
  alt: string;
};

const WEBP_SUFFIX = "-memoir.webp";

function toMemoirWebpSrc(
  src: string | Blob | undefined
): string | Blob | undefined {
  if (!src) return src;
  if (typeof src !== "string") return src;
  if (!src.startsWith("/uploads/")) return src;

  const [beforeHash, hashFragment] = src.split("#", 2);
  const [pathname, query] = beforeHash.split("?", 2);
  const lowerPathname = pathname.toLowerCase();

  if (lowerPathname.endsWith(WEBP_SUFFIX) || lowerPathname.endsWith(".webp")) {
    return src;
  }

  const match = lowerPathname.match(/\.(jpg|jpeg|png)$/);
  if (!match) return src;

  const webpPath = `${pathname.slice(0, -match[0].length)}${WEBP_SUFFIX}`;
  const withQuery = query ? `${webpPath}?${query}` : webpPath;
  return hashFragment ? `${withQuery}#${hashFragment}` : withQuery;
}

export const RawImg = forwardRef<HTMLImageElement, RawImgProps>(
  function RawImg({ className, alt, src, ...props }, ref) {
    const normalizedSrc =
      typeof src === "string" ? (src.trim() ? src.trim() : undefined) : src;
    const resolvedSrc = toMemoirWebpSrc(normalizedSrc);
    return (
      <img
        ref={ref}
        {...props}
        src={resolvedSrc}
        alt={alt}
        className={cn(className)}
      />
    );
  }
);
