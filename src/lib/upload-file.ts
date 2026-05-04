import crypto from "crypto";
import fs from "fs";
import path from "path";
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
  const { year, month } = getYearMonth();
  const ext = path.extname(params.originalName);
  const savedName = `${crypto.randomUUID()}${ext}`;
  const relativePath = path.posix.join(year, month, savedName);

  const uploadsDir = path.join(process.cwd(), "data", "uploads", year, month);
  fs.mkdirSync(uploadsDir, { recursive: true });

  const absolutePath = path.join(uploadsDir, savedName);
  fs.writeFileSync(absolutePath, params.buffer);

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
      size: params.buffer.length,
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
  file: Pick<File, "name" | "type" | "arrayBuffer">
): Promise<UploadedFileResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return saveBufferAsUploadFile({
    buffer,
    originalName: file.name,
    mimeType: file.type || null,
  });
}
