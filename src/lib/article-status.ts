export const ARTICLE_STATUS_VALUES = ["DRAFT", "PUBLISHED", "PRIVATE"] as const;

export type ArticleStatus = (typeof ARTICLE_STATUS_VALUES)[number];

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  PRIVATE: "私密",
};

export const ARTICLE_STATUS_TAG_COLORS: Record<ArticleStatus, string> = {
  DRAFT: "default",
  PUBLISHED: "success",
  PRIVATE: "warning",
};

export const ARTICLE_STATUS_OPTIONS = ARTICLE_STATUS_VALUES.map((value) => ({
  value,
  label: ARTICLE_STATUS_LABELS[value],
}));

export function isPublicArticleStatus(status: ArticleStatus) {
  return status === "PUBLISHED";
}
