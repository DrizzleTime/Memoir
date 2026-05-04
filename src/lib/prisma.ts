import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getConfiguredDatabaseUrl } from "@/lib/runtime-config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDatabaseUrl: string | undefined;
};

function createPrismaClient() {
  const databaseUrl = getConfiguredDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("数据库未配置，请先完成安装");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const databaseUrl = getConfiguredDatabaseUrl();
    if (!databaseUrl) {
      throw new Error("数据库未配置，请先完成安装");
    }

    if (!globalForPrisma.prisma || globalForPrisma.prismaDatabaseUrl !== databaseUrl) {
      globalForPrisma.prisma = createPrismaClient();
      globalForPrisma.prismaDatabaseUrl = databaseUrl;
    }

    const value = Reflect.get(globalForPrisma.prisma, prop, receiver);
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
  },
});
