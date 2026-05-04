"use client";

import { useState } from "react";
import type { ImgHTMLAttributes } from "react";
import ImageLightbox from "./ImageLightbox";
import { RawImg } from "@/components/ui";
import { cn } from "@/lib/cn";

interface MarkdownImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string;
  alt: string;
}

export default function MarkdownImage({
  src,
  alt,
  className,
  onClick,
  ...props
}: MarkdownImageProps) {
  const normalizedSrc = src.trim();
  const [isOpen, setIsOpen] = useState(false);

  if (!normalizedSrc) {
    return null;
  }

  return (
    <>
      <RawImg
        src={normalizedSrc}
        alt={alt}
        {...props}
        className={cn("cursor-pointer", className)}
        onClick={(event) => {
          onClick?.(event);
          setIsOpen(true);
        }}
      />
      <ImageLightbox
        images={[{ src: normalizedSrc, alt }]}
        initialIndex={0}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
