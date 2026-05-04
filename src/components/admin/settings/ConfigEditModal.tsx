"use client";

import type { FormInstance } from "antd";
import { Button, Form, Input, Modal, Space } from "antd";
import type { ConfigFormValues, ConfigItem } from "@/components/admin/settings/types";

interface ConfigEditModalProps {
  open: boolean;
  editingConfig: ConfigItem | null;
  form: FormInstance<ConfigFormValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ConfigFormValues) => void | Promise<void>;
}

export function ConfigEditModal({
  open,
  editingConfig,
  form,
  saving,
  onClose,
  onSubmit,
}: ConfigEditModalProps) {
  return (
    <Modal
      title={editingConfig ? "编辑配置" : "添加配置"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="key"
          label="键名"
          rules={[
            { required: true, message: "请输入键名" },
            { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: "键名只能包含字母、数字和下划线" },
          ]}
        >
          <Input
            placeholder="例如：site_name"
            maxLength={100}
            disabled={!!editingConfig}
          />
        </Form.Item>
        <Form.Item
          name="value"
          label="值"
          rules={[{ required: true, message: "请输入值" }]}
        >
          <Input.TextArea placeholder="请输入配置值" rows={3} />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input placeholder="配置项的描述说明（可选）" maxLength={200} />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" htmlType="submit" loading={saving} icon={null}>
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
