"use client";

import type { FormInstance } from "antd";
import { Button, Form, Input, Modal, Space } from "antd";
import type { UploadFileItem } from "@/types/files";

interface RenameFileModalProps {
  open: boolean;
  loading: boolean;
  file: UploadFileItem | null;
  form: FormInstance<{ newName: string }>;
  onClose: () => void;
  onSubmit: (values: { newName: string }) => void | Promise<void>;
}

export function RenameFileModal({
  open,
  loading,
  file,
  form,
  onClose,
  onSubmit,
}: RenameFileModalProps) {
  return (
    <Modal
      title="重命名"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="newName"
          label="新文件名（不包含路径）"
          rules={[{ required: true, message: "请输入新文件名" }]}
          extra={file ? `当前文件：${file.relativePath}` : undefined}
        >
          <Input placeholder="例如: photo.jpg" maxLength={200} />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onClose}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
