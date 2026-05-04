import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ActionLink,
  Cmd,
  Container,
  Cursor,
  MutedText,
  Prompt,
  RawImg,
  StatusLine,
  Title,
} from "@/components/ui";
import { getPublicAlbumDetail } from "@/lib/public-content";
import { ensureInstalled } from "@/lib/install-guard";

export const revalidate = 300;
export const dynamic = "force-dynamic";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  ensureInstalled();
  const { id } = await params;
  const albumId = Number.parseInt(id, 10);
  const album = await getPublicAlbumDetail(albumId);

  if (!album) return { title: "相册不存在" };

  return {
    title: album.title,
    description: album.description || `${album.title} 的图片记录。`,
    alternates: { canonical: `/albums/${album.id}` },
  };
}

export default async function AlbumDetailPage({ params }: AlbumPageProps) {
  ensureInstalled();
  const { id } = await params;
  const albumId = Number.parseInt(id, 10);
  const album = await getPublicAlbumDetail(albumId);

  if (!album) notFound();

  return (
    <Container>
      <div className="mb-6">
        <ActionLink href="/albums" variant="subtle">
          <Cmd>cd ../albums</Cmd>
        </ActionLink>
      </div>

      <header className="mb-6 sm:mb-8">
        <Title className="mb-1">
          <Prompt>{album.title}</Prompt>
          <Cursor />
        </Title>
        {album.description ? (
          <MutedText className="pl-4 sm:pl-6 text-base sm:text-lg">
            {album.description}
          </MutedText>
        ) : null}
      </header>

      <StatusLine className="mb-4 sm:mb-6">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          PUBLIC
        </span>
        <span className="hidden sm:inline">|</span>
        <span>{album.images.length} 张图片</span>
        <span className="hidden sm:inline">|</span>
        <span>{new Date(album.createdAt).toLocaleDateString("zh-CN")}</span>
      </StatusLine>

      <div className="mb-3">
        <Cmd>find ./images -type f</Cmd>
      </div>

      {album.images.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {album.images.map((image) => (
            <a
              key={image.id}
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="memoir-image-link block overflow-hidden rounded-lg border border-neutral-200 bg-white"
            >
              <RawImg
                src={image.url}
                alt={image.alt}
                className="h-auto w-full object-cover"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      ) : (
        <MutedText className="text-base">这个相册还没有图片</MutedText>
      )}
    </Container>
  );
}
