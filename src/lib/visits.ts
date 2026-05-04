import type { NextRequest } from "next/server";
import { md5 } from "@/lib/md5";

const IGNORED_PUBLIC_PATH_PREFIXES = [
  "/admin",
  "/api",
  "/install",
  "/uploads",
  "/_next",
];

const IGNORED_PUBLIC_PATHS = new Set([
  "/feed",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

export function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return "unknown";
}

export function normalizeVisitPath(path: string): string {
  const trimmedPath = path.trim();
  if (!trimmedPath) return "/";

  try {
    const url = new URL(trimmedPath, "http://memoir.local");
    return `${url.pathname}${url.search}`;
  } catch {
    return trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
  }
}

export function isPublicVisitPath(path: string): boolean {
  const pathname = normalizeVisitPath(path).split("?")[0];
  if (IGNORED_PUBLIC_PATHS.has(pathname)) return false;

  return !IGNORED_PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function buildVisitorKey(ipAddress: string, userAgent: string): string {
  return md5(`${ipAddress}|${userAgent}`);
}

export function parseDeviceInfo(userAgent: string) {
  const normalizedUserAgent = userAgent.toLowerCase();
  const deviceType = /ipad|tablet/.test(normalizedUserAgent)
    ? "tablet"
    : /mobile|iphone|android/.test(normalizedUserAgent)
      ? "mobile"
      : userAgent
        ? "desktop"
        : "unknown";

  const browser = normalizedUserAgent.includes("edg/")
    ? "Edge"
    : normalizedUserAgent.includes("chrome/")
      ? "Chrome"
      : normalizedUserAgent.includes("safari/") && !normalizedUserAgent.includes("chrome/")
        ? "Safari"
        : normalizedUserAgent.includes("firefox/")
          ? "Firefox"
          : normalizedUserAgent.includes("opr/")
            ? "Opera"
            : "unknown";

  const os = normalizedUserAgent.includes("windows")
    ? "Windows"
    : normalizedUserAgent.includes("mac os x")
      ? "macOS"
      : normalizedUserAgent.includes("android")
        ? "Android"
        : /iphone|ipad|ipod/.test(normalizedUserAgent)
          ? "iOS"
          : normalizedUserAgent.includes("linux")
            ? "Linux"
            : "unknown";

  return { deviceType, browser, os };
}

export function getTodayRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}
