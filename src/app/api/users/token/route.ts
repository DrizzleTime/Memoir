import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      return NextResponse.json(
        { detail: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      return NextResponse.json(
        { detail: "用户名或密码错误" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { detail: "用户名或密码错误" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    const accessToken = createToken(user.id);

    return NextResponse.json({
      access_token: accessToken,
      token_type: "bearer",
    });
  } catch (error) {
    console.error("Token API error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
