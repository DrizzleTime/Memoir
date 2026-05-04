"use client";

import { useEffect, useMemo, useState } from "react";
import { RawImg } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { LinkPreview } from "@/lib/link-preview";

const clientCache = new Map<string, LinkPreview | null | Promise<LinkPreview | null>>();

async function loadPreview(url: string): Promise<LinkPreview | null> {
  const cached = clientCache.get(url);
  if (cached) {
    if (typeof (cached as Promise<unknown>).then === "function") {
      return cached as Promise<LinkPreview | null>;
    }
    return cached as LinkPreview | null;
  }

  const promise = fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as unknown;
      if (!data || typeof data !== "object") return null;
      return data as LinkPreview;
    })
    .catch(() => null);

  clientCache.set(url, promise);
  const resolved = await promise;
  clientCache.set(url, resolved);
  return resolved;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function LinkPreviewCard({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [preview, setPreview] = useState<LinkPreview | null>(() => {
    const cached = clientCache.get(url);
    if (!cached) return null;
    if (typeof (cached as Promise<unknown>).then === "function") return null;
    return cached as LinkPreview | null;
  });
  const [resolved, setResolved] = useState(() => {
    const cached = clientCache.get(url);
    if (!cached) return false;
    return typeof (cached as Promise<unknown>).then !== "function";
  });
  const [imageFailed, setImageFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  const hostname = useMemo(() => getHostname(url), [url]);
  const displayUrl = useMemo(() => {
    try {
      const parsed = new URL(url);
      const path = `${parsed.pathname}${parsed.search}`.replace(/\/$/, "");
      return `${hostname}${path || "/"}`;
    } catch {
      return url;
    }
  }, [hostname, url]);

  useEffect(() => {
    let cancelled = false;
    if (resolved) return;

    void loadPreview(url).then((data) => {
      if (cancelled) return;
      setPreview(data);
      setResolved(true);
    });

    return () => {
      cancelled = true;
    };
  }, [resolved, url]);

  const title = preview?.title || hostname;
  const description = preview?.description || displayUrl;
  const siteName = preview?.siteName || hostname;

  const canShowImage = Boolean(preview?.image) && !imageFailed;
  const canShowFavicon = Boolean(preview?.favicon) && !faviconFailed;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(
        "memoir-link-preview not-prose my-4 block rounded-lg border border-neutral-200 bg-white overflow-hidden transition-colors hover:bg-neutral-50 no-underline hover:no-underline",
        className
      )}
    >
      <div className="flex items-stretch">
        <div className="relative w-36 shrink-0 min-h-24 bg-neutral-100 flex items-center justify-center overflow-hidden">
          {canShowImage ? (
            <RawImg
              src={preview?.image || ""}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : canShowFavicon ? (
            <RawImg
              src={preview?.favicon || ""}
              alt={siteName}
              className="h-8 w-8 object-contain"
              onError={() => setFaviconFailed(true)}
            />
          ) : (
            <span className="text-neutral-400 text-sm">{hostname}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 p-3">
          <div className="text-sm font-medium text-neutral-900 line-clamp-2">
            {title}
          </div>

          {description ? (
            <div className="mt-1 text-xs text-neutral-500 line-clamp-2">
              {description}
            </div>
          ) : null}

          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
            {canShowFavicon ? (
              <RawImg
                src={preview?.favicon || ""}
                alt={siteName}
                className="h-4 w-4 object-contain"
                onError={() => setFaviconFailed(true)}
              />
            ) : null}
            <span className="truncate">{siteName}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
