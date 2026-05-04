"use client";

import { useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { Button, Form, Modal, Space, Switch } from "antd";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import type { MemoFormValues, MemoItem } from "@/components/admin/memos/types";

interface MemoEditorModalProps {
  open: boolean;
  editingMemo: MemoItem | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: MemoFormValues) => void | Promise<void>;
}

export function MemoEditorModal({
  open,
  editingMemo,
  saving,
  onClose,
  onSubmit,
}: MemoEditorModalProps) {
  const [form] = Form.useForm<MemoFormValues>();
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue(
      editingMemo
        ? {
          content: editingMemo.content,
          isPublished: editingMemo.isPublished,
        }
        : {
          content: "",
          isPublished: false,
        }
    );
  }, [editingMemo, form, open]);

  const uploadImage = useCallback(async (file: File) => {
    if (!token) {
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await authFetch("/api/admin/files/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "上传失败");
    }

    const data = await response.json();
    return data.url as string;
  }, [authFetch, token]);

  const setContent: Dispatch<SetStateAction<string>> = useCallback((next) => {
    const current = (form.getFieldValue("content") as string | undefined) ?? "";
    const resolved = typeof next === "function"
      ? next(current)
      : next;

    form.setFieldValue("content", resolved);
  }, [form]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={editingMemo ? "编辑动态" : "发布动态"}
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      forceRender
      width={900}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="content"
          rules={[{ required: true, message: "请输入内容" }]}
          hidden
        >
          <input />
        </Form.Item>

        <Form.Item
          label="内容"
          required
          shouldUpdate={(prev, current) => prev.content !== current.content}
        >
          {() => (
            <MarkdownEditor
              value={(form.getFieldValue("content") as string | undefined) ?? ""}
              onChange={setContent}
              height={360}
              onUploadImage={uploadImage}
              placeholder="写点什么... 支持 Markdown 格式"
            />
          )}
        </Form.Item>
        <Form.Item name="isPublished" label="发布状态" valuePropName="checked">
          <Switch checkedChildren="发布" unCheckedChildren="草稿" />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
