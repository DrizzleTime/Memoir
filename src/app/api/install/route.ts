import { NextRequest, NextResponse } from "next/server";
import { installMemoir, isInstalled } from "@/lib/install";
import { installSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    installed: isInstalled(),
  });
}

export async function POST(request: NextRequest) {
  try {
    if (isInstalled()) {
      return NextResponse.json(
        { detail: "系统已安装" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const result = installSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const token = await installMemoir(result.data);
    return NextResponse.json(token, { status: 201 });
  } catch (error) {
    console.error("Install error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "安装失败" },
      { status: 500 }
    );
  }
}
