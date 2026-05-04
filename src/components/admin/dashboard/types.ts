import type { ReactNode } from "react";
import type { ArticleStatus } from "@/lib/article-status";
import type { CommentTargetType } from "@/types";

export interface Stats {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  private_articles: number;
  total_comments: number;
  pending_comments: number;
  total_users: number;
  total_files: number;
  missing_files: number;
  total_file_size: number;
  total_memos: number;
  published_memos: number;
  draft_memos: number;
}

export interface RecentArticle {
  id: number;
  title: string;
  status: ArticleStatus;
  created_at: string;
  author: {
    id: number;
    username: string;
    nickname: string | null;
  };
}

export interface RecentComment {
  id: number;
  content: string;
  is_approved: boolean;
  created_at: string;
  commenter: string | null;
  target_type: CommentTargetType;
  article: {
    id: number;
    title: string;
  } | null;
  memo: {
    id: number;
    content: string;
  } | null;
}

export interface RecentFile {
  id: number;
  relative_path: string;
  original_name: string;
  size: number;
  is_missing: boolean;
  created_at: string;
}

export interface RecentMemo {
  id: number;
  content: string;
  is_published: boolean;
  created_at: string;
}

export interface DashboardData {
  stats: Stats;
  recent_articles: RecentArticle[];
  recent_comments: RecentComment[];
  recent_files: RecentFile[];
  recent_memos: RecentMemo[];
}

export interface DashboardQuickAction {
  key: string;
  title: string;
  icon: ReactNode;
  primary?: boolean;
  onClick: () => void;
}

export interface DashboardStatItem {
  key: string;
  title: string;
  value: number;
  icon: ReactNode;
  accent: string;
  meta: string;
  metaTagColor?: string;
  extraMeta?: string | null;
}
