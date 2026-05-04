"use client";

import { Button, Modal, Popconfirm, Space } from "antd";
import { formatBytes } from "@/lib/format-bytes";
import type { WebpCleanupPreview } from "@/types/files";

interface CleanupWebpModalProps {
  preview: WebpCleanupPreview | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function CleanupWebpModal({
  preview,
  loading,
  onClose,
  onConfirm,
}: CleanupWebpModalProps) {
  return (
    <Modal
      title="清理 WebP 转化图"
      open={preview !== null}
      onCancel={onClose}
      width={700}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Popconfirm
            title={`确定要删除这 ${preview?.count ?? 0} 个 WebP 转化图文件吗？此操作不可恢复。`}
            onConfirm={onConfirm}
            okText="确定删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger loading={loading}>
              删除全部
            </Button>
          </Popconfirm>
        </Space>
      }
      destroyOnHidden
    >
      {preview && (
        <div>
          <p style={{ marginBottom: 16 }}>
            找到 <strong>{preview.count}</strong> 个 WebP
            转化图文件（后缀为 <code>{preview.suffix || "-memoir.webp"}</code>），共占用{" "}
            <strong>{formatBytes(preview.totalSize)}</strong> 空间。
          </p>
          <p style={{ marginBottom: 16, color: "#666", fontSize: 13 }}>
            清理会删除磁盘文件与数据库记录，不会删除原图（如 .jpg/.png）。
          </p>
          <div
            style={{
              maxHeight: 300,
              overflow: "auto",
              background: "#f5f5f5",
              padding: 12,
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            {preview.files.map((file) => (
              <div key={file.relativePath} style={{ marginBottom: 4 }}>
                <span style={{ color: "#666" }}>{file.relativePath}</span>
                <span style={{ marginLeft: 8, color: "#999" }}>
                  ({formatBytes(file.size)})
                </span>
              </div>
            ))}
            {preview.hasMore && (
              <div style={{ marginTop: 8, color: "#999" }}>
                ... 还有 {preview.count - preview.files.length} 个文件
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
