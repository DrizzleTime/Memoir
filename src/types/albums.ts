import type { UploadFileItem } from "@/types/files";

export interface AlbumImageItem {
  id: number;
  sortOrder: number;
  file: UploadFileItem;
}

export interface AlbumItem {
  id: number;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  images?: AlbumImageItem[];
}

export interface AlbumFormValues {
  title: string;
  description?: string;
  isPublic: boolean;
  fileIds: number[];
}
