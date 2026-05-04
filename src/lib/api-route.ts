import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AuthUser } from "@/lib/auth";

type UnauthorizedShape = "detail" | "error" | "detail-error";

export async function requireCurrentUser(
  request: NextRequest,
  shape: UnauthorizedShape = "detail"
): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser(request);
  if (user) {
    return user;
  }

  return createUnauthorizedResponse(shape);
}

export function parseNumericId(rawValue: string): number | null {
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function createUnauthorizedResponse(shape: UnauthorizedShape): NextResponse {
  if (shape === "error") {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  if (shape === "detail-error") {
    return NextResponse.json(
      { detail: "未授权", error: "未授权" },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { detail: "无法验证凭据" },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
  );
}
