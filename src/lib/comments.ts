import { formatUserResponse } from "@/lib/auth";
import type { CommentResponse, CommentTarget, CommentTargetType } from "@/types";

type CommentAuthor = {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  createdAt: Date;
};

export type CommentRecordWithAuthor = {
  id: number;
  content: string;
  articleId: number | null;
  memoId: number | null;
  guestName: string | null;
  guestEmail: string | null;
  guestWebsite: string | null;
  parentId: number | null;
  isApproved: boolean;
  createdAt: Date;
  author: CommentAuthor | null;
};

export function getCommentTargetType(input: {
  articleId: number | null;
  memoId: number | null;
}): CommentTargetType {
  if (input.articleId) {
    return "article";
  }

  if (input.memoId) {
    return "memo";
  }

  throw new Error("评论缺少目标");
}

export function getCommentTarget(input: {
  articleId: number | null;
  memoId: number | null;
}): CommentTarget {
  const type = getCommentTargetType(input);

  return {
    type,
    id: type === "article" ? input.articleId as number : input.memoId as number,
  };
}

export function getCommentApiPath(target: CommentTarget): string {
  return `/api/comments/${target.type}/${target.id}`;
}

export function mapCommentResponse(
  comment: CommentRecordWithAuthor
): CommentResponse {
  const target = getCommentTarget(comment);

  return {
    id: comment.id,
    content: comment.content,
    article_id: comment.articleId,
    memo_id: comment.memoId,
    target_type: target.type,
    target_id: target.id,
    author: comment.author ? formatUserResponse(comment.author) : null,
    guest_name: comment.guestName,
    guest_email: comment.guestEmail,
    guest_website: comment.guestWebsite,
    parent_id: comment.parentId,
    is_approved: comment.isApproved,
    created_at: comment.createdAt.toISOString(),
    replies: [],
  };
}

export function buildPublicCommentTree(
  comments: CommentRecordWithAuthor[]
): CommentResponse[] {
  const commentMap = new Map<number, CommentResponse>();
  const rootComments: CommentResponse[] = [];

  for (const comment of comments) {
    const mapped = mapCommentResponse(comment);
    commentMap.set(comment.id, mapped);

    if (comment.parentId === null) {
      rootComments.push(mapped);
    }
  }

  for (const comment of comments) {
    if (!comment.parentId) {
      continue;
    }

    const parent = commentMap.get(comment.parentId);
    const current = commentMap.get(comment.id);

    if (!parent || !current) {
      continue;
    }

    parent.replies.push(current);
  }

  rootComments.sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  );

  return rootComments;
}
