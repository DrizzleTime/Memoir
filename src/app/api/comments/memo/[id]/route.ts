import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicMemoRecord } from "@/lib/public-content";
import { buildPublicCommentTree } from "@/lib/comments";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const memoId = parseInt(id, 10);

    if (isNaN(memoId)) {
      return NextResponse.json(
        { detail: "无效的动态ID" },
        { status: 400 }
      );
    }

    const memo = await getPublicMemoRecord(memoId);
    if (!memo) {
      return NextResponse.json(
        { detail: "动态不存在" },
        { status: 404 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        memoId,
        isApproved: true,
      },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });

    const tree = buildPublicCommentTree(comments);

    return NextResponse.json(tree);
  } catch (error) {
    console.error("Get memo comments error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
