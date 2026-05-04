import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { revalidateLinks } from "@/lib/revalidate";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const rawIds: unknown[] = Array.isArray(body?.ids) ? body.ids : [];
    const parsedIds: number[] = [];

    for (const value of rawIds) {
      const parsed = Number(value);
      if (Number.isInteger(parsed) && parsed > 0) {
        parsedIds.push(parsed);
      }
    }

    const ids = Array.from(new Set(parsedIds));

    if (ids.length === 0) {
      return NextResponse.json(
        { detail: "缺少有效的链接 ID", error: "缺少有效的链接 ID" },
        { status: 400 }
      );
    }

    const result = await prisma.link.updateMany({
      where: {
        id: { in: ids },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    revalidateLinks();

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("批量关闭失效链接失败:", error);
    return NextResponse.json(
      { detail: "批量关闭失效链接失败", error: "批量关闭失效链接失败" },
      { status: 500 }
    );
  }
}
