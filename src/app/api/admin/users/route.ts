import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatUserResponse } from "@/lib/auth";
import { requireCurrentUser } from "@/lib/api-route";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(searchParams.get("page_size") || "10", 10), 100);

    const offset = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: pageSize,
        include: {
          _count: {
            select: {
              articles: true,
              comments: true,
            },
          },
        },
      }),
      prisma.user.count(),
    ]);

    const result = users.map((user: (typeof users)[number]) => ({
      ...formatUserResponse(user),
      article_count: user._count.articles,
      comment_count: user._count.comments,
    }));

    return NextResponse.json({
      items: result,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
