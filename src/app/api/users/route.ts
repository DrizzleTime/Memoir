import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createToken, formatUserResponse } from "@/lib/auth";
import { userRegisterSchema, userLoginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "register") {
      return await handleRegister(body);
    } else if (action === "login") {
      return await handleLogin(body);
    } else {
      return NextResponse.json(
        { detail: "无效的操作类型，请使用 'register' 或 'login'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

async function handleRegister(body: unknown) {
  const result = userRegisterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { detail: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { username, email, password, nickname } = result.data;

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json(
      { detail: "注册已关闭，仅允许初始化首个用户" },
      { status: 403 }
    );
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    return NextResponse.json(
      { detail: "用户名已存在" },
      { status: 400 }
    );
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmail) {
    return NextResponse.json(
      { detail: "邮箱已存在" },
      { status: 400 }
    );
  }

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: hashPassword(password),
      nickname: nickname || username,
    },
  });

  const accessToken = createToken(user.id);

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "bearer",
      user: formatUserResponse(user),
    },
    { status: 201 }
  );
}

async function handleLogin(body: unknown) {
  const result = userLoginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { detail: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { username, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) {
    return NextResponse.json(
      { detail: "用户名或密码错误" },
      { status: 401 }
    );
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { detail: "用户名或密码错误" },
      { status: 401 }
    );
  }

  const accessToken = createToken(user.id);

  return NextResponse.json({
    access_token: accessToken,
    token_type: "bearer",
    user: formatUserResponse(user),
  });
}
