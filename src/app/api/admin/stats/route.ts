import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { buildArticleStatusWhere } from "@/lib/article-status.server";
import { getCommentTargetType } from "@/lib/comments";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser(request);
    if (currentUser instanceof NextResponse) {
      return currentUser;
    }

    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      privateArticles,
      totalComments,
      pendingComments,
      totalUsers,
      totalFiles,
      missingFiles,
      fileSizeSum,
      totalMemos,
      publishedMemos,
      recentArticles,
      recentComments,
      recentFiles,
      recentMemos,
    ] = await Promise.all([
      prisma.article.count({ where: { authorId: currentUser.id } }),
      prisma.article.count({
        where: {
          authorId: currentUser.id,
          ...buildArticleStatusWhere("PUBLISHED"),
        },
      }),
      prisma.article.count({
        where: {
          authorId: currentUser.id,
          ...buildArticleStatusWhere("DRAFT"),
        },
      }),
      prisma.article.count({
        where: {
          authorId: currentUser.id,
          ...buildArticleStatusWhere("PRIVATE"),
        },
      }),
      prisma.comment.count(),
      prisma.comment.count({ where: { isApproved: false } }),
      prisma.user.count(),
      prisma.uploadFile.count(),
      prisma.uploadFile.count({ where: { isMissing: true } }),
      prisma.uploadFile.aggregate({ _sum: { size: true } }),
      prisma.memo.count(),
      prisma.memo.count({ where: { isPublished: true } }),
      prisma.article.findMany({
        where: { authorId: currentUser.id },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
            },
          },
        },
      }),
      prisma.comment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          articleId: true,
          memoId: true,
          isApproved: true,
          createdAt: true,
          guestName: true,
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
            },
          },
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
      }),
      prisma.uploadFile.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          relativePath: true,
          originalName: true,
          size: true,
          isMissing: true,
          createdAt: true,
        },
      }),
      prisma.memo.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          isPublished: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        total_articles: totalArticles,
        published_articles: publishedArticles,
        draft_articles: draftArticles,
        private_articles: privateArticles,
        total_comments: totalComments,
        pending_comments: pendingComments,
        total_users: totalUsers,
        total_files: totalFiles,
        missing_files: missingFiles,
        total_file_size: fileSizeSum._sum.size ?? 0,
        total_memos: totalMemos,
        published_memos: publishedMemos,
        draft_memos: totalMemos - publishedMemos,
      },
      recent_articles: recentArticles.map((article: (typeof recentArticles)[number]) => ({
        id: article.id,
        title: article.title,
        status: article.status,
        created_at: article.createdAt.toISOString(),
        author: {
          id: article.author.id,
          username: article.author.username,
          nickname: article.author.nickname,
        },
      })),
      recent_comments: recentComments.map((comment: (typeof recentComments)[number]) => ({
        id: comment.id,
        content: comment.content.slice(0, 100),
        is_approved: comment.isApproved,
        created_at: comment.createdAt.toISOString(),
        commenter: comment.author?.nickname || comment.author?.username || comment.guestName,
        target_type: getCommentTargetType(comment),
        article: comment.article
          ? {
              id: comment.article.id,
              title: comment.article.title,
            }
          : null,
        memo: comment.memo
          ? {
              id: comment.memo.id,
              content: comment.memo.content.slice(0, 100),
            }
          : null,
      })),
      recent_files: recentFiles.map((file: (typeof recentFiles)[number]) => ({
        id: file.id,
        relative_path: file.relativePath,
        original_name: file.originalName,
        size: file.size,
        is_missing: file.isMissing,
        created_at: file.createdAt.toISOString(),
      })),
      recent_memos: recentMemos.map((memo: (typeof recentMemos)[number]) => ({
        id: memo.id,
        content: memo.content.slice(0, 100),
        is_published: memo.isPublished,
        created_at: memo.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
