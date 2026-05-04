import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, formatUserResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { detail: "无法验证凭据" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(searchParams.get("page_size") || "10", 10), 100);

    const offset = (page - 1) * pageSize;

    const articles = await prisma.article.findMany({
      where: { authorId: currentUser.id },
      include: { author: true, category: true },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: pageSize,
    });

    const result = articles.map((article: (typeof articles)[number]) => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      cover_image: article.coverImage,
      category_id: article.categoryId,
      category: article.category?.name || null,
      status: article.status,
      published_at: article.publishedAt?.toISOString() || null,
      created_at: article.createdAt.toISOString(),
      author: formatUserResponse(article.author),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get my articles error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
