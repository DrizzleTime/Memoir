import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNumericId, requireCurrentUser } from "@/lib/api-route";
import { revalidateCommentTarget } from "@/lib/revalidate";

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { detail: "请提供要删除的评论ID列表" },
        { status: 400 }
      );
    }

    const commentIds = ids.map((id: unknown) => {
      const numId = parseNumericId(String(id));
      if (numId === null) {
        throw new Error("无效的评论ID");
      }
      return numId;
    });

    const comments = await prisma.comment.findMany({
      where: {
        id: { in: commentIds },
      },
      select: {
        articleId: true,
        memoId: true,
      },
    });

    const result = await prisma.comment.deleteMany({
      where: {
        id: { in: commentIds },
      },
    });

    const targets = new Set(
      comments.map((comment) => `${comment.articleId || ""}:${comment.memoId || ""}`)
    );

    for (const target of targets) {
      const [articleIdRaw, memoIdRaw] = target.split(":");
      revalidateCommentTarget({
        articleId: articleIdRaw ? Number(articleIdRaw) : null,
        memoId: memoIdRaw ? Number(memoIdRaw) : null,
      });
    }

    return NextResponse.json({
      deleted_count: result.count,
      message: `成功删除 ${result.count} 条评论`,
    });
  } catch (error) {
    console.error("Batch delete comments error:", error);
    if (error instanceof Error && error.message === "无效的评论ID") {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
