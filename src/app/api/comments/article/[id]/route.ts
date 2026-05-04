import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicArticleRecord } from "@/lib/public-content";
import { buildPublicCommentTree } from "@/lib/comments";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { detail: "无效的文章ID" },
        { status: 400 }
      );
    }

    const article = await getPublicArticleRecord(articleId);
    if (!article) {
      return NextResponse.json(
        { detail: "文章不存在" },
        { status: 404 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        articleId,
        isApproved: true,
      },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });

    const tree = buildPublicCommentTree(comments);

    return NextResponse.json(tree);
  } catch (error) {
    console.error("Get article comments error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
