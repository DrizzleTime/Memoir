import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { isMemoirWebp, WEBP_SUFFIX } from "@/lib/webp";
import fs from "fs";
import path from "path";

/**
 * 清理 WebP 转化图（后缀为 -memoir.webp 的文件）。
 * 会同时删除磁盘文件与数据库记录。
 */

function scanConvertedWebpFiles(uploadsRoot: string) {
  const diskFiles: Array<{ relativePath: string; size: number }> = [];

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
        if (!isMemoirWebp(fileEntry.name)) continue;

        const absolutePath = path.join(monthPath, fileEntry.name);
        const stat = fs.statSync(absolutePath);
        diskFiles.push({
          relativePath: path.posix.join(year, month, fileEntry.name),
          size: stat.size,
        });
      }
    }
  }

  return diskFiles;
}

// GET: 预览要删除的文件列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const uploadsRoot = path.join(process.cwd(), "data", "uploads");
    const webpFiles = scanConvertedWebpFiles(uploadsRoot);
    const totalSize = webpFiles.reduce(
      (acc, file: (typeof webpFiles)[number]) => acc + file.size,
      0
    );

    return NextResponse.json({
      count: webpFiles.length,
      totalSize,
      suffix: WEBP_SUFFIX,
      files: webpFiles.slice(0, 100),
      hasMore: webpFiles.length > 100,
    });
  } catch (error) {
    console.error("获取 WebP 转化图列表失败:", error);
    return NextResponse.json({ error: "获取列表失败" }, { status: 500 });
  }
}

// DELETE: 执行删除操作
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const uploadsRoot = path.join(process.cwd(), "data", "uploads");
    const webpFiles = scanConvertedWebpFiles(uploadsRoot);
    let deletedCount = 0;
    let deletedSize = 0;
    let errorCount = 0;

    for (const file of webpFiles) {
      try {
        const absolutePath = path.join(uploadsRoot, ...file.relativePath.split("/"));
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
        }

        deletedCount++;
        deletedSize += file.size;
      } catch (err) {
        console.error(`删除文件失败: ${file.relativePath}`, err);
        errorCount++;
      }
    }

    const dbDeleteResult = await prisma.uploadFile.deleteMany({
      where: { relativePath: { endsWith: WEBP_SUFFIX } },
    });

    return NextResponse.json({
      deletedCount,
      deletedSize,
      errorCount,
      totalFound: webpFiles.length,
      deletedDbRecords: dbDeleteResult.count,
    });
  } catch (error) {
    console.error("清理 WebP 转化图失败:", error);
    return NextResponse.json({ error: "清理失败" }, { status: 500 });
  }
}
