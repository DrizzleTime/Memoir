import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { clearSiteConfigCache } from "@/lib/site";
import {
  getConfiguredDatabaseUrl,
  hasRuntimeConfig,
  writeRuntimeConfig,
} from "@/lib/runtime-config";
import { hashPassword, createToken, formatUserResponse } from "@/lib/auth";

const execFileAsync = promisify(execFile);

const INSTALL_SITE_CONFIGS = [
  ["site_url", "站点 URL"],
  ["site_name", "站点名称"],
  ["site_title", "浏览器标题"],
  ["site_tagline", "站点标语"],
  ["site_description", "站点描述"],
  ["site_contact_email", "站点联系邮箱"],
] as const;

export interface InstallInput {
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    sslMode: string;
  };
  site: {
    url: string;
    name: string;
    title: string;
    tagline: string;
    description: string;
    contactEmail: string;
  };
  admin: {
    username: string;
    email: string;
    password: string;
    nickname?: string;
  };
}

export function isInstalled(): boolean {
  return hasRuntimeConfig() || Boolean(getConfiguredDatabaseUrl());
}

export function buildPostgresUrl(input: InstallInput["database"]): string {
  const auth = `${encodeURIComponent(input.username)}:${encodeURIComponent(input.password)}`;
  const url = new URL(`postgresql://${auth}@${input.host}:${input.port}/${encodeURIComponent(input.name)}`);

  if (input.sslMode && input.sslMode !== "disable") {
    url.searchParams.set("sslmode", input.sslMode);
  }

  return url.toString();
}

export async function installMemoir(input: InstallInput) {
  if (isInstalled()) {
    throw new Error("系统已安装");
  }

  const databaseUrl = buildPostgresUrl(input.database);
  await assertDatabaseConnectable(databaseUrl);
  await pushDatabaseSchema(databaseUrl);

  const jwtSecret = crypto.randomBytes(48).toString("base64url");
  const prisma = createInstallPrisma(databaseUrl);

  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      throw new Error("数据库中已存在用户，请使用空数据库安装");
    }

    const user = await prisma.$transaction(async (tx) => {
      await Promise.all(
        INSTALL_SITE_CONFIGS.map(([key, description]) =>
          tx.config.upsert({
            where: { key },
            update: {
              value: getSiteConfigValue(input, key),
              description,
            },
            create: {
              key,
              value: getSiteConfigValue(input, key),
              description,
            },
          })
        )
      );

      return tx.user.create({
        data: {
          username: input.admin.username,
          email: input.admin.email,
          passwordHash: hashPassword(input.admin.password),
          nickname: input.admin.nickname || input.admin.username,
        },
      });
    });

    writeRuntimeConfig({
      version: 1,
      installedAt: new Date().toISOString(),
      databaseUrl,
      jwtSecret,
    });
    clearSiteConfigCache();

    return {
      access_token: createToken(user.id),
      token_type: "bearer",
      user: formatUserResponse(user),
    };
  } finally {
    await prisma.$disconnect();
  }
}

function createInstallPrisma(databaseUrl: string) {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

async function assertDatabaseConnectable(databaseUrl: string) {
  const prisma = createInstallPrisma(databaseUrl);
  try {
    await prisma.$queryRaw`SELECT 1`;
  } finally {
    await prisma.$disconnect();
  }
}

async function pushDatabaseSchema(databaseUrl: string) {
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
  };

  try {
    await execFileAsync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"],
      {
        cwd: process.cwd(),
        env,
        timeout: 120_000,
        maxBuffer: 1024 * 1024 * 4,
      }
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "自动建表失败";
    throw new Error(`自动建表失败：${detail}`);
  }
}

function getSiteConfigValue(input: InstallInput, key: string): string {
  if (key === "site_url") return normalizeSiteUrl(input.site.url);
  if (key === "site_name") return input.site.name;
  if (key === "site_title") return input.site.title;
  if (key === "site_tagline") return input.site.tagline;
  if (key === "site_description") return input.site.description;
  if (key === "site_contact_email") return input.site.contactEmail;
  return "";
}

function normalizeSiteUrl(input: string): string {
  return new URL(input.trim()).toString().replace(/\/$/, "");
}
