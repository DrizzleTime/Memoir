import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNumericId, requireCurrentUser } from "@/lib/api-route";
import { revalidateCommentTarget } from "@/lib/revalidate";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const commentId = parseNumericId(id);
    if (commentId === null) {
      return NextResponse.json(
        { detail: "无效的评论 ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const isApproved = body.is_approved;

    if (typeof isApproved !== "boolean") {
      return NextResponse.json(
        { detail: "is_approved 必须是布尔值" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { detail: "评论不存在" },
        { status: 404 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { isApproved },
    });

    revalidateCommentTarget({
      articleId: updatedComment.articleId,
      memoId: updatedComment.memoId,
    });

    return NextResponse.json({
      id: updatedComment.id,
      is_approved: updatedComment.isApproved,
      message: isApproved ? "评论已通过审核" : "评论已拒绝",
    });
  } catch (error) {
    console.error("Approve comment error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
