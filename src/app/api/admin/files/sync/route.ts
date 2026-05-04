import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { isMemoirWebp, WEBP_SUFFIX } from "@/lib/webp";
import fs from "fs";
import path from "path";

function getMimeTypeByExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".zip") return "application/zip";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".woff") return "font/woff";
  if (ext === ".woff2") return "font/woff2";
  if (ext === ".ttf") return "font/ttf";
  if (ext === ".eot") return "application/vnd.ms-fontobject";
  if (ext === ".html") return "text/html";
  if (ext === ".css") return "text/css";
  if (ext === ".js") return "application/javascript";
  if (ext === ".json") return "application/json";
  return null;
}

function scanUploadsDir(uploadsRoot: string) {
  const diskFiles: Array<{
    relativePath: string;
    size: number;
    mimeType: string | null;
    createdAt: Date;
  }> = [];

  if (!fs.existsSync(uploadsRoot)) {
    return diskFiles;
  }

  const yearDirs = fs.readdirSync(uploadsRoot, { withFileTypes: true });
  for (const yearDir of yearDirs) {
    if (!yearDir.isDirectory() || !/^\d{4}$/.test(yearDir.name)) continue;
    const year = yearDir.name;

    const yearPath = path.join(uploadsRoot, year);
    const monthDirs = fs.readdirSync(yearPath, { withFileTypes: true });
    for (const monthDir of monthDirs) {
      if (!monthDir.isDirectory() || !/^\d{2}$/.test(monthDir.name)) continue;
      const month = monthDir.name;

      const monthPath = path.join(yearPath, month);
      const fileEntries = fs.readdirSync(monthPath, { withFileTypes: true });
      for (const fileEntry of fileEntries) {
        if (!fileEntry.isFile()) continue;
        if (isMemoirWebp(fileEntry.name)) continue;

        const absolutePath = path.join(monthPath, fileEntry.name);
        const stat = fs.statSync(absolutePath);
        diskFiles.push({
          relativePath: path.posix.join(year, month, fileEntry.name),
          size: stat.size,
          mimeType: getMimeTypeByExt(absolutePath),
          createdAt: stat.birthtime,
        });
      }
    }
  }

  return diskFiles;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const uploadsRoot = path.join(process.cwd(), "data", "uploads");
    const diskFiles = scanUploadsDir(uploadsRoot);

    const webpDeleteResult = await prisma.uploadFile.deleteMany({
      where: { relativePath: { endsWith: WEBP_SUFFIX } },
    });

    const dbFiles = await prisma.uploadFile.findMany({
      select: { relativePath: true, isMissing: true },
    });

    const diskSet = new Set(
      diskFiles.map((file: (typeof diskFiles)[number]) => file.relativePath)
    );
    const dbMap = new Map(
      dbFiles.map((file: (typeof dbFiles)[number]) => [file.relativePath, file.isMissing])
    );

    let created = 0;
    let updated = 0;
    let restored = 0;

    for (const diskFile of diskFiles) {
      if (dbMap.has(diskFile.relativePath)) {
        const wasMissing = dbMap.get(diskFile.relativePath) === true;
        await prisma.uploadFile.update({
          where: { relativePath: diskFile.relativePath },
          data: {
            size: diskFile.size,
            mimeType: diskFile.mimeType,
            isMissing: false,
          },
        });
        if (wasMissing) {
          restored += 1;
        } else {
          updated += 1;
        }
        continue;
      }

      await prisma.uploadFile.create({
        data: {
          relativePath: diskFile.relativePath,
          originalName: path.posix.basename(diskFile.relativePath),
          mimeType: diskFile.mimeType,
          size: diskFile.size,
          isMissing: false,
          createdAt: diskFile.createdAt,
        },
      });
      created += 1;
    }

    const missingPaths = dbFiles
      .filter(
        (file: (typeof dbFiles)[number]) =>
          !diskSet.has(file.relativePath) && file.isMissing === false
      )
      .map((file: (typeof dbFiles)[number]) => file.relativePath);

    if (missingPaths.length > 0) {
      await prisma.uploadFile.updateMany({
        where: { relativePath: { in: missingPaths } },
        data: { isMissing: true },
      });
    }

    return NextResponse.json({
      scanned: diskFiles.length,
      dbCount: dbFiles.length,
      created,
      updated,
      restored,
      markedMissing: missingPaths.length,
      deletedWebpRecords: webpDeleteResult.count,
    });
  } catch (error) {
    console.error("扫描同步失败:", error);
    return NextResponse.json({ error: "扫描同步失败" }, { status: 500 });
  }
}
