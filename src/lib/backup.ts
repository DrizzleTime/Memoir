import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { clearSiteConfigCache } from "@/lib/site";

const BACKUP_VERSION = 1;
const APP_NAME = "memoir";

const TABLE_NAMES = [
  "users",
  "categories",
  "links",
  "configs",
  "uploadFiles",
  "albums",
  "albumImages",
  "memos",
  "articles",
  "articleHistories",
  "memoSourceMessages",
  "comments",
] as const;

type BackupTableName = (typeof TABLE_NAMES)[number];

type BackupTables = Record<BackupTableName, unknown[]>;

export type BackupPayload = {
  version: number;
  app: typeof APP_NAME;
  exportedAt: string;
  tables: BackupTables;
};

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

const DATE_FIELDS: Record<BackupTableName, string[]> = {
  users: ["createdAt", "updatedAt"],
  categories: ["createdAt", "updatedAt"],
  links: ["createdAt", "updatedAt"],
  configs: ["createdAt", "updatedAt"],
  uploadFiles: ["createdAt", "updatedAt"],
  albums: ["createdAt", "updatedAt"],
  albumImages: ["createdAt"],
  memos: ["createdAt", "updatedAt"],
  articles: ["publishedAt", "createdAt", "updatedAt"],
  articleHistories: ["createdAt", "updatedAt"],
  memoSourceMessages: ["createdAt"],
  comments: ["createdAt", "updatedAt"],
};

export async function createBackupPayload(prisma: PrismaClient): Promise<BackupPayload> {
  const [
    users,
    categories,
    links,
    configs,
    uploadFiles,
    albums,
    albumImages,
    memos,
    articles,
    articleHistories,
    memoSourceMessages,
    comments,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { id: "asc" } }),
    prisma.category.findMany({ orderBy: { id: "asc" } }),
    prisma.link.findMany({ orderBy: { id: "asc" } }),
    prisma.config.findMany({ orderBy: { id: "asc" } }),
    prisma.uploadFile.findMany({ orderBy: { id: "asc" } }),
    prisma.album.findMany({ orderBy: { id: "asc" } }),
    prisma.albumImage.findMany({ orderBy: { id: "asc" } }),
    prisma.memo.findMany({ orderBy: { id: "asc" } }),
    prisma.article.findMany({ orderBy: { id: "asc" } }),
    prisma.articleHistory.findMany({ orderBy: { id: "asc" } }),
    prisma.memoSourceMessage.findMany({ orderBy: { id: "asc" } }),
    prisma.comment.findMany({ orderBy: { id: "asc" } }),
  ]);

  return {
    version: BACKUP_VERSION,
    app: APP_NAME,
    exportedAt: new Date().toISOString(),
    tables: {
      users,
      categories,
      links,
      configs,
      uploadFiles,
      albums,
      albumImages,
      memos,
      articles,
      articleHistories,
      memoSourceMessages,
      comments,
    },
  };
}

export async function restoreBackupPayload(
  prisma: PrismaClient,
  payload: unknown
): Promise<Record<BackupTableName, number>> {
  assertBackupPayload(payload);

  const tables = normalizeTables(payload.tables);

  const result = await prisma.$transaction(async (tx) => {
    await clearTables(tx);
    await createRows(tx, tables);

    return Object.fromEntries(
      TABLE_NAMES.map((tableName) => [tableName, tables[tableName].length])
    ) as Record<BackupTableName, number>;
  });

  clearSiteConfigCache();

  return result;
}

function assertBackupPayload(payload: unknown): asserts payload is BackupPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("备份文件格式不正确");
  }

  const candidate = payload as Partial<BackupPayload>;
  if (candidate.app !== APP_NAME || candidate.version !== BACKUP_VERSION) {
    throw new Error("备份文件版本不兼容");
  }

  if (!candidate.tables || typeof candidate.tables !== "object") {
    throw new Error("备份文件缺少 tables 数据");
  }

  for (const tableName of TABLE_NAMES) {
    if (!Array.isArray(candidate.tables[tableName])) {
      throw new Error(`备份文件缺少 ${tableName} 表数据`);
    }
  }
}

function normalizeTables(tables: BackupTables): BackupTables {
  return Object.fromEntries(
    TABLE_NAMES.map((tableName) => [
      tableName,
      tables[tableName].map((row) => normalizeDates(tableName, row)),
    ])
  ) as BackupTables;
}

function normalizeDates(tableName: BackupTableName, row: unknown) {
  if (!row || typeof row !== "object") return row;

  const normalized = { ...(row as Record<string, unknown>) };
  for (const field of DATE_FIELDS[tableName]) {
    if (typeof normalized[field] === "string") {
      normalized[field] = new Date(normalized[field]);
    }
  }

  return normalized;
}

async function clearTables(tx: PrismaTransaction) {
  await tx.comment.deleteMany();
  await tx.articleHistory.deleteMany();
  await tx.memoSourceMessage.deleteMany();
  await tx.article.deleteMany();
  await tx.memo.deleteMany();
  await tx.category.deleteMany();
  await tx.link.deleteMany();
  await tx.config.deleteMany();
  await tx.albumImage.deleteMany();
  await tx.album.deleteMany();
  await tx.uploadFile.deleteMany();
  await tx.user.deleteMany();
}

async function createRows(tx: PrismaTransaction, tables: BackupTables) {
  await createMany(tx.user, tables.users as Prisma.UserCreateManyInput[]);
  await createMany(tx.category, tables.categories as Prisma.CategoryCreateManyInput[]);
  await createMany(tx.link, tables.links as Prisma.LinkCreateManyInput[]);
  await createMany(tx.config, tables.configs as Prisma.ConfigCreateManyInput[]);
  await createMany(tx.uploadFile, tables.uploadFiles as Prisma.UploadFileCreateManyInput[]);
  await createMany(tx.album, tables.albums as Prisma.AlbumCreateManyInput[]);
  await createMany(tx.albumImage, tables.albumImages as Prisma.AlbumImageCreateManyInput[]);
  await createMany(tx.memo, tables.memos as Prisma.MemoCreateManyInput[]);
  await createMany(tx.article, tables.articles as Prisma.ArticleCreateManyInput[]);
  await createMany(tx.articleHistory, tables.articleHistories as Prisma.ArticleHistoryCreateManyInput[]);
  await createMany(tx.memoSourceMessage, tables.memoSourceMessages as Prisma.MemoSourceMessageCreateManyInput[]);
  await createMany(tx.comment, tables.comments as Prisma.CommentCreateManyInput[]);
}

async function createMany<T>(
  model: { createMany: (args: { data: T[] }) => Promise<unknown> },
  data: T[]
) {
  if (data.length === 0) return;
  await model.createMany({ data });
}
