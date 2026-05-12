import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import type { ReadableStream as NodeReadableStream } from "stream/web";
import { prisma } from "@/lib/prisma";
import { convertToWebp, isConvertibleImage } from "@/lib/webp";

function getYearMonth(date = new Date()) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return { year, month };
}

export interface UploadedFileResult {
  id: number;
  relativePath: string;
  originalName: string;
  mimeType: string | null;
  size: number;
  isMissing: boolean;
  createdAt: Date;
  updatedAt: Date;
  url: string;
  webpUrl: string | null;
}

export async function saveBufferAsUploadFile(params: {
  buffer: Buffer;
  originalName: string;
  mimeType?: string | null;
}): Promise<UploadedFileResult> {
  return saveUploadFile({
    writeFile: async (absolutePath) => {
      await fs.promises.writeFile(absolutePath, params.buffer);
    },
    originalName: params.originalName,
    mimeType: params.mimeType,
    size: params.buffer.length,
  });
}

async function saveUploadFile(params: {
  writeFile: (absolutePath: string) => Promise<void>;
  originalName: string;
  mimeType?: string | null;
  size: number;
}): Promise<UploadedFileResult> {
  const { year, month } = getYearMonth();
  const ext = path.extname(params.originalName);
  const savedName = `${crypto.randomUUID()}${ext}`;
  const relativePath = path.posix.join(year, month, savedName);

  const uploadsDir = path.join(process.cwd(), "data", "uploads", year, month);
  fs.mkdirSync(uploadsDir, { recursive: true });

  const absolutePath = path.join(uploadsDir, savedName);
  await params.writeFile(absolutePath);

  let webpRelativePath: string | null = null;
  if (isConvertibleImage(absolutePath)) {
    const webpResult = await convertToWebp(absolutePath);
    if (webpResult) {
      const webpName = path.basename(webpResult.path);
      webpRelativePath = path.posix.join(year, month, webpName);
    }
  }

  const created = await prisma.uploadFile.create({
    data: {
      relativePath,
      originalName: params.originalName,
      mimeType: params.mimeType || null,
      size: params.size,
      isMissing: false,
    },
  });

  return {
    ...created,
    url: `/uploads/${relativePath}`,
    webpUrl: webpRelativePath ? `/uploads/${webpRelativePath}` : null,
  };
}

export async function saveWebFileAsUploadFile(
  file: Pick<File, "name" | "type" | "size" | "stream">
): Promise<UploadedFileResult> {
  return saveUploadFile({
    writeFile: async (absolutePath) => {
      const stream = file.stream() as unknown as NodeReadableStream<Uint8Array>;
      await pipeline(
        Readable.fromWeb(stream),
        fs.createWriteStream(absolutePath)
      );
    },
    originalName: file.name,
    mimeType: file.type || null,
    size: file.size,
  });
}
