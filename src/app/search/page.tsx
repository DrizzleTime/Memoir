import type { Metadata } from "next";
import {
  Container,
  Prompt,
  Cmd,
  Cursor,
  Divider,
  Title,
  ActionLink,
  MutedText,
  StatusLine,
  TreeItem,
  Input,
} from "@/components/ui";
import { getPublicSearchPageData } from "@/lib/public-content";
import { ensureInstalled } from "@/lib/install-guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "搜索文章标题和内容。",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/search",
  },
};

interface SearchParams {
  q?: string;
  page?: string;
}

function buildSearchHref(query: string, page: number): string {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
  });

  return `/search?${params.toString()}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  ensureInstalled();
  const params = await searchParams;
  const query = (params.q || "").trim();
  const page = Number.parseInt(params.page || "1", 10);
  const { articles, total, hasMore, page: currentPage } =
    await getPublicSearchPageData(query, page);
  const hasQuery = query.length > 0;

  return (
    <Container>
      <div className="mb-6">
        <ActionLink href="/" variant="subtle">
          <Cmd>cd ..</Cmd>
        </ActionLink>
      </div>

      <header className="mb-6 sm:mb-8">
        <Title className="mb-1">
          <Prompt>Search</Prompt>
          <Cursor />
        </Title>
        <MutedText className="pl-4 sm:pl-6 text-base sm:text-lg">
          搜索文章标题和内容
        </MutedText>
      </header>

      <StatusLine className="mb-4 sm:mb-6">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          SEARCH
        </span>
        <span className="hidden sm:inline">|</span>
        <span>{hasQuery ? `关键词: ${query}` : "输入关键词后回车"}</span>
        <span className="hidden sm:inline">|</span>
        <span>{hasQuery ? `${total} 条结果` : "title + content"}</span>
      </StatusLine>

      <div className="mb-3">
        <Cmd>
          {hasQuery ? `grep -R "${query}" ./articles` : "grep -R <keyword> ./articles"}
        </Cmd>
      </div>

      <form
        action="/search"
        method="get"
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="输入关键词"
          aria-label="搜索关键词"
          autoComplete="off"
          className="w-full rounded-none border-neutral-300 bg-transparent font-mono shadow-none sm:flex-1"
        />
        <button
          type="submit"
          className="cursor-pointer text-left text-neutral-600 transition-colors hover:text-sky-700 focus-visible:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          [search]
        </button>
      </form>

      {!hasQuery ? (
        <MutedText className="py-4">输入关键词后按回车开始搜索。</MutedText>
      ) : articles.length === 0 ? (
        <MutedText className="py-4">(empty)</MutedText>
      ) : (
        <ul className="space-y-4" aria-label="搜索结果">
          {articles.map((article, index) => {
            const isLast = index === articles.length - 1;

            return (
              <li key={article.id} className="memoir-interactive-row list-none">
                <TreeItem isLast={isLast}>
                  <div className="space-y-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                      <MutedText
                        as="span"
                        className="text-sm tabular-nums sm:min-w-[96px] sm:text-base"
                      >
                        {new Date(article.displayAt).toLocaleDateString("zh-CN")}
                      </MutedText>
                      <ActionLink href={`/article/${article.id}`} variant="primary">
                        {article.title}
                      </ActionLink>
                    </div>
                    {article.excerpt ? (
                      <MutedText className="text-sm leading-6 sm:text-base">
                        {article.excerpt}
                      </MutedText>
                    ) : null}
                  </div>
                </TreeItem>
              </li>
            );
          })}
        </ul>
      )}

      {hasQuery ? (
        <>
          <Divider />

          <nav
            className="flex items-center justify-center gap-6"
            aria-label="搜索结果分页"
          >
            {currentPage > 1 ? (
              <ActionLink
                href={buildSearchHref(query, currentPage - 1)}
                variant="muted"
                aria-label="上一页"
              >
                [prev]
              </ActionLink>
            ) : (
              <MutedText
                as="span"
                className="text-neutral-300"
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
                href={buildSearchHref(query, currentPage + 1)}
                variant="muted"
                aria-label="下一页"
              >
                [next]
              </ActionLink>
            ) : (
              <MutedText
                as="span"
                className="text-neutral-300"
                aria-disabled="true"
                aria-label="下一页，不可用"
              >
                [next]
              </MutedText>
            )}
          </nav>
        </>
      ) : null}

      <div className="mt-8">
        <Cursor text="Ready" />
      </div>
    </Container>
  );
}
