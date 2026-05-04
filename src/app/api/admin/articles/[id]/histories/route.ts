import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNumericId, requireCurrentUser } from "@/lib/api-route";

interface RouteParams {
  params: Promise<{ id: string }>;
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const articleId = parseNumericId(id);
    if (articleId === null) {
      return NextResponse.json({ detail: "无效的文章ID" }, { status: 400 });
    }

    const result = await ensureOwnedArticle(request, articleId);
    if ("error" in result) {
      return result.error;
    }

    const histories = await prisma.articleHistory.findMany({
      where: { articleId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      histories.map((history) => ({
        id: history.id,
        name: history.name,
        status: history.status,
        created_at: history.createdAt.toISOString(),
        updated_at: history.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("List article histories error:", error);
    return NextResponse.json({ detail: "服务器内部错误" }, { status: 500 });
  }
}
