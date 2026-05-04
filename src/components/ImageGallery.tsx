"use client";

import { useState, useEffect, useCallback } from "react";
import ImageLightbox from "./ImageLightbox";
import { RawImg } from "@/components/ui";

interface ImageGalleryProps {
  images: { src: string; alt: string }[];
  autoPlayInterval?: number;
}

export default function ImageGallery({
  images,
  autoPlayInterval = 4000,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;

    const timer = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isAutoPlaying, autoPlayInterval, goToNext, images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrev();
        setIsAutoPlaying(false);
      } else if (e.key === "ArrowRight") {
        goToNext();
        setIsAutoPlaying(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  if (images.length === 0) return null;

  return (
    <div className="image-gallery my-6">
      <div
        className="relative overflow-hidden rounded-lg"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(false)}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className={`w-full transition-opacity duration-500 ${
              index === currentIndex
                ? "opacity-100"
                : "opacity-0 absolute inset-0 pointer-events-none"
            }`}
          >
            <RawImg
              src={image.src}
              alt={image.alt}
              className="w-full max-h-[70vh] object-cover rounded-lg cursor-pointer"
              loading={index === 0 ? "eager" : "lazy"}
              onClick={() => {
                setCurrentIndex(index);
                setLightboxIndex(index);
                setLightboxOpen(true);
              }}
            />
          </div>
        ))}

        {images.length > 1 && (
          <>
            <button
              onClick={() => {
                goToPrev();
                setIsAutoPlaying(false);
              }}
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors backdrop-blur-sm"
              aria-label="上一张"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                goToNext();
                setIsAutoPlaying(false);
              }}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors backdrop-blur-sm"
              aria-label="下一张"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/40 text-white text-sm rounded-full backdrop-blur-sm font-mono">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {images.length > 1 && isAutoPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10">
            <div
              className="h-full bg-emerald-500 animate-progress"
              style={{
                animationDuration: `${autoPlayInterval}ms`,
              }}
              key={currentIndex}
            />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="pt-2 flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                index === currentIndex
                  ? "ring-2 ring-emerald-500 ring-offset-1 sm:ring-offset-2 opacity-100 scale-105"
                  : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`查看第 ${index + 1} 张图片`}
            >
              <RawImg
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
