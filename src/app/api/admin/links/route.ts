import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { revalidateLinks } from "@/lib/revalidate";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActiveParam = searchParams.get("isActive");
    const query = (searchParams.get("q") || "").trim();

    const where: NonNullable<Parameters<typeof prisma.link.findMany>[0]>["where"] = {};
    if (category) {
      where.category = category;
    }
    if (isActiveParam === "true") {
      where.isActive = true;
    } else if (isActiveParam === "false") {
      where.isActive = false;
    }
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { url: { contains: query } },
      ];
    }

    const links = await prisma.link.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("获取链接列表失败:", error);
    return NextResponse.json(
      { detail: "获取链接列表失败", error: "获取链接列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { name, url, avatarUrl, category, sortOrder, isActive } = body;

    if (!name || !url) {
      return NextResponse.json(
        { detail: "名称和URL为必填项", error: "名称和URL为必填项" },
        { status: 400 }
      );
    }

    const link = await prisma.link.create({
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

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("创建链接失败:", error);
    return NextResponse.json(
      { detail: "创建链接失败", error: "创建链接失败" },
      { status: 500 }
    );
  }
}
