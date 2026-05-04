export interface UploadFileItem {
  id: number;
  relativePath: string;
  originalName: string;
  mimeType: string | null;
  size: number;
  isMissing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  count: number;
  items: UploadFileItem[];
  errors?: Array<{ name: string; error: string }>;
  error?: string;
  url?: string;
}

export interface ListResponse {
  data: UploadFileItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface WebpCleanupPreviewItem {
  relativePath: string;
  size: number;
}

export interface WebpCleanupPreview {
  count: number;
  totalSize: number;
  suffix?: string;
  files: WebpCleanupPreviewItem[];
  hasMore?: boolean;
}

export interface WebpConvertPreviewItem {
  id: number;
  relativePath: string;
  size: number;
}

export interface WebpConvertPreview {
  totalImages: number;
  pendingCount: number;
  existingCount: number;
  totalOriginalSize: number;
  files: WebpConvertPreviewItem[];
  hasMore?: boolean;
}
