"use client";

import { Modal } from "antd";

interface UploadFilesModalProps {
  open: boolean;
  uploading: boolean;
  selectedFiles: File[];
  onClose: () => void;
  onSubmit: () => void;
  onFilesChange: (files: File[]) => void;
}

export function UploadFilesModal({
  open,
  uploading,
  selectedFiles,
  onClose,
  onSubmit,
  onFilesChange,
}: UploadFilesModalProps) {
  return (
    <Modal
      title="上传文件"
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      okText="上传"
      cancelText="取消"
      confirmLoading={uploading}
      destroyOnHidden
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="file"
          multiple
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            onFilesChange(files);
          }}
        />
        <div style={{ fontSize: 12, color: "#666" }}>
          已选择 {selectedFiles.length} 个文件
        </div>
        {selectedFiles.length > 0 && (
          <div
            style={{
              maxHeight: 160,
              overflow: "auto",
              border: "1px solid #f0f0f0",
              borderRadius: 6,
              padding: 8,
              background: "#fafafa",
              fontSize: 12,
            }}
          >
            {selectedFiles.map((file) => (
              <div key={`${file.name}-${file.size}-${file.lastModified}`}>{file.name}</div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12, color: "#999" }}>
          文件会保存到 <code>data/uploads/YYYY/MM</code>
        </div>
      </div>
    </Modal>
  );
}
