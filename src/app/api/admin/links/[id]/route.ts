import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNumericId, requireCurrentUser } from "@/lib/api-route";
import { revalidateLinks } from "@/lib/revalidate";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const linkId = parseNumericId(id);
    if (linkId === null) {
      return NextResponse.json({ detail: "无效的ID", error: "无效的ID" }, { status: 400 });
    }

    const link = await prisma.link.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      return NextResponse.json(
        { detail: "链接不存在", error: "链接不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(link);
  } catch (error) {
    console.error("获取链接失败:", error);
    return NextResponse.json(
      { detail: "获取链接失败", error: "获取链接失败" },
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
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const linkId = parseNumericId(id);
    if (linkId === null) {
      return NextResponse.json({ detail: "无效的ID", error: "无效的ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, url, avatarUrl, category, sortOrder, isActive } = body;

    if (!name || !url) {
      return NextResponse.json(
        { detail: "名称和URL为必填项", error: "名称和URL为必填项" },
        { status: 400 }
      );
    }

    const link = await prisma.link.update({
      where: { id: linkId },
      data: {
        name,
        url,
        avatarUrl: avatarUrl || null,
        category: category || "friend",
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    revalidateLinks();

    return NextResponse.json(link);
  } catch (error) {
    console.error("更新链接失败:", error);
    return NextResponse.json(
      { detail: "更新链接失败", error: "更新链接失败" },
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
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const linkId = parseNumericId(id);
    if (linkId === null) {
      return NextResponse.json({ detail: "无效的ID", error: "无效的ID" }, { status: 400 });
    }

    await prisma.link.delete({
      where: { id: linkId },
    });

    revalidateLinks();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除链接失败:", error);
    return NextResponse.json(
      { detail: "删除链接失败", error: "删除链接失败" },
      { status: 500 }
    );
  }
}
