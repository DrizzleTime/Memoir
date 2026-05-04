import type { Metadata } from "next";
import {
  ActionLink,
  Cmd,
  Container,
  Cursor,
  Divider,
  MutedText,
  Prompt,
  RawImg,
  StatusLine,
  Title,
  TreeItem,
} from "@/components/ui";
import { getPublicAlbumsPageData } from "@/lib/public-content";
import { ensureInstalled } from "@/lib/install-guard";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "相册",
  description: "公开相册列表。",
  alternates: { canonical: "/albums" },
};

export default async function AlbumsPage() {
  ensureInstalled();
  const albums = await getPublicAlbumsPageData();

  return (
    <Container>
      <div className="mb-6">
        <ActionLink href="/" variant="subtle">
          <Cmd>cd ..</Cmd>
        </ActionLink>
      </div>

      <header className="mb-6 sm:mb-8">
        <Title className="mb-1">
          <Prompt>相册</Prompt>
          <Cursor />
        </Title>
        <MutedText className="pl-4 sm:pl-6 text-base sm:text-lg">
          一些图片记录
        </MutedText>
      </header>

      <StatusLine className="mb-4 sm:mb-6">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          ALBUMS
        </span>
        <span className="hidden sm:inline">|</span>
        <span>{albums.length} 个公开相册</span>
      </StatusLine>

      <div className="mb-3">
        <Cmd>ls ./albums</Cmd>
      </div>

      {albums.length > 0 ? (
        <ul className="space-y-4" aria-label="相册列表">
          {albums.map((album, index) => (
            <li key={album.id} className="memoir-interactive-row list-none">
              <TreeItem isLast={index === albums.length - 1}>
                <div className="flex gap-3 min-w-0">
                  {album.coverImage ? (
                    <RawImg
                      src={album.coverImage}
                      alt={album.title}
                      className="h-16 w-24 shrink-0 rounded-md border border-neutral-200 object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                      <MutedText as="span" className="text-sm tabular-nums sm:min-w-[96px] sm:text-base">
                        {new Date(album.createdAt).toLocaleDateString("zh-CN")}
                      </MutedText>
                      <ActionLink href={`/albums/${album.id}`} variant="primary">
                        {album.title}
                      </ActionLink>
                      <MutedText as="span" className="text-sm">
                        {album.imageCount} 张
                      </MutedText>
                    </div>
                    {album.description ? (
                      <MutedText className="mt-1 line-clamp-2 text-sm leading-6">
                        {album.description}
                      </MutedText>
                    ) : null}
                  </div>
                </div>
              </TreeItem>
            </li>
          ))}
        </ul>
      ) : (
        <MutedText className="text-base">暂无公开相册</MutedText>
      )}

      <Divider />
      <Cursor text="Ready" />
    </Container>
  );
}
