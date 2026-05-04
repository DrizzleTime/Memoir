import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import {
  convertToWebp,
  getWebpPath,
  isConvertibleImage,
  isMemoirWebp,
} from "@/lib/webp";
import fs from "fs";
import path from "path";

/**
 * 批量将图片转换为 WebP 压缩格式（quality=80）
 */

// GET: 预览待转换的文件列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const uploadsRoot = path.join(process.cwd(), "data", "uploads");

    // 获取所有图片文件
    const files = await prisma.uploadFile.findMany({
      where: {
        isMissing: false,
      },
      select: {
        id: true,
        relativePath: true,
        size: true,
        mimeType: true,
      },
    });

    // 筛选出可转换的图片（排除已经是 memoir.webp 的文件）
    const convertibleFiles: {
      id: number;
      relativePath: string;
      size: number;
      hasWebp: boolean;
    }[] = [];

    let pendingCount = 0;
    let existingCount = 0;
    let totalOriginalSize = 0;

    for (const file of files) {
      // 跳过 memoir.webp 文件
      if (isMemoirWebp(file.relativePath)) {
        continue;
      }

      // 只处理可转换的图片
      if (!isConvertibleImage(file.relativePath)) {
        continue;
      }

      const absolutePath = path.join(uploadsRoot, ...file.relativePath.split("/"));
      const webpPath = getWebpPath(absolutePath);
      const hasWebp = fs.existsSync(webpPath);

      if (hasWebp) {
        existingCount++;
      } else {
        pendingCount++;
        totalOriginalSize += file.size;
      }

      convertibleFiles.push({
        id: file.id,
        relativePath: file.relativePath,
        size: file.size,
        hasWebp,
      });
    }

    // 只返回待转换的文件
    const pendingFiles = convertibleFiles
      .filter((file: (typeof convertibleFiles)[number]) => !file.hasWebp)
      .slice(0, 100);

    return NextResponse.json({
      totalImages: convertibleFiles.length,
      pendingCount,
      existingCount,
      totalOriginalSize,
      files: pendingFiles,
      hasMore: pendingCount > 100,
    });
  } catch (error) {
    console.error("获取待转换图片列表失败:", error);
    return NextResponse.json({ error: "获取列表失败" }, { status: 500 });
  }
}

// POST: 执行批量转换
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const uploadsRoot = path.join(process.cwd(), "data", "uploads");

    // 获取所有图片文件
    const files = await prisma.uploadFile.findMany({
      where: {
        isMissing: false,
      },
      select: {
        id: true,
        relativePath: true,
        originalName: true,
        size: true,
      },
    });

    let converted = 0;
    let skipped = 0;
    let failed = 0;
    let totalWebpSize = 0;
    let totalOriginalSize = 0;

    for (const file of files) {
      // 跳过 memoir.webp 文件
      if (isMemoirWebp(file.relativePath)) {
        skipped++;
        continue;
      }

      // 只处理可转换的图片
      if (!isConvertibleImage(file.relativePath)) {
        skipped++;
        continue;
      }

      const absolutePath = path.join(uploadsRoot, ...file.relativePath.split("/"));

      // 检查原文件是否存在
      if (!fs.existsSync(absolutePath)) {
        skipped++;
        continue;
      }

      // 检查是否已有 WebP 版本
      const webpPath = getWebpPath(absolutePath);
      if (fs.existsSync(webpPath)) {
        skipped++;
        continue;
      }

      // 执行转换
      const result = await convertToWebp(absolutePath);
      if (result) {
        converted++;
        totalWebpSize += result.size;
        totalOriginalSize += file.size;
      } else {
        failed++;
      }
    }

    return NextResponse.json({
      converted,
      skipped,
      failed,
      totalWebpSize,
      totalOriginalSize,
      savedSize: totalOriginalSize - totalWebpSize,
    });
  } catch (error) {
    console.error("批量转换 WebP 失败:", error);
    return NextResponse.json({ error: "转换失败" }, { status: 500 });
  }
}
