import sharp from "sharp";
import fs from "fs";
import path from "path";

sharp.cache(false);
sharp.concurrency(1);

/**
 * 支持转换为 WebP 的图片扩展名
 */
export const CONVERTIBLE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"];

/**
 * WebP 文件后缀
 */
export const WEBP_SUFFIX = "-memoir.webp";

/**
 * 检查文件是否可以转换为 WebP
 */
export function isConvertibleImage(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return CONVERTIBLE_EXTENSIONS.includes(ext);
}

/**
 * 获取 WebP 版本的文件路径
 * 例如: /path/to/image.jpg -> /path/to/image-memoir.webp
 */
export function getWebpPath(originalPath: string): string {
  const ext = path.extname(originalPath);
  const basePath = originalPath.slice(0, -ext.length);
  return `${basePath}${WEBP_SUFFIX}`;
}

/**
 * 检查是否是 memoir webp 文件
 */
export function isMemoirWebp(filePath: string): boolean {
  return filePath.endsWith(WEBP_SUFFIX);
}

/**
 * 将图片转换为高质量有损 WebP 格式（quality=80）
 * @param inputPath 原始图片路径
 * @param outputPath WebP 输出路径（可选，默认在同目录生成 -memoir.webp）
 * @returns 生成的 WebP 文件大小，如果失败返回 null
 */
export async function convertToWebp(
  inputPath: string,
  outputPath?: string
): Promise<{ size: number; path: string } | null> {
  try {
    if (!fs.existsSync(inputPath)) {
      console.error(`文件不存在: ${inputPath}`);
      return null;
    }

    const targetPath = outputPath || getWebpPath(inputPath);
    const ext = path.extname(inputPath).toLowerCase();

    // 使用 sharp 进行高质量有损 WebP 转换
    const webpOptions: sharp.WebpOptions = {
      quality: 80,
      effort: 4, // 压缩努力程度 (0-6)，更高意味着更小的文件但更慢
    };
    if (ext === ".png") {
      webpOptions.alphaQuality = 80;
    }

    await sharp(inputPath)
      .rotate()
      .webp(webpOptions)
      .toFile(targetPath);

    const stat = fs.statSync(targetPath);
    return { size: stat.size, path: targetPath };
  } catch (error) {
    console.error(`转换 WebP 失败: ${inputPath}`, error);
    return null;
  }
}

/**
 * 批量转换图片为 WebP
 * @param files 文件路径列表
 * @param onProgress 进度回调
 */
export async function batchConvertToWebp(
  files: string[],
  onProgress?: (current: number, total: number, file: string) => void
): Promise<{
  success: number;
  failed: number;
  skipped: number;
  totalSize: number;
}> {
  let success = 0;
  let failed = 0;
  let skipped = 0;
  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length, file);

    // 跳过已经是 memoir webp 的文件
    if (isMemoirWebp(file)) {
      skipped++;
      continue;
    }

    // 跳过非图片文件
    if (!isConvertibleImage(file)) {
      skipped++;
      continue;
    }

    // 检查是否已存在 webp 版本
    const webpPath = getWebpPath(file);
    if (fs.existsSync(webpPath)) {
      skipped++;
      continue;
    }

    const result = await convertToWebp(file);
    if (result) {
      success++;
      totalSize += result.size;
    } else {
      failed++;
    }
  }

  return { success, failed, skipped, totalSize };
}
