"use client";

import { useState, useEffect } from "react";
import EXIF from "exif-js";

export interface ExifData {
  make?: string;
  model?: string;
  fNumber?: string;
  exposureTime?: string;
  iso?: number;
  focalLength?: string;
  dateTimeOriginal?: string;
  width?: number;
  height?: number;
}

function formatExposureTime(exposureTime: number): string {
  if (exposureTime >= 1) {
    return `${exposureTime}s`;
  }
  const denominator = Math.round(1 / exposureTime);
  return `1/${denominator}s`;
}

function formatFNumber(fNumber: number): string {
  return `f/${fNumber}`;
}

function formatFocalLength(focalLength: number): string {
  return `${focalLength}mm`;
}

function formatDateTime(dateTime: string): string {
  const parts = dateTime.split(" ");
  if (parts.length === 2) {
    const datePart = parts[0].replace(/:/g, "-");
    const timePart = parts[1];
    return `${datePart} ${timePart}`;
  }
  return dateTime;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "object" || value === null) return null;
  const numerator = (value as { numerator?: unknown }).numerator;
  const denominator = (value as { denominator?: unknown }).denominator;
  if (typeof numerator !== "number" || typeof denominator !== "number" || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

export function useExif(imageSrc: string | null): {
  exifData: ExifData | null;
  loading: boolean;
} {
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageSrc) {
      queueMicrotask(() => {
        setExifData(null);
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => {
      setLoading(true);
      setExifData(null);
    });

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        EXIF.getData(img, () => {
          const allTags = EXIF.getAllTags(img);

          if (Object.keys(allTags).length === 0) {
            setExifData(null);
            setLoading(false);
            return;
          }

          const data: ExifData = {};

          if (allTags.Make) {
            data.make = String(allTags.Make).trim();
          }
          if (allTags.Model) {
            data.model = String(allTags.Model).trim();
          }

          if (allTags.FNumber) {
            const fNumber = toNumber(allTags.FNumber);
            if (fNumber !== null) data.fNumber = formatFNumber(fNumber);
          }

          if (allTags.ExposureTime) {
            const exposureTime = toNumber(allTags.ExposureTime);
            if (exposureTime !== null) data.exposureTime = formatExposureTime(exposureTime);
          }

          if (allTags.ISOSpeedRatings) {
            const iso = allTags.ISOSpeedRatings;
            if (typeof iso === "number") {
              data.iso = iso;
            } else if (Array.isArray(iso) && typeof iso[0] === "number") {
              data.iso = iso[0];
            }
          }

          if (allTags.FocalLength) {
            const focalLength = toNumber(allTags.FocalLength);
            if (focalLength !== null) data.focalLength = formatFocalLength(focalLength);
          }

          if (allTags.DateTimeOriginal) {
            data.dateTimeOriginal = formatDateTime(
              String(allTags.DateTimeOriginal)
            );
          }

          if (allTags.PixelXDimension) {
            const width = allTags.PixelXDimension;
            if (typeof width === "number") data.width = width;
          }
          if (allTags.PixelYDimension) {
            const height = allTags.PixelYDimension;
            if (typeof height === "number") data.height = height;
          }

          setExifData(Object.keys(data).length > 0 ? data : null);
          setLoading(false);
        });
      } catch {
        setExifData(null);
        setLoading(false);
      }
    };

    img.onerror = () => {
      setExifData(null);
      setLoading(false);
    };

    img.src = imageSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc]);

  return { exifData, loading };
}
