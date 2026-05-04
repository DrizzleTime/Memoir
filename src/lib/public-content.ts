import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { buildPublishedArticleWhere } from "@/lib/article-status.server";
import { buildPublicCommentTree } from "@/lib/comments";
import { stripMarkdownImages } from "@/lib/markdown-image";
import type {
  PublicArticleDetail,
  PublicArticleListItem,
  PublicArticleNavigationItem,
  PublicArticleSearchItem,
  PublicLinkItem,
  PublicMemoListItem,
} from "@/types";

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_EXCERPT_LENGTH = 140;

function normalizePage(page: number): number {
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function normalizeSearchText(text: string): string {
  return stripMarkdownImages(text)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+>]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchExcerpt(content: string, query: string): string {
  const normalizedContent = normalizeSearchText(content);

  if (!normalizedContent) {
    return "";
  }

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const contentForMatch = normalizedContent.toLocaleLowerCase();
  const matchedIndex = normalizedQuery
    ? contentForMatch.indexOf(normalizedQuery)
    : -1;

  if (matchedIndex < 0) {
    return normalizedContent.length > SEARCH_EXCERPT_LENGTH
      ? `${normalizedContent.slice(0, SEARCH_EXCERPT_LENGTH).trim()}...`
      : normalizedContent;
  }

  const start = Math.max(0, matchedIndex - 40);
  const end = Math.min(
    normalizedContent.length,
    matchedIndex + query.length + 80
  );
  const excerpt = normalizedContent.slice(start, end).trim();

  return `${start > 0 ? "..." : ""}${excerpt}${end < normalizedContent.length ? "..." : ""}`;
}

function mapArticleNavigation(item: {
  id: number;
  title: string;
  publishedAt: Date | null;
} | null): PublicArticleNavigationItem | null {
  if (!item) return null;

  return {
    id: item.id,
    title: item.title,
    publishedAt: item.publishedAt?.toISOString() || null,
  };
}

export async function getPublicHomePageData(
  page: number,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{
  page: number;
  hasMore: boolean;
  articles: PublicArticleListItem[];
  latestMemo: PublicMemoListItem | null;
}> {
  const currentPage = normalizePage(page);
  const offset = (currentPage - 1) * pageSize;
  const homeVisibleArticleWhere: Prisma.ArticleWhereInput = {
    OR: [buildPublishedArticleWhere(), { status: "PRIVATE" }],
  };

  const [articles, latestMemo] = await Promise.all([
    prisma.article.findMany({
      where: homeVisibleArticleWhere,
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: [
        {
          publishedAt: {
            sort: "desc",
            nulls: "last",
          },
        },
        { createdAt: "desc" },
        { id: "desc" },
      ],
      skip: offset,
      take: pageSize + 1,
    }),
    prisma.memo.findFirst({
      where: { isPublished: true },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
  ]);
  const latestMemoCommentCount = latestMemo
    ? await prisma.comment.count({
        where: {
          memoId: latestMemo.id,
          isApproved: true,
        },
      })
    : 0;

  const hasMore = articles.length > pageSize;
  const displayArticles = articles.slice(0, pageSize);

  return {
    page: currentPage,
    hasMore,
    articles: displayArticles.map((article: (typeof displayArticles)[number]) => {
      const displayAt = article.publishedAt || article.createdAt;

      return {
        id: article.id,
        title: article.title,
        status: article.status,
        displayAt: displayAt.toISOString(),
      };
    }),
    latestMemo: latestMemo
      ? {
          id: latestMemo.id,
          content: latestMemo.content,
          createdAt: latestMemo.createdAt.toISOString(),
          commentCount: latestMemoCommentCount,
        }
      : null,
  };
}

export async function getPublicSearchPageData(
  query: string,
  page: number,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{
  page: number;
  total: number;
  hasMore: boolean;
  articles: PublicArticleSearchItem[];
}> {
  const normalizedQuery = query.trim();
  const currentPage = normalizePage(page);

  if (!normalizedQuery) {
    return {
      page: currentPage,
      total: 0,
      hasMore: false,
      articles: [],
    };
  }

  const offset = (currentPage - 1) * pageSize;
  const where: Prisma.ArticleWhereInput = {
    AND: [
      buildPublishedArticleWhere(),
      {
        OR: [
          {
            title: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            content: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
        ],
      },
    ],
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: [
        {
          publishedAt: {
            sort: "desc",
            nulls: "last",
          },
        },
        { createdAt: "desc" },
        { id: "desc" },
      ],
      skip: offset,
      take: pageSize + 1,
    }),
    prisma.article.count({ where }),
  ]);

  const hasMore = articles.length > pageSize;
  const displayArticles = articles.slice(0, pageSize);

  return {
    page: currentPage,
    total,
    hasMore,
    articles: displayArticles.map((article: (typeof displayArticles)[number]) => ({
      id: article.id,
      title: article.title,
      excerpt: buildSearchExcerpt(article.content, normalizedQuery),
      displayAt: (article.publishedAt || article.createdAt).toISOString(),
    })),
  };
}

export async function getPublicNowPageData(
  page: number,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{
  page: number;
  totalCount: number;
  hasMore: boolean;
  memos: PublicMemoListItem[];
}> {
  const currentPage = normalizePage(page);
  const offset = (currentPage - 1) * pageSize;

  const [memos, totalCount] = await Promise.all([
    prisma.memo.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: offset,
      take: pageSize + 1,
    }),
    prisma.memo.count({ where: { isPublished: true } }),
  ]);

  const hasMore = memos.length > pageSize;
  const displayMemos = memos.slice(0, pageSize);
  const memoCommentCounts = displayMemos.length
    ? await prisma.comment.groupBy({
        by: ["memoId"],
        where: {
          memoId: {
            in: displayMemos.map((memo: (typeof displayMemos)[number]) => memo.id),
          },
          isApproved: true,
        },
        _count: {
          _all: true,
        },
      })
    : [];
  const commentCountMap = new Map<number, number>(
    memoCommentCounts
      .filter((item) => item.memoId !== null)
      .map((item) => [item.memoId as number, item._count._all])
  );

  return {
    page: currentPage,
    totalCount,
    hasMore,
    memos: displayMemos.map((memo: (typeof displayMemos)[number]) => ({
      id: memo.id,
      content: memo.content,
      createdAt: memo.createdAt.toISOString(),
      commentCount: commentCountMap.get(memo.id) || 0,
    })),
  };
}

export async function getPublicLinksPageData(): Promise<{
  friends: PublicLinkItem[];
  communities: PublicLinkItem[];
}> {
  const links = await prisma.link.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      url: true,
      avatarUrl: true,
      category: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const items = links.map((link: (typeof links)[number]) => ({
    id: link.id,
    name: link.name,
    url: link.url,
    avatarUrl: link.avatarUrl,
    category: link.category,
  }));

  return {
    friends: items.filter((item: (typeof items)[number]) => item.category === "friend"),
    communities: items.filter((item: (typeof items)[number]) => item.category === "community"),
  };
}

const getPublishedArticleRecord = cache(async (articleId: number) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: true,
      category: true,
    },
  });

  if (!article || article.status !== "PUBLISHED") {
    return null;
  }

  return article;
});

const getPublishedMemoRecord = cache(async (memoId: number) => {
  const memo = await prisma.memo.findUnique({
    where: { id: memoId },
  });

  if (!memo || !memo.isPublished) {
    return null;
  }

  return memo;
});

export const getPublicArticleRecord = cache(async (articleId: number) => {
  if (!Number.isInteger(articleId) || articleId <= 0) {
    return null;
  }

  return getPublishedArticleRecord(articleId);
});

export const getPublicMemoRecord = cache(async (memoId: number) => {
  if (!Number.isInteger(memoId) || memoId <= 0) {
    return null;
  }

  return getPublishedMemoRecord(memoId);
});

export const getPublicArticleDetail = cache(
  async (articleId: number): Promise<PublicArticleDetail | null> => {
    const article = await getPublicArticleRecord(articleId);

    if (!article) {
      return null;
    }

    const [comments, previousArticle, nextArticle] = await Promise.all([
      prisma.comment.findMany({
        where: { articleId, isApproved: true },
        include: { author: true },
        orderBy: { createdAt: "asc" },
      }),
      article.publishedAt
        ? prisma.article.findFirst({
            where: {
              AND: [
                buildPublishedArticleWhere(),
                {
                  OR: [
                    { publishedAt: { lt: article.publishedAt } },
                    { publishedAt: article.publishedAt, id: { lt: article.id } },
                  ],
                },
              ],
            },
            orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
            select: { id: true, title: true, publishedAt: true },
          })
        : Promise.resolve(null),
      article.publishedAt
        ? prisma.article.findFirst({
            where: {
              AND: [
                buildPublishedArticleWhere(),
                {
                  OR: [
                    { publishedAt: { gt: article.publishedAt } },
                    { publishedAt: article.publishedAt, id: { gt: article.id } },
                  ],
                },
              ],
            },
            orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
            select: { id: true, title: true, publishedAt: true },
          })
        : Promise.resolve(null),
    ]);

    return {
      id: article.id,
      title: article.title,
      content: article.content,
      summary: article.summary,
      coverImage: article.coverImage,
      authorName: article.author.nickname || article.author.username,
      authorUsername: article.author.username,
      category: article.category?.name || null,
      publishedAt: article.publishedAt?.toISOString() || null,
      updatedAt: article.updatedAt.toISOString(),
      comments: buildPublicCommentTree(comments),
      previousArticle: mapArticleNavigation(previousArticle),
      nextArticle: mapArticleNavigation(nextArticle),
    };
  }
);

export async function getPublishedArticlesForSitemap() {
  return prisma.article.findMany({
    where: buildPublishedArticleWhere(),
    select: { id: true, updatedAt: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
}

export const getPublicAlbumsPageData = cache(async () => {
  const albums = await prisma.album.findMany({
    where: { isPublic: true },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        take: 1,
        include: { file: true },
      },
      _count: { select: { images: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return albums.map((album) => ({
    id: album.id,
    title: album.title,
    description: album.description,
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
    imageCount: album._count.images,
    coverImage: album.images[0]?.file
      ? `/uploads/${album.images[0].file.relativePath}`
      : null,
  }));
});

export const getPublicAlbumDetail = cache(async (albumId: number) => {
  if (!Number.isInteger(albumId) || albumId <= 0) return null;

  const album = await prisma.album.findFirst({
    where: { id: albumId, isPublic: true },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: { file: true },
      },
    },
  });

  if (!album) return null;

  return {
    id: album.id,
    title: album.title,
    description: album.description,
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
    images: album.images.map((image) => ({
      id: image.id,
      url: `/uploads/${image.file.relativePath}`,
      alt: image.file.originalName || image.file.relativePath,
      relativePath: image.file.relativePath,
    })),
  };
});

export async function getPublicAlbumsForSitemap() {
  return prisma.album.findMany({
    where: { isPublic: true },
    select: { id: true, updatedAt: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
}

export async function getPublishedArticlesForFeed(limit = 20) {
  return prisma.article.findMany({
    where: buildPublishedArticleWhere(),
    include: { author: true },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: limit,
  });
}

export async function getPublicSitemapPageTimestamps(): Promise<{
  linksLastModified: Date | undefined;
  nowLastModified: Date | undefined;
  albumsLastModified: Date | undefined;
}> {
  const [latestLink, latestMemo, latestAlbum] = await Promise.all([
    prisma.link.findFirst({
      where: { isActive: true },
      select: { updatedAt: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    }),
    prisma.memo.findFirst({
      where: { isPublished: true },
      select: { updatedAt: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    }),
    prisma.album.findFirst({
      where: { isPublic: true },
      select: { updatedAt: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    }),
  ]);

  return {
    linksLastModified: latestLink?.updatedAt,
    nowLastModified: latestMemo?.updatedAt,
    albumsLastModified: latestAlbum?.updatedAt,
  };
}
