import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { checkLinks } from "@/lib/link-check";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const links = await prisma.link.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    const items = await checkLinks(links);
    const validCount = items.filter((item) => item.status === "valid").length;
    const invalidCount = items.length - validCount;
    const activeInvalidCount = items.filter(
      (item) => item.status === "invalid" && item.isActive
    ).length;

    return NextResponse.json({
      scannedAt: new Date().toISOString(),
      total: items.length,
      validCount,
      invalidCount,
      activeInvalidCount,
      items,
    });
  } catch (error) {
    console.error("检测链接状态失败:", error);
    return NextResponse.json(
      { detail: "检测链接状态失败", error: "检测链接状态失败" },
      { status: 500 }
    );
  }
}
