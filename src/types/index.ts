import type { ArticleStatus } from "@/lib/article-status";

export type CommentTargetType = "article" | "memo";

export interface CommentTarget {
  type: CommentTargetType;
  id: number;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface ArticleListItem {
  id: number;
  title: string;
  summary: string | null;
  cover_image: string | null;
  category_id: number | null;
  category: string | null;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  author: UserResponse;
}

export interface ArticleResponse {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  cover_image: string | null;
  category_id: number | null;
  category: string | null;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: UserResponse;
  history_created?: boolean;
}

export interface ArticleHistoryListItem {
  id: number;
  name: string;
  status: ArticleStatus;
  created_at: string;
  updated_at: string;
}

export interface ArticleHistoryResponse extends ArticleHistoryListItem {
  article_id: number;
  title: string;
  content: string;
  summary: string | null;
  cover_image: string | null;
  category_id: number | null;
  category_name: string | null;
}

export interface CommentResponse {
  id: number;
  content: string;
  article_id: number | null;
  memo_id: number | null;
  target_type: CommentTargetType;
  target_id: number;
  author: UserResponse | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_website: string | null;
  parent_id: number | null;
  is_approved: boolean;
  created_at: string;
  replies: CommentResponse[];
}

export interface PublicArticleListItem {
  id: number;
  title: string;
  status: ArticleStatus;
  displayAt: string;
}

export interface PublicArticleSearchItem {
  id: number;
  title: string;
  excerpt: string;
  displayAt: string;
}

export interface PublicMemoListItem {
  id: number;
  content: string;
  createdAt: string;
  commentCount: number;
}

export interface PublicLinkItem {
  id: number;
  name: string;
  url: string;
  avatarUrl: string | null;
  category: string;
}

export interface PublicArticleNavigationItem {
  id: number;
  title: string;
  publishedAt: string | null;
}

export interface PublicArticleDetail {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  coverImage: string | null;
  authorName: string;
  authorUsername: string;
  category: string | null;
  publishedAt: string | null;
  updatedAt: string;
  comments: CommentResponse[];
  previousArticle: PublicArticleNavigationItem | null;
  nextArticle: PublicArticleNavigationItem | null;
}

export type PublicCommentTree = CommentResponse;

export interface PageData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BaseResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export type PageResponse<T> = BaseResponse<PageData<T>>;
