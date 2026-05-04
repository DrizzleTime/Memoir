import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ArticleStatus } from "@/lib/article-status";

export interface ArticleHistorySnapshot {
  title: string;
  content: string;
  summary: string | null;
  coverImage: string | null;
  categoryId: number | null;
  categoryName: string | null;
  status: ArticleStatus;
}

type ArticleHistoryDbClient = typeof prisma | Prisma.TransactionClient;

function normalizeSnapshotValue(value: string | null | undefined) {
  return value ?? null;
}

export function formatArticleHistoryName(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return formatter.format(date).replace(",", "");
}

export function isSameArticleHistorySnapshot(
  left: ArticleHistorySnapshot,
  right: ArticleHistorySnapshot
) {
  return (
    left.title === right.title &&
    left.content === right.content &&
    normalizeSnapshotValue(left.summary) === normalizeSnapshotValue(right.summary) &&
    normalizeSnapshotValue(left.coverImage) === normalizeSnapshotValue(right.coverImage) &&
    left.categoryId === right.categoryId &&
    normalizeSnapshotValue(left.categoryName) === normalizeSnapshotValue(right.categoryName) &&
    left.status === right.status
  );
}

export async function createArticleHistoryIfNeeded(
  db: ArticleHistoryDbClient,
  articleId: number,
  snapshot: ArticleHistorySnapshot
) {
  const latestHistory = await db.articleHistory.findFirst({
    where: { articleId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      title: true,
      content: true,
      summary: true,
      coverImage: true,
      categoryId: true,
      categoryName: true,
      status: true,
    },
  });

  if (
    latestHistory &&
    isSameArticleHistorySnapshot(snapshot, {
      title: latestHistory.title,
      content: latestHistory.content,
      summary: latestHistory.summary,
      coverImage: latestHistory.coverImage,
      categoryId: latestHistory.categoryId,
      categoryName: latestHistory.categoryName,
      status: latestHistory.status,
    })
  ) {
    return null;
  }

  return db.articleHistory.create({
    data: {
      articleId,
      name: formatArticleHistoryName(),
      title: snapshot.title,
      content: snapshot.content,
      summary: snapshot.summary,
      coverImage: snapshot.coverImage,
      categoryId: snapshot.categoryId,
      categoryName: snapshot.categoryName,
      status: snapshot.status,
    },
  });
}
