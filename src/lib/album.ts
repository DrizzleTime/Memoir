import { prisma } from "@/lib/prisma";
import { isImageFile } from "@/lib/file-meta";

export type AlbumPayload = {
  title?: string;
  description?: string | null;
  isPublic?: boolean;
  fileIds?: number[];
};

export function normalizeAlbumPayload(body: AlbumPayload) {
  const title = (body.title || "").trim();
  const description = (body.description || "").trim() || null;
  const isPublic = body.isPublic ?? true;
  const fileIds = Array.isArray(body.fileIds)
    ? Array.from(new Set(body.fileIds.map((id) => Number(id)).filter(Number.isInteger)))
    : [];

  return { title, description, isPublic, fileIds };
}

export async function getValidImageFiles(fileIds: number[]) {
  if (fileIds.length === 0) return [];

  const files = await prisma.uploadFile.findMany({
    where: {
      id: { in: fileIds },
      isMissing: false,
    },
  });

  return files.filter(isImageFile);
}

export function serializeAlbum<T extends {
  id: number;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  images?: Array<{
    id: number;
    sortOrder: number;
    file: {
      id: number;
      relativePath: string;
      originalName: string;
      mimeType: string | null;
      size: number;
      isMissing: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
  _count?: { images: number };
}>(album: T) {
  return {
    id: album.id,
    title: album.title,
    description: album.description,
    isPublic: album.isPublic,
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
    imageCount: album._count?.images ?? album.images?.length ?? 0,
    images: album.images?.map((image) => ({
      id: image.id,
      sortOrder: image.sortOrder,
      file: {
        ...image.file,
        createdAt: image.file.createdAt.toISOString(),
        updatedAt: image.file.updatedAt.toISOString(),
      },
    })),
  };
}
