import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/api-route";
import { createBackupPayload } from "@/lib/backup";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const payload = await createBackupPayload(prisma);
    const filename = `memoir-backup-${payload.exportedAt.slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("导出备份失败:", error);
    return NextResponse.json({ error: "导出备份失败" }, { status: 500 });
  }
}
