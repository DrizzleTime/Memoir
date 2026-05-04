import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, formatUserResponse } from "@/lib/auth";
import { userUpdateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { detail: "无法验证凭据" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    return NextResponse.json(formatUserResponse(user));
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { detail: "无法验证凭据" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    const body = await request.json();
    const result = userUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const updateData = result.data;

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(updateData.nickname !== undefined && { nickname: updateData.nickname }),
        ...(updateData.avatar !== undefined && { avatar: updateData.avatar }),
        ...(updateData.bio !== undefined && { bio: updateData.bio }),
      },
    });

    return NextResponse.json(formatUserResponse(updatedUser));
  } catch (error) {
    console.error("Update current user error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
