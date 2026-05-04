"use client";

import type { FormInstance } from "antd";
import { Button, Card, Form, Input, Space } from "antd";
import { RobotOutlined, SaveOutlined } from "@ant-design/icons";
import type { FeishuConfigFormValues } from "@/components/admin/settings/types";

interface FeishuConfigCardProps {
  form: FormInstance<FeishuConfigFormValues>;
  saving: boolean;
  onSubmit: (values: FeishuConfigFormValues) => void | Promise<void>;
}

export function FeishuConfigCard({ form, saving, onSubmit }: FeishuConfigCardProps) {
  return (
    <Card
      title={(
        <Space>
          <RobotOutlined />
          <span>飞书机器人配置</span>
        </Space>
      )}
      style={{ marginBottom: 24 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          name="feishu_app_id"
          label="App ID"
          tooltip="飞书应用凭证中的 App ID"
          rules={[{ required: true, message: "请输入 App ID" }]}
        >
          <Input placeholder="cli_xxxxxxxxxxxxx" />
        </Form.Item>

        <Form.Item
          name="feishu_app_secret"
          label="App Secret"
          tooltip="飞书应用凭证中的 App Secret"
          rules={[{ required: true, message: "请输入 App Secret" }]}
        >
          <Input.Password placeholder="请输入 App Secret" />
        </Form.Item>

        <Form.Item
          name="feishu_verification_token"
          label="Verification Token"
          tooltip="飞书事件订阅中的 Verification Token"
          rules={[{ required: true, message: "请输入 Verification Token" }]}
        >
          <Input.Password placeholder="请输入 Verification Token" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            icon={<SaveOutlined />}
          >
            保存飞书配置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
