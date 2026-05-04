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
  RawImg,
} from "@/components/ui";
import { getPublicLinksPageData } from "@/lib/public-content";
import { getSiteConfig } from "@/lib/site";
import { ensureInstalled } from "@/lib/install-guard";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "友情链接",
  description: "朋友与组织的链接收录页。",
  alternates: {
    canonical: "/links",
  },
};

function LinkAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initial = name ? name[0].toUpperCase() : "?";

  if (!avatarUrl) {
    return (
      <span className="shrink-0 w-8 h-8 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center text-sm font-bold">
        {initial}
      </span>
    );
  }

  return (
    <RawImg
      src={avatarUrl}
      alt={name}
      className="shrink-0 w-8 h-8 rounded-full border border-neutral-200 bg-neutral-100 object-cover"
      loading="lazy"
      decoding="async"
    />
  );
}

function LinkList({
  items,
}: {
  items: Awaited<ReturnType<typeof getPublicLinksPageData>>["friends"];
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <TreeItem
          key={item.id}
          isLast={index === items.length - 1}
          className="memoir-interactive-row"
        >
          <div className="flex items-center gap-3 min-w-0">
            <LinkAvatar name={item.name} avatarUrl={item.avatarUrl} />
            <ActionLink
              href={item.url}
              variant="primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.name}
            </ActionLink>
          </div>
        </TreeItem>
      ))}
    </div>
  );
}

export default async function LinksPage() {
  ensureInstalled();
  const [siteConfig, linksPageData] = await Promise.all([
    getSiteConfig(),
    getPublicLinksPageData(),
  ]);
  const { friends, communities } = linksPageData;

  return (
    <Container>
      <div className="mb-6">
        <ActionLink href="/" variant="subtle">
          <Cmd>cd ..</Cmd>
        </ActionLink>
      </div>

      <header className="mb-6 sm:mb-8">
        <Title className="mb-1">
          <Prompt>友情链接</Prompt>
          <Cursor />
        </Title>
        <MutedText className="pl-4 sm:pl-6 text-base sm:text-lg">
          一些朋友的链接
        </MutedText>
      </header>

      <StatusLine className="mb-4 sm:mb-6">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          LINKS
        </span>
        <span className="hidden sm:inline">|</span>
        <span>{friends.length} 个友链</span>
        <span className="hidden sm:inline">|</span>
        <span>{communities.length} 个组织</span>
      </StatusLine>

      <div className="mb-3">
        <Cmd>ls ./friends</Cmd>
      </div>
      {friends.length > 0 ? (
        <LinkList items={friends} />
      ) : (
        <MutedText className="text-base">暂无友链</MutedText>
      )}

      <Divider />

      <div className="mb-3">
        <Cmd>ls ./communities</Cmd>
      </div>
      {communities.length > 0 ? (
        <LinkList items={communities} />
      ) : (
        <MutedText className="text-base">暂无组织链接</MutedText>
      )}

      <Divider />

      <div className="mb-3">
        <Cmd>cat ./apply.txt</Cmd>
      </div>
      <MutedText className="text-base">
        申请友链请发送至{" "}
        <ActionLink href={`mailto:${siteConfig.contactEmail}`} variant="primary">
          {siteConfig.contactEmail}
        </ActionLink>
      </MutedText>

      <div className="mt-8">
        <Cursor text="Ready" />
      </div>
    </Container>
  );
}
