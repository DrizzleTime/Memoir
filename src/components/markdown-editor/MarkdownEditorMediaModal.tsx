"use client";

import { Button, Modal, Space, Table } from "antd";
import { FileOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { RawImg } from "@/components/ui";
import {
  getBaseName,
  isImageFile,
  isVideoFile,
} from "@/lib/file-meta";
import type { UploadFileItem } from "@/types/files";

interface MarkdownEditorMediaModalProps {
  open: boolean;
  loading: boolean;
  uploading: boolean;
  files: UploadFileItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  uploadInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onRefresh: () => void;
  onPageChange: (page: number, pageSize: number) => void;
  onUploadFiles: (files: File[]) => void | Promise<void>;
  onInsert: (file: UploadFileItem) => void;
}

export function MarkdownEditorMediaModal({
  open,
  loading,
  uploading,
  files,
  page,
  pageSize,
  totalCount,
  uploadInputRef,
  onClose,
  onRefresh,
  onPageChange,
  onUploadFiles,
  onInsert,
}: MarkdownEditorMediaModalProps) {
  return (
    <Modal
      title="媒体库"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      styles={{ body: { maxHeight: "70vh", overflow: "auto" } }}
      destroyOnHidden
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <Space>
          <Button
            type="primary"
            onClick={() => uploadInputRef.current?.click()}
            loading={uploading}
            disabled={uploading}
          >
            上传文件
          </Button>
          <Button onClick={onRefresh} loading={loading}>
            刷新
          </Button>
        </Space>
        <div style={{ color: "#999", fontSize: 12, alignSelf: "center" }}>
          点击「插入」将文件插入到正文
        </div>
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = "";
          if (selectedFiles.length === 0) return;
          void onUploadFiles(selectedFiles);
        }}
      />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={files}
        pagination={{
          current: page,
          pageSize,
          total: totalCount,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: onPageChange,
        }}
        columns={[
          {
            title: "文件",
            dataIndex: "originalName",
            key: "file",
            render: (name: string, record: UploadFileItem) => {
              const url = `/uploads/${record.relativePath}`;
              const displayName = name || getBaseName(record.relativePath);
              const image = isImageFile(record);
              const video = !image && isVideoFile(record);

              return (
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "#fafafa",
                      border: "1px solid #f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 44px",
                    }}
                  >
                    {image ? (
                      <RawImg
                        src={url}
                        alt={displayName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : video ? (
                      <VideoCameraOutlined style={{ fontSize: 18, color: "#fa8c16" }} />
                    ) : (
                      <FileOutlined style={{ fontSize: 18, color: "#8c8c8c" }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={displayName}
                    >
                      {displayName}
                    </div>
                    <div style={{ fontSize: 12, color: "#999" }}>{record.relativePath}</div>
                  </div>
                </div>
              );
            },
          },
          {
            title: "时间",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 180,
            render: (date: string) => new Date(date).toLocaleString("zh-CN"),
          },
          {
            title: "操作",
            key: "actions",
            width: 110,
            render: (_: unknown, record: UploadFileItem) => (
              <Button type="link" onClick={() => onInsert(record)}>
                插入
              </Button>
            ),
          },
        ]}
      />
    </Modal>
  );
}
