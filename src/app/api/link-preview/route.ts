import { NextRequest, NextResponse } from "next/server";
import { getLinkPreview } from "@/lib/link-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "缺少 url" }, { status: 400 });
    }

    const preview = await getLinkPreview(url);
    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

