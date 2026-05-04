import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const categories = await prisma.category.findMany({
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("获取分类列表失败:", error);
    return NextResponse.json({ error: "获取分类列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const slugInput = body.slug === null || body.slug === undefined ? "" : String(body.slug);
    const slug = slugInput.trim() || null;

    if (!name) {
      return NextResponse.json({ error: "名称为必填项" }, { status: 400 });
    }

    const existingByName = await prisma.category.findUnique({ where: { name } });
    if (existingByName) {
      return NextResponse.json({ error: "分类名称已存在" }, { status: 400 });
    }

    if (slug) {
      const existingBySlug = await prisma.category.findUnique({ where: { slug } });
      if (existingBySlug) {
        return NextResponse.json({ error: "分类 slug 已存在" }, { status: 400 });
      }
    }

    const category = await prisma.category.create({
      data: { name, slug },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("创建分类失败:", error);
    return NextResponse.json({ error: "创建分类失败" }, { status: 500 });
  }
}
