import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: { isActive: boolean; category?: string } = { isActive: true };
    if (category) {
      where.category = category;
    }

    const links = await prisma.link.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        url: true,
        avatarUrl: true,
        category: true,
      },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("获取链接列表失败:", error);
    return NextResponse.json({ error: "获取链接列表失败" }, { status: 500 });
  }
}
