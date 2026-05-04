export interface FileMeta {
  mimeType: string | null;
  relativePath: string;
}

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "m4v"];

export function getBaseName(relativePath: string) {
  const parts = relativePath.split("/");
  return parts[parts.length - 1] || relativePath;
}

export function getFileExtension(relativePath: string) {
  const baseName = getBaseName(relativePath).toLowerCase();
  const dotIndex = baseName.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return baseName.slice(dotIndex + 1);
}

export function isImageFile(file: FileMeta) {
  if (file.mimeType?.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.includes(getFileExtension(file.relativePath));
}

export function isVideoFile(file: FileMeta) {
  if (file.mimeType?.startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.includes(getFileExtension(file.relativePath));
}
