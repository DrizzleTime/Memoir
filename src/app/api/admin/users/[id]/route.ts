import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatUserResponse, hashPassword } from "@/lib/auth";
import { parseNumericId, requireCurrentUser } from "@/lib/api-route";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const userId = parseNumericId(id);
    if (userId === null) {
      return NextResponse.json({ detail: "无效的用户ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json({ detail: "用户不存在" }, { status: 404 });
    }

    const body = await request.json();
    const { nickname, avatar, bio, password } = body as {
      nickname?: unknown;
      avatar?: unknown;
      bio?: unknown;
      password?: unknown;
    };

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 6) {
        return NextResponse.json({ detail: "密码至少 6 位" }, { status: 400 });
      }
    }

    if (
      nickname === undefined &&
      avatar === undefined &&
      bio === undefined &&
      password === undefined
    ) {
      return NextResponse.json({ detail: "没有需要更新的字段" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname !== undefined && { nickname: nickname as string | null }),
        ...(avatar !== undefined && { avatar: avatar as string | null }),
        ...(bio !== undefined && { bio: bio as string | null }),
        ...(password !== undefined && { passwordHash: hashPassword(password as string) }),
      },
    });

    return NextResponse.json(formatUserResponse(updatedUser));
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ detail: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const userId = parseNumericId(id);
    if (userId === null) {
      return NextResponse.json({ detail: "无效的用户ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json({ detail: "用户不存在" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ detail: "服务器内部错误" }, { status: 500 });
  }
}
