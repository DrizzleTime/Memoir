import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { isImageFile } from "@/lib/file-meta";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const missing = searchParams.get("missing");
    const query = (searchParams.get("q") || "").trim();
    const type = searchParams.get("type");

    const where: NonNullable<Parameters<typeof prisma.uploadFile.count>[0]>["where"] = {};
    if (missing === "true") where.isMissing = true;
    if (missing === "false") where.isMissing = false;
    if (query) {
      where.OR = [
        { relativePath: { contains: query } },
        { originalName: { contains: query } },
        { mimeType: { contains: query } },
      ];
    }

    const offset = (page - 1) * pageSize;

    const [files, totalCount] = await Promise.all([
      prisma.uploadFile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: type === "image" ? undefined : offset,
        take: type === "image" ? undefined : pageSize,
      }),
      prisma.uploadFile.count({ where }),
    ]);

    const filteredFiles = type === "image" ? files.filter(isImageFile) : files;
    const pagedFiles = type === "image"
      ? filteredFiles.slice(offset, offset + pageSize)
      : filteredFiles;
    const filteredCount = type === "image" ? filteredFiles.length : totalCount;

    return NextResponse.json({
      data: pagedFiles,
      pagination: {
        page,
        pageSize,
        totalCount: filteredCount,
        totalPages: Math.ceil(filteredCount / pageSize),
      },
    });
  } catch (error) {
    console.error("获取文件列表失败:", error);
    return NextResponse.json({ error: "获取文件列表失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const result = await prisma.uploadFile.deleteMany({});

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("清空文件索引失败:", error);
    return NextResponse.json({ error: "清空文件索引失败" }, { status: 500 });
  }
}
