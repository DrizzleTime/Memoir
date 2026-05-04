"use client";

import type { FormInstance } from "antd";
import { Button, Card, Form, Input, Space } from "antd";
import { RobotOutlined, SaveOutlined } from "@ant-design/icons";
import type { AIConfigFormValues } from "@/components/admin/settings/types";

interface AIConfigCardProps {
  form: FormInstance<AIConfigFormValues>;
  saving: boolean;
  onSubmit: (values: AIConfigFormValues) => void | Promise<void>;
}

export function AIConfigCard({ form, saving, onSubmit }: AIConfigCardProps) {
  return (
    <Card
      title={(
        <Space>
          <RobotOutlined />
          <span>AI 配置</span>
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
          name="ai_endpoint"
          label="API 端点"
          tooltip="OpenAI 兼容的 API 端点地址，如 https://api.openai.com/v1"
          rules={[{ required: true, message: "请输入 API 端点" }]}
        >
          <Input placeholder="例如：https://api.openai.com/v1" />
        </Form.Item>

        <Form.Item
          name="ai_model"
          label="模型"
          tooltip="要使用的 AI 模型名称"
          rules={[{ required: true, message: "请输入模型名称" }]}
        >
          <Input placeholder="例如：gpt-4o-mini" />
        </Form.Item>

        <Form.Item
          name="ai_api_key"
          label="API 密钥"
          tooltip="AI 服务的 API 密钥（敏感信息）"
          rules={[{ required: true, message: "请输入 API 密钥" }]}
        >
          <Input.Password placeholder="请输入 API 密钥" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            icon={<SaveOutlined />}
          >
            保存 AI 配置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
