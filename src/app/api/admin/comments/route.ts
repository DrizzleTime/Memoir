import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatUserResponse } from "@/lib/auth";
import { requireCurrentUser } from "@/lib/api-route";
import { getCommentTargetType } from "@/lib/comments";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(searchParams.get("page_size") || "10", 10), 100);
    const isApproved = searchParams.get("is_approved");
    const query = (searchParams.get("q") || "").trim();

    const where: NonNullable<Parameters<typeof prisma.comment.count>[0]>["where"] = {};
    if (isApproved !== null && isApproved !== undefined && isApproved !== "") {
      where.isApproved = isApproved === "true";
    }
    if (query) {
      where.OR = [
        { content: { contains: query } },
        { guestName: { contains: query } },
        { guestEmail: { contains: query } },
        { guestWebsite: { contains: query } },
        { ipAddress: { contains: query } },
        { article: { is: { title: { contains: query } } } },
        { memo: { is: { content: { contains: query } } } },
        {
          author: {
            is: {
              OR: [
                { username: { contains: query } },
                { email: { contains: query } },
                { nickname: { contains: query } },
              ],
            },
          },
        },
      ];
    }

    const offset = (page - 1) * pageSize;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: true,
          article: {
            select: {
              id: true,
              title: true,
            },
          },
          memo: {
            select: {
              id: true,
              content: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: pageSize,
      }),
      prisma.comment.count({ where }),
    ]);

    const result = comments.map((comment: (typeof comments)[number]) => ({
      target_type: getCommentTargetType(comment),
      id: comment.id,
      content: comment.content,
      article_id: comment.articleId,
      memo_id: comment.memoId,
      article: comment.article
        ? {
            id: comment.article.id,
            title: comment.article.title,
          }
        : null,
      memo: comment.memo
        ? {
            id: comment.memo.id,
            content: comment.memo.content,
          }
        : null,
      author: comment.author ? formatUserResponse(comment.author) : null,
      guest_name: comment.guestName,
      guest_email: comment.guestEmail,
      guest_website: comment.guestWebsite,
      parent_id: comment.parentId,
      is_approved: comment.isApproved,
      ip_address: comment.ipAddress,
      user_agent: comment.userAgent,
      created_at: comment.createdAt.toISOString(),
    }));

    return NextResponse.json({
      items: result,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("List comments error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
