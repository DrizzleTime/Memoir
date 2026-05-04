import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNumericId, requireCurrentUser } from "@/lib/api-route";
import { getValidImageFiles, normalizeAlbumPayload, serializeAlbum } from "@/lib/album";
import { revalidateAlbums } from "@/lib/revalidate";

async function getAlbumId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return parseNumericId(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) return authResult;

    const albumId = await getAlbumId(params);
    if (albumId === null) {
      return NextResponse.json({ detail: "无效的ID", error: "无效的ID" }, { status: 400 });
    }

    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { file: true } },
      },
    });

    if (!album) {
      return NextResponse.json(
        { detail: "相册不存在", error: "相册不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeAlbum(album));
  } catch (error) {
    console.error("获取相册失败:", error);
    return NextResponse.json(
      { detail: "获取相册失败", error: "获取相册失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) return authResult;

    const albumId = await getAlbumId(params);
    if (albumId === null) {
      return NextResponse.json({ detail: "无效的ID", error: "无效的ID" }, { status: 400 });
    }

    const payload = normalizeAlbumPayload(await request.json());
    if (!payload.title) {
      return NextResponse.json(
        { detail: "标题为必填项", error: "标题为必填项" },
        { status: 400 }
      );
    }

    const existing = await prisma.album.findUnique({ where: { id: albumId } });
    if (!existing) {
      return NextResponse.json(
        { detail: "相册不存在", error: "相册不存在" },
        { status: 404 }
      );
    }

    const imageFiles = await getValidImageFiles(payload.fileIds);
    if (imageFiles.length !== payload.fileIds.length) {
      return NextResponse.json(
        { detail: "只能选择媒体库中的有效图片", error: "只能选择媒体库中的有效图片" },
        { status: 400 }
      );
    }

    const album = await prisma.$transaction(async (tx) => {
      await tx.albumImage.deleteMany({ where: { albumId } });
      return tx.album.update({
        where: { id: albumId },
        data: {
          title: payload.title,
          description: payload.description,
          isPublic: payload.isPublic,
          images: {
            create: payload.fileIds.map((fileId, index) => ({ fileId, sortOrder: index })),
          },
        },
        include: {
          images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { file: true } },
        },
      });
    });

    revalidateAlbums(album.id);
    return NextResponse.json(serializeAlbum(album));
  } catch (error) {
    console.error("更新相册失败:", error);
    return NextResponse.json(
      { detail: "更新相册失败", error: "更新相册失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) return authResult;

    const albumId = await getAlbumId(params);
    if (albumId === null) {
      return NextResponse.json({ detail: "无效的ID", error: "无效的ID" }, { status: 400 });
    }

    await prisma.album.delete({ where: { id: albumId } });
    revalidateAlbums(albumId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除相册失败:", error);
    return NextResponse.json(
      { detail: "删除相册失败", error: "删除相册失败" },
      { status: 500 }
    );
  }
}
