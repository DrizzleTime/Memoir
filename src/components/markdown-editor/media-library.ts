import { getStoredAdminToken } from "@/lib/admin-session";
import type { ListResponse, UploadResponse } from "@/types/files";

function getRequiredAdminToken() {
  const token = getStoredAdminToken();
  if (!token) {
    throw new Error("未登录或登录已过期");
  }
  return token;
}

async function readJson(response: Response) {
  return response.json().catch(() => null);
}

export async function fetchMediaLibraryFiles(page: number, pageSize: number) {
  const token = getRequiredAdminToken();
  const response = await fetch(`/api/admin/files?page=${page}&pageSize=${pageSize}&missing=false`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(data?.error || "获取文件列表失败");
  }
  if (!data) {
    throw new Error("获取文件列表失败");
  }

  return data as ListResponse;
}

export async function fetchMediaLibraryImages(page: number, pageSize: number) {
  const token = getRequiredAdminToken();
  const response = await fetch(`/api/admin/files?page=${page}&pageSize=${pageSize}&missing=false&type=image`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(data?.error || "获取图片列表失败");
  }
  if (!data) {
    throw new Error("获取图片列表失败");
  }

  return data as ListResponse;
}

export async function uploadMediaLibraryFiles(files: File[]) {
  const token = getRequiredAdminToken();
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/admin/files/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = (await readJson(response)) as UploadResponse | null;

  if (!response.ok) {
    throw new Error(data?.error || data?.errors?.[0]?.error || "上传失败");
  }
  if (!data) {
    throw new Error("上传失败");
  }

  return data;
}
