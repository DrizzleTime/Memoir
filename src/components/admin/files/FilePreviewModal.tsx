"use client";

import { Button, Descriptions, Modal, Popconfirm, Space, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { RawImg } from "@/components/ui";
import { getFileTypeIcon } from "@/components/admin/files/file-display";
import { formatBytes } from "@/lib/format-bytes";
import { getBaseName, getFileExtension, isImageFile } from "@/lib/file-meta";
import type { UploadFileItem } from "@/types/files";

const previewBoxWidth = 560;
const previewBoxHeight = 420;

interface FilePreviewModalProps {
  file: UploadFileItem | null;
  onClose: () => void;
  onCopyUrl: (url: string) => void | Promise<void>;
  onOpenUrl: (url: string) => void;
  onRename: (file: UploadFileItem) => void;
  onDelete: (fileId: number) => void;
}

export function FilePreviewModal({
  file,
  onClose,
  onCopyUrl,
  onOpenUrl,
  onRename,
  onDelete,
}: FilePreviewModalProps) {
  const fileUrl = file ? `/uploads/${file.relativePath}` : "";

  return (
    <Modal
      title={file ? (file.originalName || getBaseName(file.relativePath)) : "预览"}
      open={file !== null}
      onCancel={onClose}
      footer={null}
      width={980}
      destroyOnHidden
    >
      {file && (
        <div
          className="memoir-admin-file-preview"
          style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
        >
          <div
            className="memoir-admin-file-preview-media"
            style={{
              width: previewBoxWidth,
              height: previewBoxHeight,
              flex: `0 0 ${previewBoxWidth}px`,
              background: "#fafafa",
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isImageFile(file) && !file.isMissing ? (
              <RawImg
                src={fileUrl}
                alt={getBaseName(file.relativePath)}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {getFileTypeIcon(file)}
                <div style={{ fontSize: 12, color: "#999", textTransform: "uppercase" }}>
                  {getFileExtension(file.relativePath) || "-"}
                </div>
                {file.isMissing && <Tag color="error">文件缺失</Tag>}
              </div>
            )}
          </div>

          <div className="memoir-admin-file-preview-info" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <Space size="small" wrap>
                <Button onClick={() => onCopyUrl(fileUrl)}>
                  复制 URL
                </Button>
                <Button onClick={() => onOpenUrl(fileUrl)} disabled={file.isMissing}>
                  打开
                </Button>
              </Space>
              <Space size="small" wrap>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    onClose();
                    onRename(file);
                  }}
                >
                  重命名
                </Button>
                <Popconfirm
                  title="确定要删除这个文件吗？"
                  onConfirm={() => {
                    onClose();
                    onDelete(file.id);
                  }}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </div>

            <div style={{ marginTop: 12, maxHeight: previewBoxHeight, overflow: "auto" }}>
              <Descriptions
                size="small"
                column={1}
                items={[
                  {
                    key: "status",
                    label: "状态",
                    children: (
                      <Tag color={file.isMissing ? "error" : "success"}>
                        {file.isMissing ? "缺失" : "正常"}
                      </Tag>
                    ),
                  },
                  { key: "size", label: "大小", children: formatBytes(file.size) },
                  { key: "mime", label: "MIME", children: file.mimeType || "-" },
                  {
                    key: "created",
                    label: "创建时间",
                    children: new Date(file.createdAt).toLocaleString("zh-CN"),
                  },
                  { key: "original", label: "原始名", children: file.originalName || "-" },
                  {
                    key: "path",
                    label: "路径",
                    children: <Typography.Text code>{file.relativePath}</Typography.Text>,
                  },
                  {
                    key: "url",
                    label: "URL",
                    children: <Typography.Text code>{fileUrl}</Typography.Text>,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
