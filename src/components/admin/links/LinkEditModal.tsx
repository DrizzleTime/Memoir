"use client";

import type { FormInstance } from "antd";
import { Button, Form, Input, InputNumber, Modal, Select, Space, Switch } from "antd";
import { LINK_CATEGORY_OPTIONS } from "@/components/admin/links/constants";
import type { LinkFormValues, LinkItem } from "@/components/admin/links/types";

interface LinkEditModalProps {
  open: boolean;
  editingLink: LinkItem | null;
  form: FormInstance<LinkFormValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: LinkFormValues) => void | Promise<void>;
}

export function LinkEditModal({
  open,
  editingLink,
  form,
  saving,
  onClose,
  onSubmit,
}: LinkEditModalProps) {
  return (
    <Modal
      title={editingLink ? "编辑链接" : "添加链接"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: "请输入名称" }]}
        >
          <Input placeholder="请输入链接名称" maxLength={100} />
        </Form.Item>
        <Form.Item
          name="url"
          label="URL"
          rules={[
            { required: true, message: "请输入URL" },
            { type: "url", message: "请输入有效的URL" },
          ]}
        >
          <Input placeholder="请输入链接URL" />
        </Form.Item>
        <Form.Item name="avatarUrl" label="头像 URL">
          <Input placeholder="请输入头像图片URL（可选）" />
        </Form.Item>
        <Form.Item
          name="category"
          label="分类"
          rules={[{ required: true, message: "请选择分类" }]}
        >
          <Select options={LINK_CATEGORY_OPTIONS} />
        </Form.Item>
        <Form.Item name="sortOrder" label="排序（数字越小越靠前）">
          <InputNumber min={0} max={9999} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="isActive" label="启用" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
