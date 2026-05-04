import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CommentSection from "@/components/CommentSection";
import MarkdownView from "@/components/MarkdownView";
import { extractFirstMarkdownImageUrl } from "@/lib/markdown-image";
import {
  Container,
  Prompt,
  Cmd,
  Cursor,
  TreeItem,
  Divider,
  Meta,
  Title,
  ActionLink,
  MutedText,
} from "@/components/ui";
import {
  getPublicArticleDetail,
  getPublicArticleRecord,
} from "@/lib/public-content";
import { getSiteConfig, getSiteUrl, resolveSiteUrl } from "@/lib/site";
import { ensureInstalled } from "@/lib/install-guard";

export const revalidate = 3600;

function resolveAbsoluteCoverImageUrl(input: {
  coverImage: string | null;
  content: string;
  siteUrl: string;
}): string | undefined {
  const cover = input.coverImage || extractFirstMarkdownImageUrl(input.content);
  if (!cover) return undefined;
  return new URL(cover, input.siteUrl).toString();
}

interface PageParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  ensureInstalled();
  const { id } = await params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    return { title: "文章未找到" };
  }

  const article = await getPublicArticleRecord(articleId);

  if (!article) {
    return { title: "文章未找到" };
  }

  const authorName = article.author.nickname || article.author.username;
  const description = article.summary || article.content.slice(0, 160).replace(/\n/g, " ");
  const siteUrl = await getSiteUrl();
  const coverImage = resolveAbsoluteCoverImageUrl({
    coverImage: article.coverImage,
    content: article.content,
    siteUrl,
  });

  return {
    title: article.title,
    description,
    authors: [{ name: authorName }],
    openGraph: {
      title: article.title,
      description,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [authorName],
      images: coverImage ? [coverImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: coverImage ? [coverImage] : undefined,
    },
    alternates: {
      canonical: `/article/${article.id}`,
    },
  };
}

export default async function ArticleDetail({ params }: PageParams) {
  ensureInstalled();
  const { id } = await params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    notFound();
  }

  const [siteConfig, article, siteUrl] = await Promise.all([
    getSiteConfig(),
    getPublicArticleDetail(articleId),
    getSiteUrl(),
  ]);

  if (!article) {
    notFound();
  }

  const wordCount = article.content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 300));
  const coverImage = resolveAbsoluteCoverImageUrl({
    coverImage: article.coverImage,
    content: article.content,
    siteUrl,
  });
  const articleUrl = await resolveSiteUrl(`/article/${article.id}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary || article.content.slice(0, 160),
    author: {
      "@type": "Person",
      name: article.authorName,
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.name,
    },
    ...(coverImage && {
      image: coverImage,
    }),
  };

  return (
    <Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-6">
        <ActionLink href="/" variant="subtle">
          <Cmd>cd ..</Cmd>
        </ActionLink>
      </div>

      <article>
        <header className="mb-6 sm:mb-8">
          <Title size="md" className="mb-3 sm:mb-4">
            <Prompt>{article.title}</Prompt>
            <Cursor />
          </Title>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-base">
            <Meta label="@">{article.authorName}</Meta>
            <Meta label="#">{article.category || "未分类"}</Meta>
            <Meta label="">
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString("zh-CN")
                : "草稿"}
            </Meta>
            <Meta label="">约 {readingTime} 分钟</Meta>
          </div>
        </header>

        <MarkdownView content={article.content} variant="article" />
      </article>

      <section className="mt-8">
        <div className="mb-3">
          <Cmd>ls -lt ./articles</Cmd>
        </div>
        <div className="space-y-2">
          <TreeItem>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Meta label="[prev]">上一篇</Meta>
              {article.previousArticle ? (
                <>
                  <ActionLink
                    href={`/article/${article.previousArticle.id}`}
                    variant="primary"
                  >
                    {article.previousArticle.title}
                  </ActionLink>
                  {article.previousArticle.publishedAt && (
                    <Meta label="@">
                      {new Date(article.previousArticle.publishedAt).toLocaleDateString(
                        "zh-CN"
                      )}
                    </Meta>
                  )}
                </>
              ) : (
                <MutedText as="span" className="text-neutral-300">
                  (none)
                </MutedText>
              )}
            </div>
          </TreeItem>

          <TreeItem isLast>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Meta label="[next]">下一篇</Meta>
              {article.nextArticle ? (
                <>
                  <ActionLink
                    href={`/article/${article.nextArticle.id}`}
                    variant="primary"
                  >
                    {article.nextArticle.title}
                  </ActionLink>
                  {article.nextArticle.publishedAt && (
                    <Meta label="@">
                      {new Date(article.nextArticle.publishedAt).toLocaleDateString(
                        "zh-CN"
                      )}
                    </Meta>
                  )}
                </>
              ) : (
                <MutedText as="span" className="text-neutral-300">
                  (none)
                </MutedText>
              )}
            </div>
          </TreeItem>
        </div>
      </section>

      <Divider />

      <section>
        <div className="mb-4">
          <Cmd>cat ./comments</Cmd>
        </div>
        <CommentSection
          target={{ type: "article", id: articleId }}
          initialComments={article.comments}
        />
      </section>

      <div className="mt-8">
        <Cursor text="EOF" />
      </div>
    </Container>
  );
}
