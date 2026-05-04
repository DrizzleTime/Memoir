import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { revalidateMemos } from "@/lib/revalidate";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const offset = (page - 1) * pageSize;

    const [memos, totalCount] = await Promise.all([
      prisma.memo.findMany({
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: pageSize,
      }),
      prisma.memo.count(),
    ]);

    return NextResponse.json({
      data: memos,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("获取 memos 列表失败:", error);
    return NextResponse.json(
      { detail: "获取 memos 列表失败", error: "获取 memos 列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { content, isPublished } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { detail: "内容不能为空", error: "内容不能为空" },
        { status: 400 }
      );
    }

    const memo = await prisma.memo.create({
      data: {
        content: content.trim(),
        isPublished: isPublished ?? false,
      },
    });

    revalidateMemos();

    return NextResponse.json(memo, { status: 201 });
  } catch (error) {
    console.error("创建 memo 失败:", error);
    return NextResponse.json(
      { detail: "创建 memo 失败", error: "创建 memo 失败" },
      { status: 500 }
    );
  }
}
