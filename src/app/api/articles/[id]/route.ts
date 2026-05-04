import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getCurrentUserOptional, formatUserResponse } from "@/lib/auth";
import { createArticleHistoryIfNeeded } from "@/lib/article-history";
import { articleUpdateSchema } from "@/lib/validation";
import { revalidateArticle } from "@/lib/revalidate";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { detail: "无效的文章ID" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUserOptional(request);

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true, category: true },
    });

    if (!article) {
      return NextResponse.json(
        { detail: "文章不存在" },
        { status: 404 }
      );
    }

    if (article.status !== "PUBLISHED") {
      if (!currentUser || currentUser.id !== article.authorId) {
        return NextResponse.json(
          { detail: "文章不存在" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Get article error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { detail: "无效的文章ID" },
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

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true },
    });

    if (!article) {
      return NextResponse.json(
        { detail: "文章不存在" },
        { status: 404 }
      );
    }

    if (article.authorId !== currentUser.id) {
      return NextResponse.json(
        { detail: "无权限修改此文章" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = articleUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    const updateData: {
      title?: string;
      content?: string;
      summary?: string;
      coverImage?: string;
      categoryId?: number | null;
      status?: "DRAFT" | "PUBLISHED" | "PRIVATE";
      publishedAt?: Date | null;
    } = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.cover_image !== undefined) updateData.coverImage = data.cover_image;
    if (data.category_id !== undefined) updateData.categoryId = data.category_id;

    if (data.status !== undefined) {
      const currentStatus = article.status;

      updateData.status = data.status;

      if (data.status === "PUBLISHED" && currentStatus !== "PUBLISHED") {
        updateData.publishedAt = new Date();
      } else if (data.status === "PRIVATE") {
        updateData.publishedAt = article.publishedAt || new Date();
      } else if (data.status === "DRAFT") {
        updateData.publishedAt = null;
      }
    }

    const nextStatus = data.status ?? article.status;

    const { updatedArticle, historyCreated } = await prisma.$transaction(async (tx) => {
      const updatedArticle = await tx.article.update({
        where: { id: articleId },
        data: updateData,
        include: { author: true, category: true },
      });

      let historyCreated = false;

      if (nextStatus !== "PRIVATE") {
        const history = await createArticleHistoryIfNeeded(tx, articleId, {
          title: updatedArticle.title,
          content: updatedArticle.content,
          summary: updatedArticle.summary,
          coverImage: updatedArticle.coverImage,
          categoryId: updatedArticle.categoryId,
          categoryName: updatedArticle.category?.name || null,
          status: updatedArticle.status,
        });
        historyCreated = Boolean(history);
      }

      return { updatedArticle, historyCreated };
    });

    revalidateArticle(articleId);

    return NextResponse.json({
      id: updatedArticle.id,
      title: updatedArticle.title,
      content: updatedArticle.content,
      summary: updatedArticle.summary,
      cover_image: updatedArticle.coverImage,
      category_id: updatedArticle.categoryId,
      category: updatedArticle.category?.name || null,
      status: updatedArticle.status,
      published_at: updatedArticle.publishedAt?.toISOString() || null,
      created_at: updatedArticle.createdAt.toISOString(),
      updated_at: updatedArticle.updatedAt.toISOString(),
      author: formatUserResponse(updatedArticle.author),
      history_created: historyCreated,
    });
  } catch (error) {
    console.error("Update article error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { detail: "无效的文章ID" },
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

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        { detail: "文章不存在" },
        { status: 404 }
      );
    }

    if (article.authorId !== currentUser.id) {
      return NextResponse.json(
        { detail: "无权限删除此文章" },
        { status: 403 }
      );
    }

    await prisma.article.delete({
      where: { id: articleId },
    });

    revalidateArticle(articleId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete article error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
