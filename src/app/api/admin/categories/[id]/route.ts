import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNumericId, requireCurrentUser } from "@/lib/api-route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const categoryId = parseNumericId(id);
    if (categoryId === null) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("获取分类失败:", error);
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const categoryId = parseNumericId(id);
    if (categoryId === null) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const slugInput = body.slug === null || body.slug === undefined ? "" : String(body.slug);
    const slug = slugInput.trim() || null;

    if (!name) {
      return NextResponse.json({ error: "名称为必填项" }, { status: 400 });
    }

    const existingByName = await prisma.category.findFirst({
      where: { name, id: { not: categoryId } },
    });
    if (existingByName) {
      return NextResponse.json({ error: "分类名称已存在" }, { status: 400 });
    }

    if (slug) {
      const existingBySlug = await prisma.category.findFirst({
        where: { slug, id: { not: categoryId } },
      });
      if (existingBySlug) {
        return NextResponse.json({ error: "分类 slug 已存在" }, { status: 400 });
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name, slug },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("更新分类失败:", error);
    return NextResponse.json({ error: "更新分类失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const categoryId = parseNumericId(id);
    if (categoryId === null) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除分类失败:", error);
    return NextResponse.json({ error: "删除分类失败" }, { status: 500 });
  }
}
