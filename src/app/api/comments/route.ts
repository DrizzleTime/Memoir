import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOptional } from "@/lib/auth";
import { mapCommentResponse } from "@/lib/comments";
import { commentCreateSchema } from "@/lib/validation";
import { revalidateCommentTarget } from "@/lib/revalidate";
import { resolveSiteUrl } from "@/lib/site";
import {
  sendNewCommentNotifyToAdmin,
  sendReplyNotifyToCommenter,
} from "@/lib/email";
import { getClientIp } from "@/lib/visits";
import type { CommentTargetType } from "@/types";

async function getCommentTarget(type: CommentTargetType, id: number) {
  if (type === "article") {
    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article || article.status !== "PUBLISHED") {
      return null;
    }

    return {
      type,
      id,
      articleId: article.id,
      memoId: null,
      title: article.title,
      typeLabel: "文章",
      url: await resolveSiteUrl(`/article/${article.id}`),
    };
  }

  const memo = await prisma.memo.findUnique({
    where: { id },
  });

  if (!memo || !memo.isPublished) {
    return null;
  }

  return {
    type,
    id,
    articleId: null,
    memoId: memo.id,
    title: `动态 #${memo.id}`,
    typeLabel: "动态",
    url: await resolveSiteUrl(`/now#memo-${memo.id}`),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = commentCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;
    const currentUser = await getCurrentUserOptional(request);
    const target = await getCommentTarget(data.target_type, data.target_id);

    if (!target) {
      return NextResponse.json(
        { detail: `${data.target_type === "article" ? "文章" : "动态"}不存在` },
        { status: 404 }
      );
    }

    let parentComment: {
      id: number;
      articleId: number | null;
      memoId: number | null;
      content: string;
      guestName: string | null;
      guestEmail: string | null;
      author: {
        id: number;
        email: string;
        nickname: string | null;
        username: string;
      } | null;
    } | null = null;

    if (data.parent_id) {
      parentComment = await prisma.comment.findUnique({
        where: { id: data.parent_id },
        select: {
          id: true,
          articleId: true,
          memoId: true,
          content: true,
          guestName: true,
          guestEmail: true,
          author: {
            select: { id: true, email: true, nickname: true, username: true },
          },
        },
      });

      const parentMatched =
        parentComment &&
        parentComment.articleId === target.articleId &&
        parentComment.memoId === target.memoId;

      if (!parentMatched) {
        return NextResponse.json(
          { detail: `父评论不存在或不属于该${target.typeLabel}` },
          { status: 404 }
        );
      }
    }

    if (!currentUser && (!data.guest_name || !data.guest_email)) {
      return NextResponse.json(
        { detail: "未登录用户必须提供昵称和邮箱" },
        { status: 400 }
      );
    }

    const ipAddress = getClientIp(request);
    const userAgent = (request.headers.get("user-agent") || "").slice(0, 255);

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        articleId: target.articleId,
        memoId: target.memoId,
        authorId: currentUser?.id || null,
        guestName: currentUser ? null : data.guest_name,
        guestEmail: currentUser ? null : data.guest_email,
        guestWebsite: currentUser ? null : data.guest_website,
        parentId: data.parent_id || null,
        ipAddress,
        userAgent,
      },
      include: { author: true },
    });

    const commenterName = currentUser
      ? currentUser.nickname || currentUser.username
      : data.guest_name || "匿名用户";
    const notifyData = {
      targetTitle: target.title,
      targetUrl: target.url,
      targetTypeLabel: target.typeLabel,
      createdAt: comment.createdAt,
      commenterName,
      commentContent: data.content,
      isReply: !!data.parent_id,
      parentCommenterName: parentComment
        ? parentComment.author?.nickname ||
          parentComment.author?.username ||
          parentComment.guestName ||
          "匿名用户"
        : undefined,
      parentCommentContent: parentComment?.content,
    };

    sendNewCommentNotifyToAdmin(notifyData).catch((err) => {
      console.error("发送管理员通知失败:", err);
    });

    if (parentComment) {
      const parentEmail = parentComment.author?.email || parentComment.guestEmail;
      const currentEmail = currentUser?.email || data.guest_email;

      if (parentEmail && parentEmail !== currentEmail) {
        sendReplyNotifyToCommenter(parentEmail, notifyData).catch((err) => {
          console.error("发送回复通知失败:", err);
        });
      }
    }

    revalidateCommentTarget({
      articleId: comment.articleId,
      memoId: comment.memoId,
    });

    return NextResponse.json(mapCommentResponse(comment), { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
