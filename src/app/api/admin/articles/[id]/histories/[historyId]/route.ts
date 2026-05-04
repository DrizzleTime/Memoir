import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNumericId, requireCurrentUser } from "@/lib/api-route";

interface RouteParams {
  params: Promise<{ id: string; historyId: string }>;
}

async function ensureOwnedArticle(request: NextRequest, articleId: number) {
  const currentUser = await requireCurrentUser(request);
  if (currentUser instanceof NextResponse) {
    return { error: currentUser };
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, authorId: true },
  });

  if (!article) {
    return {
      error: NextResponse.json({ detail: "文章不存在" }, { status: 404 }),
    };
  }

  if (article.authorId !== currentUser.id) {
    return {
      error: NextResponse.json({ detail: "无权限访问此文章" }, { status: 403 }),
    };
  }

  return { article };
}

function formatHistoryResponse(history: {
  id: number;
  articleId: number;
  name: string;
  title: string;
  content: string;
  summary: string | null;
  coverImage: string | null;
  categoryId: number | null;
  categoryName: string | null;
  status: "DRAFT" | "PUBLISHED" | "PRIVATE";
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: history.id,
    article_id: history.articleId,
    name: history.name,
    title: history.title,
    content: history.content,
    summary: history.summary,
    cover_image: history.coverImage,
    category_id: history.categoryId,
    category_name: history.categoryName,
    status: history.status,
    created_at: history.createdAt.toISOString(),
    updated_at: history.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, historyId } = await params;
    const articleId = parseNumericId(id);
    const parsedHistoryId = parseNumericId(historyId);
    if (articleId === null || parsedHistoryId === null) {
      return NextResponse.json({ detail: "参数错误" }, { status: 400 });
    }

    const result = await ensureOwnedArticle(request, articleId);
    if ("error" in result) {
      return result.error;
    }

    const history = await prisma.articleHistory.findFirst({
      where: {
        id: parsedHistoryId,
        articleId,
      },
    });

    if (!history) {
      return NextResponse.json({ detail: "历史版本不存在" }, { status: 404 });
    }

    return NextResponse.json(formatHistoryResponse(history));
  } catch (error) {
    console.error("Get article history error:", error);
    return NextResponse.json({ detail: "服务器内部错误" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, historyId } = await params;
    const articleId = parseNumericId(id);
    const parsedHistoryId = parseNumericId(historyId);
    if (articleId === null || parsedHistoryId === null) {
      return NextResponse.json({ detail: "参数错误" }, { status: 400 });
    }

    const result = await ensureOwnedArticle(request, articleId);
    if ("error" in result) {
      return result.error;
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ detail: "名称不能为空" }, { status: 400 });
    }

    if (name.length > 200) {
      return NextResponse.json({ detail: "名称不能超过 200 个字符" }, { status: 400 });
    }

    const existingHistory = await prisma.articleHistory.findFirst({
      where: {
        id: parsedHistoryId,
        articleId,
      },
      select: { id: true },
    });

    if (!existingHistory) {
      return NextResponse.json({ detail: "历史版本不存在" }, { status: 404 });
    }

    const history = await prisma.articleHistory.update({
      where: { id: parsedHistoryId },
      data: { name },
    });

    return NextResponse.json(formatHistoryResponse(history));
  } catch (error) {
    console.error("Rename article history error:", error);
    return NextResponse.json({ detail: "服务器内部错误" }, { status: 500 });
  }
}
