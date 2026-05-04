"use client";

import { useCallback, useEffect, useState } from "react";
import { Form, Pagination, Spin, message } from "antd";
import { AdminFilesToolbar } from "@/components/admin/files/AdminFilesToolbar";
import { CleanupWebpModal } from "@/components/admin/files/CleanupWebpModal";
import { ConvertWebpModal } from "@/components/admin/files/ConvertWebpModal";
import { FileGrid } from "@/components/admin/files/FileGrid";
import { FilePreviewModal } from "@/components/admin/files/FilePreviewModal";
import { FileSearchBar } from "@/components/admin/files/FileSearchBar";
import { RenameFileModal } from "@/components/admin/files/RenameFileModal";
import { UploadFilesModal } from "@/components/admin/files/UploadFilesModal";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import { formatBytes } from "@/lib/format-bytes";
import { getBaseName } from "@/lib/file-meta";
import type {
  ListResponse,
  UploadFileItem,
  UploadResponse,
  WebpCleanupPreview,
  WebpConvertPreview,
} from "@/types/files";

export default function AdminFilesPage() {
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();

  const [previewFile, setPreviewFile] = useState<UploadFileItem | null>(null);

  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cleaningWebp, setCleaningWebp] = useState(false);
  const [webpCleanupPreview, setWebpCleanupPreview] = useState<WebpCleanupPreview | null>(null);
  const [webpCleanupPreviewLoading, setWebpCleanupPreviewLoading] = useState(false);

  const [convertingWebp, setConvertingWebp] = useState(false);
  const [webpPreview, setWebpPreview] = useState<WebpConvertPreview | null>(null);
  const [webpPreviewLoading, setWebpPreviewLoading] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renamingFile, setRenamingFile] = useState<UploadFileItem | null>(null);
  const [renameForm] = Form.useForm<{ newName: string }>();

  const fetchFiles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (searchQuery) {
        params.set("q", searchQuery);
      }
      const response = await authFetch(`/api/admin/files?${params.toString()}`);
      if (!response.ok) {
        throw new Error("获取文件列表失败");
      }
      const data: ListResponse = await response.json();
      setFiles(data.data);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [authFetch, messageApi, page, pageSize, searchQuery, token]);

  useEffect(() => {
    if (token) {
      fetchFiles();
    }
  }, [fetchFiles, token]);

  const handleOpenUpload = () => {
    setSelectedFiles([]);
    setUploadModalOpen(true);
  };

  const handleUpload = async () => {
    if (!token) return;
    if (selectedFiles.length === 0) {
      messageApi.error("请选择文件");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append("files", file);
      }

      const response = await authFetch("/api/admin/files/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "上传失败");
      }

      const result: UploadResponse = await response.json();
      const uploadedCount = result.items.length;
      const failedCount = result.errors?.length || 0;

      if (failedCount > 0) {
        messageApi.warning(`上传完成：成功 ${uploadedCount} 个，失败 ${failedCount} 个`);
      } else {
        messageApi.success(`上传成功，共 ${uploadedCount} 个文件`);
      }

      setUploadModalOpen(false);
      setSelectedFiles([]);
      if (page === 1) {
        fetchFiles();
      } else {
        setPage(1);
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/admin/files/${fileId}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "删除失败");
      }
      messageApi.success("删除成功");
      fetchFiles();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const handleOpenRename = (file: UploadFileItem) => {
    setRenamingFile(file);
    renameForm.setFieldsValue({ newName: file.originalName || getBaseName(file.relativePath) });
    setRenameModalOpen(true);
  };

  const handleRename = async (values: { newName: string }) => {
    if (!token) return;
    if (!renamingFile) return;

    setRenaming(true);
    try {
      const response = await authFetch(`/api/admin/files/${renamingFile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: values.newName }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "重命名失败");
      }

      messageApi.success("重命名成功");
      handleCloseRename();
      fetchFiles();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "重命名失败");
    } finally {
      setRenaming(false);
    }
  };

  const handleSync = async () => {
    if (!token) return;
    setSyncing(true);
    messageApi.open({ type: "loading", content: "正在扫描文件...", key: "sync" });
    try {
      const response = await authFetch("/api/admin/files/sync", { method: "POST" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "扫描失败");
      }
      const result = await response.json();
      messageApi.success({
        content: `扫描 ${result.scanned} 个文件：新增 ${result.created}，更新 ${result.updated}，恢复 ${result.restored}，标记缺失 ${result.markedMissing}`,
        key: "sync",
      });
      fetchFiles();
    } catch (error) {
      messageApi.error({
        content: error instanceof Error ? error.message : "扫描失败",
        key: "sync",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleClearIndex = async () => {
    if (!token) return;
    setClearing(true);
    messageApi.open({ type: "loading", content: "正在清空索引...", key: "clear" });
    try {
      const response = await authFetch("/api/admin/files", { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "清空失败");
      }
      const result = await response.json();
      messageApi.success({
        content: `已清空索引（删除 ${result.deleted} 条记录）`,
        key: "clear",
      });
      if (page === 1) {
        fetchFiles();
      } else {
        setPage(1);
      }
    } catch (error) {
      messageApi.error({
        content: error instanceof Error ? error.message : "清空失败",
        key: "clear",
      });
    } finally {
      setClearing(false);
    }
  };

  const handlePreviewWebpCleanup = async () => {
    if (!token) return;
    setWebpCleanupPreviewLoading(true);
    try {
      const response = await authFetch("/api/admin/files/cleanup-webp");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "获取预览失败");
      }
      const result = await response.json() as WebpCleanupPreview;
      setWebpCleanupPreview(result);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取预览失败");
    } finally {
      setWebpCleanupPreviewLoading(false);
    }
  };

  const handleCleanupWebp = async () => {
    if (!token) return;
    setCleaningWebp(true);
    messageApi.open({ type: "loading", content: "正在删除 WebP 转化图...", key: "cleanup-webp" });
    try {
      const response = await authFetch("/api/admin/files/cleanup-webp", { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "删除失败");
      }
      const result = await response.json();
      messageApi.success({
        content: `已删除 ${result.deletedCount} 个文件（${formatBytes(result.deletedSize)}）${result.errorCount > 0 ? `，${result.errorCount} 个失败` : ""}`,
        key: "cleanup-webp",
      });
      setWebpCleanupPreview(null);
      fetchFiles();
    } catch (error) {
      messageApi.error({
        content: error instanceof Error ? error.message : "删除失败",
        key: "cleanup-webp",
      });
    } finally {
      setCleaningWebp(false);
    }
  };

  const handlePreviewWebpConvert = async () => {
    if (!token) return;
    setWebpPreviewLoading(true);
    try {
      const response = await authFetch("/api/admin/files/convert-webp");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "获取预览失败");
      }
      const result = await response.json() as WebpConvertPreview;
      setWebpPreview(result);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取预览失败");
    } finally {
      setWebpPreviewLoading(false);
    }
  };

  const handleConvertWebp = async () => {
    if (!token) return;
    setConvertingWebp(true);
    messageApi.open({ type: "loading", content: "正在转换图片为 WebP...", key: "convert-webp", duration: 0 });
    try {
      const response = await authFetch("/api/admin/files/convert-webp", { method: "POST" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "转换失败");
      }
      const result = await response.json();
      const savedPercent = result.totalOriginalSize > 0
        ? ((result.savedSize / result.totalOriginalSize) * 100).toFixed(1)
        : 0;
      messageApi.success({
        content: `已转换 ${result.converted} 张图片，生成 WebP 共 ${formatBytes(result.totalWebpSize)}${result.savedSize > 0 ? `（节省 ${formatBytes(result.savedSize)}，${savedPercent}%）` : ""}${result.failed > 0 ? `，${result.failed} 个失败` : ""}`,
        key: "convert-webp",
      });
      setWebpPreview(null);
      fetchFiles();
    } catch (error) {
      messageApi.error({
        content: error instanceof Error ? error.message : "转换失败",
        key: "convert-webp",
      });
    } finally {
      setConvertingWebp(false);
    }
  };

  const openUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      messageApi.success("已复制 URL");
    } catch {
      messageApi.error("复制失败");
    }
  };

  const handleCloseRename = () => {
    setRenameModalOpen(false);
    setRenamingFile(null);
    renameForm.resetFields();
  };

  return (
    <div>
      {contextHolder}
      <AdminFilesToolbar
        syncing={syncing}
        webpPreviewLoading={webpPreviewLoading}
        webpCleanupPreviewLoading={webpCleanupPreviewLoading}
        clearing={clearing}
        onSync={handleSync}
        onPreviewWebpConvert={handlePreviewWebpConvert}
        onPreviewWebpCleanup={handlePreviewWebpCleanup}
        onClearIndex={handleClearIndex}
        onOpenUpload={handleOpenUpload}
      />

      <FileSearchBar
        searchInput={searchInput}
        searchQuery={searchQuery}
        onSearchInputChange={setSearchInput}
        onSearch={() => {
          const nextQuery = searchInput.trim();
          setPage(1);
          setSearchQuery(nextQuery);
          if (nextQuery === searchQuery && page === 1) {
            fetchFiles();
          }
        }}
        onReset={() => {
          setSearchInput("");
          setPage(1);
          setSearchQuery("");
        }}
      />

      <Spin spinning={loading}>
        <FileGrid files={files} onPreview={setPreviewFile} />
      </Spin>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={totalCount}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `共 ${total} 条`}
          onChange={(nextPage, nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(nextPageSize !== pageSize ? 1 : nextPage);
          }}
        />
      </div>

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onCopyUrl={handleCopyUrl}
        onOpenUrl={openUrl}
        onRename={handleOpenRename}
        onDelete={handleDelete}
      />

      <UploadFilesModal
        open={uploadModalOpen}
        uploading={uploading}
        selectedFiles={selectedFiles}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={handleUpload}
        onFilesChange={setSelectedFiles}
      />

      <RenameFileModal
        open={renameModalOpen}
        loading={renaming}
        file={renamingFile}
        form={renameForm}
        onClose={handleCloseRename}
        onSubmit={handleRename}
      />

      <CleanupWebpModal
        preview={webpCleanupPreview}
        loading={cleaningWebp}
        onClose={() => setWebpCleanupPreview(null)}
        onConfirm={handleCleanupWebp}
      />

      <ConvertWebpModal
        preview={webpPreview}
        loading={convertingWebp}
        onClose={() => setWebpPreview(null)}
        onConfirm={handleConvertWebp}
      />
    </div>
  );
}
