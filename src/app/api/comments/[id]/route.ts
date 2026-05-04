import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { mapCommentResponse } from "@/lib/comments";
import { commentUpdateSchema } from "@/lib/validation";
import { revalidateCommentTarget } from "@/lib/revalidate";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { detail: "无效的评论ID" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });

    if (!comment) {
      return NextResponse.json(
        { detail: "评论不存在" },
        { status: 404 }
      );
    }

    const replies = await prisma.comment.findMany({
      where: {
        parentId: commentId,
        isApproved: true,
      },
      include: { author: true },
    });

    const response = mapCommentResponse(comment);
    response.replies = replies.map(mapCommentResponse);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get comment error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { detail: "无效的评论ID" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { detail: "无法验证凭据" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });

    if (!comment) {
      return NextResponse.json(
        { detail: "评论不存在" },
        { status: 404 }
      );
    }

    if (!comment.author || comment.author.id !== currentUser.id) {
      return NextResponse.json(
        { detail: "无权限修改此评论" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = commentUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;
    const updateData: { content?: string; isApproved?: boolean } = {};

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (data.is_approved !== undefined) {
      updateData.isApproved = data.is_approved;
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: updateData,
      include: { author: true },
    });

    revalidateCommentTarget({
      articleId: updatedComment.articleId,
      memoId: updatedComment.memoId,
    });

    return NextResponse.json(mapCommentResponse(updatedComment));
  } catch (error) {
    console.error("Update comment error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { detail: "无效的评论ID" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { detail: "无法验证凭据" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
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

    if (!comment.authorId || comment.authorId !== currentUser.id) {
      return NextResponse.json(
        { detail: "无权限删除此评论" },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidateCommentTarget({
      articleId: comment.articleId,
      memoId: comment.memoId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
