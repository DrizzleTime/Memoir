"use client";

import { Button, Modal, Space } from "antd";
import { formatBytes } from "@/lib/format-bytes";
import type { WebpConvertPreview } from "@/types/files";

interface ConvertWebpModalProps {
  preview: WebpConvertPreview | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConvertWebpModal({
  preview,
  loading,
  onClose,
  onConfirm,
}: ConvertWebpModalProps) {
  return (
    <Modal
      title="转换图片为 WebP"
      open={preview !== null}
      onCancel={onClose}
      width={700}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            onClick={onConfirm}
            loading={loading}
            disabled={preview?.pendingCount === 0}
          >
            开始转换
          </Button>
        </Space>
      }
      destroyOnHidden
    >
      {preview && (
        <div>
          <p style={{ marginBottom: 16 }}>
            共有 <strong>{preview.totalImages}</strong> 张图片，
            其中 <strong>{preview.existingCount}</strong> 张已有 WebP 版本，
            <strong>{preview.pendingCount}</strong> 张待转换
            （原始大小 <strong>{formatBytes(preview.totalOriginalSize)}</strong>）。
          </p>
          <p style={{ marginBottom: 16, color: "#666", fontSize: 13 }}>
            转换后会生成 <code>-memoir.webp</code> 后缀的 WebP 压缩文件（quality=80）。
            访问原图片时会自动返回 WebP 版本（如果浏览器支持）。
          </p>
          {preview.pendingCount > 0 && (
            <div
              style={{
                maxHeight: 250,
                overflow: "auto",
                background: "#f5f5f5",
                padding: 12,
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              {preview.files.map((file) => (
                <div key={file.id} style={{ marginBottom: 4 }}>
                  <span style={{ color: "#666" }}>{file.relativePath}</span>
                  <span style={{ marginLeft: 8, color: "#999" }}>
                    ({formatBytes(file.size)})
                  </span>
                </div>
              ))}
              {preview.hasMore && (
                <div style={{ marginTop: 8, color: "#999" }}>
                  ... 还有 {preview.pendingCount - preview.files.length} 张待转换
                </div>
              )}
            </div>
          )}
          {preview.pendingCount === 0 && (
            <div style={{ color: "#52c41a", textAlign: "center", padding: 20 }}>
              所有图片都已转换为 WebP 格式 ✓
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
