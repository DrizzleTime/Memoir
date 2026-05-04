import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { getValidImageFiles, normalizeAlbumPayload, serializeAlbum } from "@/lib/album";
import { revalidateAlbums } from "@/lib/revalidate";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) return authResult;

    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { images: true } } },
    });

    return NextResponse.json(albums.map(serializeAlbum));
  } catch (error) {
    console.error("获取相册列表失败:", error);
    return NextResponse.json(
      { detail: "获取相册列表失败", error: "获取相册列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) return authResult;

    const payload = normalizeAlbumPayload(await request.json());
    if (!payload.title) {
      return NextResponse.json(
        { detail: "标题为必填项", error: "标题为必填项" },
        { status: 400 }
      );
    }

    const imageFiles = await getValidImageFiles(payload.fileIds);
    if (imageFiles.length !== payload.fileIds.length) {
      return NextResponse.json(
        { detail: "只能选择媒体库中的有效图片", error: "只能选择媒体库中的有效图片" },
        { status: 400 }
      );
    }

    const album = await prisma.album.create({
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

    revalidateAlbums(album.id);
    return NextResponse.json(serializeAlbum(album), { status: 201 });
  } catch (error) {
    console.error("创建相册失败:", error);
    return NextResponse.json(
      { detail: "创建相册失败", error: "创建相册失败" },
      { status: 500 }
    );
  }
}
