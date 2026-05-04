"use client";

import {
  AudioOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileZipOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { getFileExtension, isImageFile } from "@/lib/file-meta";
import type { UploadFileItem } from "@/types/files";

export function getFileTypeIcon(file: UploadFileItem) {
  const mimeType = file.mimeType || "";
  const ext = getFileExtension(file.relativePath);

  if (isImageFile(file)) return <FileImageOutlined style={{ fontSize: 36, color: "#1677ff" }} />;
  if (mimeType.startsWith("video/") || ["mp4", "webm"].includes(ext)) {
    return <VideoCameraOutlined style={{ fontSize: 36, color: "#fa8c16" }} />;
  }
  if (mimeType.startsWith("audio/") || ["mp3", "wav"].includes(ext)) {
    return <AudioOutlined style={{ fontSize: 36, color: "#52c41a" }} />;
  }
  if (mimeType === "application/pdf" || ext === "pdf") {
    return <FilePdfOutlined style={{ fontSize: 36, color: "#f5222d" }} />;
  }
  if (mimeType === "application/zip" || ext === "zip") {
    return <FileZipOutlined style={{ fontSize: 36, color: "#722ed1" }} />;
  }
  if (
    mimeType.startsWith("text/")
    || mimeType === "application/json"
    || ["txt", "md", "json", "js", "css", "html"].includes(ext)
  ) {
    return <FileTextOutlined style={{ fontSize: 36, color: "#13c2c2" }} />;
  }

  return <FileOutlined style={{ fontSize: 36, color: "#8c8c8c" }} />;
}
