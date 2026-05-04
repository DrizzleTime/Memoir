import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/api-route";
import { restoreBackupPayload } from "@/lib/backup";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择备份文件" }, { status: 400 });
    }

    const text = await file.text();
    let payload: unknown;

    try {
      payload = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "备份文件不是有效 JSON" }, { status: 400 });
    }

    const restored = await restoreBackupPayload(prisma, payload);

    return NextResponse.json({ restored });
  } catch (error) {
    console.error("恢复备份失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "恢复备份失败" },
      { status: 500 }
    );
  }
}
