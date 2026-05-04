import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { getConfiguredJwtSecret } from "@/lib/runtime-config";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  createdAt: Date;
};

const INVALID_JWT_SECRETS = new Set([
  "your-secret-key-change-in-production",
  "replace-with-a-long-random-secret",
]);
const TOKEN_EXPIRE_DAYS = 7;

function getJwtSecret(): string {
  const secret = getConfiguredJwtSecret();
  if (!secret || INVALID_JWT_SECRETS.has(secret)) {
    throw new Error("JWT_SECRET 未配置或仍在使用默认值");
  }

  return secret;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function createToken(userId: number): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: `${TOKEN_EXPIRE_DAYS}d`,
  });
}

export function verifyToken(token: string): { sub: number } | null {
  const jwtSecret = getJwtSecret();

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (typeof payload === "object" && payload !== null && "sub" in payload) {
      return { sub: Number(payload.sub) };
    }
    return null;
  } catch {
    return null;
  }
}

export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  return user;
}

export async function getCurrentUserOptional(request: NextRequest): Promise<AuthUser | null> {
  try {
    return await getCurrentUser(request);
  } catch {
    return null;
  }
}

export function formatUserResponse(user: AuthUser) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio,
    created_at: user.createdAt.toISOString(),
  };
}
