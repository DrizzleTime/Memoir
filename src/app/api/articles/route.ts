import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getCurrentUserOptional, formatUserResponse } from "@/lib/auth";
import { ARTICLE_STATUS_VALUES } from "@/lib/article-status";
import { createArticleHistoryIfNeeded } from "@/lib/article-history";
import { buildArticleStatusWhere, buildPublishedArticleWhere } from "@/lib/article-status.server";
import { articleCreateSchema } from "@/lib/validation";
import { revalidateArticle } from "@/lib/revalidate";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(parseInt(searchParams.get("page_size") || "10", 10), 100);
    const categoryId = searchParams.get("category_id");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const query = (searchParams.get("q") || "").trim();

    const currentUser = await getCurrentUserOptional(request);

    const where: NonNullable<Parameters<typeof prisma.article.count>[0]>["where"] = {};

    if (!currentUser) {
      Object.assign(where, buildPublishedArticleWhere());
    } else {
      where.authorId = currentUser.id;
      if (
        status &&
        ARTICLE_STATUS_VALUES.includes(
          status as (typeof ARTICLE_STATUS_VALUES)[number]
        )
      ) {
        Object.assign(where, buildArticleStatusWhere(status as (typeof ARTICLE_STATUS_VALUES)[number]));
      }
    }

    if (query) {
      where.title = { contains: query };
    }

    if (categoryId) {
      const parsed = parseInt(categoryId, 10);
      if (!isNaN(parsed)) {
        where.categoryId = parsed;
      }
    } else if (category) {
      where.category = {
        is: {
          OR: [{ name: category }, { slug: category }],
        },
      };
    }

    const offset = (page - 1) * pageSize;

    const [orderedArticles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: { author: true, category: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: offset,
        take: pageSize,
      }),
      prisma.article.count({ where }),
    ]);

    const result = orderedArticles.map((article: (typeof orderedArticles)[number]) => ({
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

    return NextResponse.json({
      items: result,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("List articles error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { detail: "无法验证凭据" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    const body = await request.json();
    const result = articleCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    const { article, historyCreated } = await prisma.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          title: data.title,
          content: data.content,
          summary: data.summary,
          coverImage: data.cover_image,
          categoryId: data.category_id ?? null,
          status: data.status,
          publishedAt:
            data.status === "DRAFT"
              ? null
              : new Date(),
          authorId: currentUser.id,
        },
        include: { author: true, category: true },
      });

      let historyCreated = false;

      if (data.status !== "PRIVATE") {
        const history = await createArticleHistoryIfNeeded(tx, article.id, {
          title: article.title,
          content: article.content,
          summary: article.summary,
          coverImage: article.coverImage,
          categoryId: article.categoryId,
          categoryName: article.category?.name || null,
          status: article.status,
        });
        historyCreated = Boolean(history);
      }

      return { article, historyCreated };
    });

    revalidateArticle(article.id);

    return NextResponse.json(
      {
        id: article.id,
        title: article.title,
        content: article.content,
        summary: article.summary,
        cover_image: article.coverImage,
        category_id: article.categoryId,
        category: article.category?.name || null,
        status: article.status,
        published_at: article.publishedAt?.toISOString() || null,
        created_at: article.createdAt.toISOString(),
        updated_at: article.updatedAt.toISOString(),
        author: formatUserResponse(article.author),
        history_created: historyCreated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create article error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
