import type { Prisma } from "@/generated/prisma/client";
import type { ArticleStatus } from "@/lib/article-status";

export function buildArticleStatusWhere(
  status: ArticleStatus
): Prisma.ArticleWhereInput {
  return { status };
}

export function buildPublishedArticleWhere(): Prisma.ArticleWhereInput {
  return buildArticleStatusWhere("PUBLISHED");
}
