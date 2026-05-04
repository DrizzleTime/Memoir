"use client";

import type { FormInstance } from "antd";
import { Button, Card, Col, Form, Input, Row, Space } from "antd";
import { GlobalOutlined, SaveOutlined } from "@ant-design/icons";
import type { SiteConfigFormValues } from "@/components/admin/settings/types";

interface SiteConfigCardProps {
  form: FormInstance<SiteConfigFormValues>;
  saving: boolean;
  onSubmit: (values: SiteConfigFormValues) => void | Promise<void>;
}

export function SiteConfigCard({ form, saving, onSubmit }: SiteConfigCardProps) {
  return (
    <Card
      title={(
        <Space>
          <GlobalOutlined />
          <span>站点配置</span>
        </Space>
      )}
      style={{ marginBottom: 24 }}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="site_url"
          label="站点 URL"
          rules={[
            { required: true, message: "请输入站点 URL" },
            { type: "url", message: "请输入有效的 URL" },
          ]}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="site_name"
              label="站点名称"
              rules={[{ required: true, message: "请输入站点名称" }]}
            >
              <Input placeholder="Memoir" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="site_title"
              label="站点标题"
              rules={[{ required: true, message: "请输入站点标题" }]}
            >
              <Input placeholder="Memoir" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="site_tagline"
          label="站点标语"
          rules={[{ required: true, message: "请输入站点标语" }]}
        >
          <Input placeholder="个人博客系统" />
        </Form.Item>

        <Form.Item
          name="site_description"
          label="站点描述"
          rules={[{ required: true, message: "请输入站点描述" }]}
        >
          <Input.TextArea rows={3} placeholder="一个基于 Next.js 的个人博客系统。" />
        </Form.Item>

        <Form.Item
          name="site_contact_email"
          label="联系邮箱"
          rules={[
            { required: true, message: "请输入联系邮箱" },
            { type: "email", message: "请输入有效的邮箱地址" },
          ]}
        >
          <Input placeholder="admin@example.com" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            icon={<SaveOutlined />}
          >
            保存站点配置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
