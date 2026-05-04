import type { ArticleStatus } from "@/lib/article-status";

export interface ArticleFormValues {
  title: string;
  content: string;
  summary?: string;
  cover_image?: string;
  category_id?: number | null;
  status: ArticleStatus;
}

export interface ArticleCategoryOption {
  id: number;
  name: string;
}

export type AuthFetch = (
  url: string,
  options?: RequestInit
) => Promise<Response>;
