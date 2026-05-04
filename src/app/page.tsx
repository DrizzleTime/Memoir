import type { Metadata } from "next";
import {
  Container,
  Prompt,
  Cmd,
  Cursor,
  TreeItem,
  Divider,
  Title,
  MutedText,
  StatusLine,
  ActionLink,
  RawImg,
} from "@/components/ui";
import { ARTICLE_STATUS_LABELS } from "@/lib/article-status";
import { extractFirstMarkdownImageUrl, stripMarkdownImages } from "@/lib/markdown-image";
import { getPublicHomePageData } from "@/lib/public-content";
import { getSiteConfig } from "@/lib/site";
import { ensureInstalled } from "@/lib/install-guard";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  ensureInstalled();
  const siteConfig = await getSiteConfig();

  return {
    description: siteConfig.description,
    alternates: {
      canonical: "/",
    },
  };
}

interface SearchParams {
  page?: string;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  ensureInstalled();
  const params = await searchParams;
  const siteConfig = await getSiteConfig();
  const page = Number.parseInt(params.page || "1", 10);
  const { articles, latestMemo, hasMore, page: currentPage } =
    await getPublicHomePageData(page);
  const latestMemoImage = latestMemo
    ? extractFirstMarkdownImageUrl(latestMemo.content)
    : undefined;
  const latestMemoSummary = latestMemo
    ? stripMarkdownImages(latestMemo.content)
    : "";
  const latestMemoPreview =
    latestMemoSummary.length > 120
      ? `${latestMemoSummary.slice(0, 120)}...`
      : latestMemoSummary;

  return (
    <Container>
      <header className="mb-6 sm:mb-8">
        <Title className="mb-1">
          <Prompt>{siteConfig.name}</Prompt>
          <Cursor />
        </Title>
        <MutedText className="pl-4 sm:pl-6 text-base sm:text-lg">
          {siteConfig.tagline}
        </MutedText>
      </header>

      <StatusLine className="mb-6">
        <ActionLink href="/now" variant="subtle">
          now
        </ActionLink>
        <span className="hidden sm:inline">|</span>
        <ActionLink href="/search" variant="subtle">
          search
        </ActionLink>
        <span className="hidden sm:inline">|</span>
        <ActionLink href="/links" variant="subtle">
          links
        </ActionLink>
        <span className="hidden sm:inline">|</span>
        <ActionLink href="/albums" variant="subtle">
          albums
        </ActionLink>
        <span className="hidden sm:inline">|</span>
        <ActionLink href="/about" variant="subtle">
          about
        </ActionLink>
      </StatusLine>

      {latestMemo && (
        <section className="mb-6">
          <div className="mb-3">
            <Cmd>tail -n 1 ./timeline.md</Cmd>
          </div>
          <div className="pl-4 sm:pl-6">
            <div className="flex items-center gap-3">
              {latestMemoImage ? (
                <RawImg
                  src={latestMemoImage}
                  alt="最新动态配图"
                  className="h-16 w-24 shrink-0 rounded-md border border-neutral-200 object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <MutedText
                  className="overflow-hidden text-base leading-7 break-words"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                  }}
                >
                  {latestMemoPreview || "(empty)"}
                </MutedText>
                <div className="mt-1">
                  <ActionLink href="/now" variant="muted">
                    [更多动态]
                  </ActionLink>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mb-3">
        <Cmd>ls ./articles</Cmd>
      </div>

      {articles.length === 0 ? (
        <MutedText className="py-4">(empty)</MutedText>
      ) : (
        <ul className="space-y-4" aria-label="文章列表">
          {articles.map((article, index) => {
            const isLast = index === articles.length - 1;

            return (
              <li key={article.id} className="memoir-interactive-row list-none">
                <TreeItem isLast={isLast}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                    <MutedText
                      as="span"
                      className="text-sm tabular-nums sm:min-w-[96px] sm:text-base"
                    >
                      {new Date(article.displayAt).toLocaleDateString("zh-CN")}
                    </MutedText>
                    {article.status === "PRIVATE" ? (
                      <MutedText
                        as="span"
                        className="text-base line-through text-neutral-400 sm:text-lg"
                        title={ARTICLE_STATUS_LABELS[article.status]}
                      >
                        {article.title}
                      </MutedText>
                    ) : (
                      <ActionLink href={`/article/${article.id}`} variant="primary">
                        {article.title}
                      </ActionLink>
                    )}
                  </div>
                </TreeItem>
              </li>
            );
          })}
        </ul>
      )}

      <Divider />

      <nav
        className="flex items-center justify-center gap-6"
        aria-label="文章分页"
      >
        {currentPage > 1 ? (
          <ActionLink
            href={`/?page=${currentPage - 1}`}
            variant="muted"
            aria-label="上一页"
          >
            [prev]
          </ActionLink>
        ) : (
          <MutedText
            as="span"
            className="text-neutral-500"
            aria-disabled="true"
            aria-label="上一页，不可用"
          >
            [prev]
          </MutedText>
        )}

        <MutedText as="span" aria-current="page">
          {currentPage}
        </MutedText>

        {hasMore ? (
          <ActionLink
            href={`/?page=${currentPage + 1}`}
            variant="muted"
            aria-label="下一页"
          >
            [next]
          </ActionLink>
        ) : (
          <MutedText
            as="span"
            className="text-neutral-500"
            aria-disabled="true"
            aria-label="下一页，不可用"
          >
            [next]
          </MutedText>
        )}
      </nav>
    </Container>
  );
}
