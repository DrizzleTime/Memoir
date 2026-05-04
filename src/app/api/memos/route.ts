import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const offset = (page - 1) * pageSize;

    const [memos, totalCount] = await Promise.all([
      prisma.memo.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: pageSize + 1,
      }),
      prisma.memo.count({ where: { isPublished: true } }),
    ]);

    const hasMore = memos.length > pageSize;
    const data = memos.slice(0, pageSize);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        totalCount,
        hasMore,
      },
    });
  } catch (error) {
    console.error("获取 memos 失败:", error);
    return NextResponse.json({ error: "获取 memos 失败" }, { status: 500 });
  }
}
