import { NextRequest, NextResponse } from "next/server";
import {
  CONVERTIBLE_EXTENSIONS,
  WEBP_SUFFIX,
  getWebpPath,
  isConvertibleImage,
  isMemoirWebp,
} from "@/lib/webp";
import fs from "fs";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const requestedRelativePath = pathSegments.join("/");

  const uploadsDir = path.resolve(process.cwd(), "data", "uploads");
  let resolvedPath = path.resolve(uploadsDir, ...pathSegments);
  const relativeToUploads = path.relative(uploadsDir, resolvedPath);
  if (relativeToUploads.startsWith("..") || path.isAbsolute(relativeToUploads)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 如果请求的是图片文件（非 memoir.webp），检查是否有 WebP 版本
  // 并且客户端支持 WebP 格式，则优先返回 WebP 版本
  const acceptHeader = request.headers.get("accept") || "";
  const supportsWebp = acceptHeader.includes("image/webp");

  if (
    supportsWebp &&
    isConvertibleImage(resolvedPath) &&
    !isMemoirWebp(resolvedPath)
  ) {
    const webpPath = getWebpPath(resolvedPath);
    if (fs.existsSync(webpPath)) {
      resolvedPath = webpPath;
    }
  }

  if (!fs.existsSync(resolvedPath)) {
    if (requestedRelativePath.endsWith(WEBP_SUFFIX)) {
      const baseRelativePath = requestedRelativePath.slice(0, -WEBP_SUFFIX.length);
      const candidates = CONVERTIBLE_EXTENSIONS.map(
        (ext) => `${baseRelativePath}${ext}`
      );

      const existingRelativePath = candidates.find((relativePath) =>
        fs.existsSync(path.join(uploadsDir, ...relativePath.split("/")))
      );
      if (existingRelativePath) {
        return new NextResponse(null, {
          status: 302,
          headers: {
            Location: `/uploads/${existingRelativePath}`,
            "Cache-Control": "no-store",
          },
        });
      }
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const file = fs.readFileSync(resolvedPath);
  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  return new NextResponse(file, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      // 告诉 CDN/代理根据 Accept 头缓存不同版本
      "Vary": "Accept",
    },
  });
}
