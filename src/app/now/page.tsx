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
} from "@/components/ui";
import MemoItem from "@/components/MemoItem";
import { getPublicNowPageData } from "@/lib/public-content";
import { ensureInstalled } from "@/lib/install-guard";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Now",
  description: "最近的动态和想法",
  alternates: {
    canonical: "/now",
  },
};

interface SearchParams {
  page?: string;
}

export default async function NowPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  ensureInstalled();
  const params = await searchParams;
  const page = Number.parseInt(params.page || "1", 10);
  const { memos, totalCount, hasMore, page: currentPage } =
    await getPublicNowPageData(page);

  return (
    <Container>
      <div className="mb-6">
        <ActionLink href="/" variant="subtle">
          <Cmd>cd ..</Cmd>
        </ActionLink>
      </div>

      <header className="mb-6 sm:mb-8">
        <Title className="mb-1">
          <Prompt>Now</Prompt>
          <Cursor />
        </Title>
        <MutedText className="pl-4 sm:pl-6 text-base sm:text-lg">
          最近的动态和想法
        </MutedText>
      </header>

      <StatusLine className="mb-4 sm:mb-6">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          TIMELINE
        </span>
        <span className="hidden sm:inline">|</span>
        <span>{totalCount} 条动态</span>
      </StatusLine>

      <div className="mb-3">
        <Cmd>cat ./timeline.md</Cmd>
      </div>

      {memos.length === 0 ? (
        <MutedText className="py-4">(empty)</MutedText>
      ) : (
        <div className="space-y-6">
          {memos.map((memo) => (
            <MemoItem key={memo.id} memo={memo} />
          ))}
        </div>
      )}

      <Divider />

      <div className="flex items-center justify-center gap-6">
        {currentPage > 1 ? (
          <ActionLink href={`/now?page=${currentPage - 1}`} variant="muted">
            [prev]
          </ActionLink>
        ) : (
          <MutedText as="span" className="text-neutral-300">
            [prev]
          </MutedText>
        )}

        <MutedText as="span">{currentPage}</MutedText>

        {hasMore ? (
          <ActionLink href={`/now?page=${currentPage + 1}`} variant="muted">
            [next]
          </ActionLink>
        ) : (
          <MutedText as="span" className="text-neutral-300">
            [next]
          </MutedText>
        )}
      </div>

      <div className="mt-8">
        <Cursor text="Ready" />
      </div>
    </Container>
  );
}
