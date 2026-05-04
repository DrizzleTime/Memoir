"use client";

import type { FormInstance } from "antd";
import { Button, Card, Col, Divider, Form, Input, Row, Space, Switch } from "antd";
import { MailOutlined, SaveOutlined } from "@ant-design/icons";
import type { EmailConfigFormValues } from "@/components/admin/settings/types";

interface EmailConfigCardProps {
  form: FormInstance<EmailConfigFormValues>;
  saving: boolean;
  onSubmit: (values: EmailConfigFormValues) => void | Promise<void>;
}

export function EmailConfigCard({ form, saving, onSubmit }: EmailConfigCardProps) {
  return (
    <Card
      title={(
        <Space>
          <MailOutlined />
          <span>邮箱通知配置</span>
        </Space>
      )}
      style={{ marginBottom: 24 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{ smtp_port: "465", email_notify_enabled: false }}
      >
        <Form.Item
          name="email_notify_enabled"
          label="启用邮件通知"
          valuePropName="checked"
          tooltip="开启后，新评论和回复将发送邮件通知"
        >
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>

        <Divider titlePlacement="left" plain>SMTP 服务器设置</Divider>

        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item
              name="smtp_host"
              label="SMTP 服务器"
              tooltip="SMTP 服务器地址，如 smtp.qq.com、smtp.gmail.com"
              rules={[{ required: true, message: "请输入 SMTP 服务器地址" }]}
            >
              <Input placeholder="例如：smtp.qq.com" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="smtp_port"
              label="端口"
              tooltip="SMTP 端口，常用端口：465(SSL)、587(TLS)、25(不加密)"
              rules={[{ required: true, message: "请输入端口" }]}
            >
              <Input placeholder="465" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="smtp_user"
              label="SMTP 用户名"
              tooltip="通常是您的邮箱地址"
              rules={[{ required: true, message: "请输入 SMTP 用户名" }]}
            >
              <Input placeholder="your-email@example.com" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="smtp_pass"
              label="SMTP 密码/授权码"
              tooltip="邮箱密码或授权码（如 QQ 邮箱需要使用授权码）"
              rules={[{ required: true, message: "请输入 SMTP 密码" }]}
            >
              <Input.Password placeholder="请输入密码或授权码" />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left" plain>发件人设置</Divider>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="smtp_from"
              label="发件人邮箱"
              tooltip="发送邮件时显示的发件人地址"
              rules={[
                { required: true, message: "请输入发件人邮箱" },
                { type: "email", message: "请输入有效的邮箱地址" },
              ]}
            >
              <Input placeholder="noreply@example.com" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="smtp_from_name"
              label="发件人名称"
              tooltip="发送邮件时显示的发件人名称（可选）"
            >
              <Input placeholder="例如：博客通知" />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left" plain>通知设置</Divider>

        <Form.Item
          name="admin_email"
          label="管理员邮箱"
          tooltip="接收新评论通知的邮箱地址"
          rules={[
            { required: true, message: "请输入管理员邮箱" },
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
            保存邮箱配置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
