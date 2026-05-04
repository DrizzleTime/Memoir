"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Steps,
  Typography,
  message,
} from "antd";
import type { FormInstance } from "antd";
import {
  CheckCircleOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  LockOutlined,
  RocketOutlined,
  UserOutlined,
} from "@ant-design/icons";
import zhCN from "antd/locale/zh_CN";
import type { UserResponse } from "@/types";
import { setStoredAdminSession } from "@/lib/admin-session";

const { Title, Text } = Typography;

type InstallStepKey = "database" | "site" | "admin" | "confirm";

interface InstallFormValues {
  databaseHost: string;
  databasePort: number;
  databaseName: string;
  databaseUsername: string;
  databasePassword: string;
  databaseSslMode: "disable" | "require";
  siteUrl: string;
  siteName: string;
  siteTitle: string;
  siteTagline: string;
  siteDescription: string;
  siteContactEmail: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  adminNickname?: string;
}

interface InstallResponse {
  access_token: string;
  user: UserResponse;
}

export default function InstallPageClient() {
  const router = useRouter();
  const [form] = Form.useForm<InstallFormValues>();
  const [checking, setChecking] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  const installSteps: {
    key: InstallStepKey;
    title: string;
    description: string;
    fields: (keyof InstallFormValues)[];
  }[] = [
    {
      key: "database",
      title: "数据库",
      description: "连接 PostgreSQL",
      fields: [
        "databaseHost",
        "databasePort",
        "databaseName",
        "databaseSslMode",
        "databaseUsername",
        "databasePassword",
      ],
    },
    {
      key: "site",
      title: "站点",
      description: "基础展示信息",
      fields: [
        "siteUrl",
        "siteName",
        "siteTitle",
        "siteTagline",
        "siteDescription",
        "siteContactEmail",
      ],
    },
    {
      key: "admin",
      title: "管理员",
      description: "创建登录账号",
      fields: [
        "adminUsername",
        "adminNickname",
        "adminEmail",
        "adminPassword",
      ],
    },
    {
      key: "confirm",
      title: "确认",
      description: "开始初始化",
      fields: [],
    },
  ];

  const activeStep = installSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === installSteps.length - 1;

  useEffect(() => {
    let alive = true;

    fetch("/api/install")
      .then((response) => response.json())
      .then((data: { installed?: boolean }) => {
        if (!alive) return;
        if (data.installed) {
          router.replace("/");
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        if (alive) setChecking(false);
      });

    return () => {
      alive = false;
    };
  }, [router]);

  const handleNext = async () => {
    await form.validateFields(activeStep.fields);
    setCurrentStep((step) => Math.min(step + 1, installSteps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleInstall = async () => {
    const values = await form.validateFields();
    setInstalling(true);
    try {
      const response = await fetch("/api/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          database: {
            host: values.databaseHost,
            port: values.databasePort,
            name: values.databaseName,
            username: values.databaseUsername,
            password: values.databasePassword || "",
            sslMode: values.databaseSslMode,
          },
          site: {
            url: values.siteUrl,
            name: values.siteName,
            title: values.siteTitle,
            tagline: values.siteTagline,
            description: values.siteDescription,
            contactEmail: values.siteContactEmail,
          },
          admin: {
            username: values.adminUsername,
            email: values.adminEmail,
            password: values.adminPassword,
            nickname: values.adminNickname,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "安装失败");
      }

      const token = data as InstallResponse;
      setStoredAdminSession(token.access_token, token.user);
      messageApi.success("安装完成");
      router.replace("/admin");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "安装失败");
    } finally {
      setInstalling(false);
    }
  };

  const renderStepFields = () => {
    switch (activeStep.key) {
      case "database":
        return (
          <InstallSection
            icon={<DatabaseOutlined />}
            title="连接数据库"
            description="请使用一个空的 PostgreSQL 数据库，安装会自动创建表结构。"
          >
            <div className="memoir-install-grid">
              <Form.Item
                name="databaseHost"
                label="数据库地址"
                rules={[{ required: true, message: "请输入数据库地址" }]}
              >
                <Input placeholder="127.0.0.1" />
              </Form.Item>
              <Form.Item
                name="databasePort"
                label="端口"
                rules={[{ required: true, message: "请输入端口" }]}
              >
                <InputNumber min={1} max={65535} style={{ width: "100%" }} />
              </Form.Item>
            </div>
            <div className="memoir-install-grid">
              <Form.Item
                name="databaseName"
                label="数据库名"
                rules={[{ required: true, message: "请输入数据库名" }]}
              >
                <Input placeholder="memoir" />
              </Form.Item>
              <Form.Item
                name="databaseSslMode"
                label="SSL"
                rules={[{ required: true, message: "请选择 SSL 模式" }]}
              >
                <Select
                  options={[
                    { label: "关闭", value: "disable" },
                    { label: "启用", value: "require" },
                  ]}
                />
              </Form.Item>
            </div>
            <div className="memoir-install-grid">
              <Form.Item
                name="databaseUsername"
                label="用户名"
                rules={[{ required: true, message: "请输入数据库用户名" }]}
              >
                <Input placeholder="postgres" />
              </Form.Item>
              <Form.Item name="databasePassword" label="密码">
                <Input.Password placeholder="数据库密码" />
              </Form.Item>
            </div>
          </InstallSection>
        );
      case "site":
        return (
          <InstallSection
            icon={<GlobalOutlined />}
            title="站点信息"
            description="这些内容会用于页面标题、SEO、订阅源和站点展示。"
          >
            <Form.Item
              name="siteUrl"
              label="站点 URL"
              rules={[
                { required: true, message: "请输入站点 URL" },
                { type: "url", message: "请输入有效的 URL" },
              ]}
            >
              <Input placeholder="https://example.com" />
            </Form.Item>
            <div className="memoir-install-grid">
              <Form.Item
                name="siteName"
                label="站点名称"
                rules={[{ required: true, message: "请输入站点名称" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="siteTitle"
                label="站点标题"
                rules={[{ required: true, message: "请输入站点标题" }]}
              >
                <Input />
              </Form.Item>
            </div>
            <Form.Item
              name="siteTagline"
              label="站点标语"
              rules={[{ required: true, message: "请输入站点标语" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="siteDescription"
              label="站点描述"
              rules={[{ required: true, message: "请输入站点描述" }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item
              name="siteContactEmail"
              label="联系邮箱"
              rules={[
                { required: true, message: "请输入联系邮箱" },
                { type: "email", message: "请输入有效的邮箱地址" },
              ]}
            >
              <Input placeholder="admin@example.com" />
            </Form.Item>
          </InstallSection>
        );
      case "admin":
        return (
          <InstallSection
            icon={<UserOutlined />}
            title="管理员账号"
            description="安装完成后会自动登录这个账号，并进入后台。"
          >
            <div className="memoir-install-grid">
              <Form.Item
                name="adminUsername"
                label="用户名"
                rules={[{ required: true, message: "请输入用户名" }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
              <Form.Item name="adminNickname" label="昵称">
                <Input />
              </Form.Item>
            </div>
            <Form.Item
              name="adminEmail"
              label="邮箱"
              rules={[
                { required: true, message: "请输入邮箱" },
                { type: "email", message: "请输入有效的邮箱地址" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="adminPassword"
              label="密码"
              rules={[
                { required: true, message: "请输入密码" },
                { min: 6, message: "密码至少 6 位" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
          </InstallSection>
        );
      case "confirm":
        return <InstallConfirm form={form} />;
      default:
        return null;
    }
  };

  const page = checking ? (
    <div className="memoir-install-loading">
      <Spin size="large" />
    </div>
  ) : (
    <div className="memoir-install">
      {contextHolder}
      <div className="memoir-install-shell">
        <aside className="memoir-install-aside">
          <div>
            <div className="memoir-install-logo">
              <RocketOutlined />
            </div>
            <Space orientation="vertical" size={8} className="memoir-install-heading">
              <Text className="memoir-install-kicker">Memoir Setup</Text>
              <Title level={1}>安装 Memoir</Title>
              <Text>
                按顺序完成数据库、站点和管理员配置。安装完成后会进入后台。
              </Text>
            </Space>
          </div>

          <Steps
            direction="vertical"
            current={currentStep}
            items={installSteps.map((step) => ({
              title: step.title,
              description: step.description,
            }))}
          />
        </aside>

        <Card className="memoir-install-card">
          <Form
            form={form}
            layout="vertical"
            size="large"
            className="memoir-install-form"
            initialValues={{
              databaseHost: "postgres.example.com",
              databasePort: 5432,
              databaseName: "memoir",
              databaseSslMode: "disable",
              siteUrl: typeof window === "undefined" ? "" : window.location.origin,
              siteName: "Memoir",
              siteTitle: "Memoir",
              siteTagline: "个人博客系统",
              siteDescription: "一个基于 Next.js 的个人博客系统。",
            }}
          >
            <Alert
              type="info"
              showIcon
              className="memoir-install-alert"
              message="安装前请确认数据库为空"
              description="安装过程会连接数据库、推送表结构，并创建首个管理员账号。"
            />

            <div className="memoir-install-form-body">{renderStepFields()}</div>

            <Divider className="memoir-install-divider" />

            <div className="memoir-install-actions">
              <Button size="large" onClick={handlePrevious} disabled={isFirstStep || installing}>
                上一步
              </Button>
              {isLastStep ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  loading={installing}
                  onClick={handleInstall}
                >
                  开始安装
                </Button>
              ) : (
                <Button type="primary" size="large" onClick={handleNext}>
                  下一步
                </Button>
              )}
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );

  return (
    <AntdRegistry>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: "#111827",
            borderRadius: 8,
            fontFamily:
              "system-ui, -apple-system, \"Segoe UI\", \"Helvetica Neue\", Arial, \"Noto Sans\", \"PingFang SC\", \"Hiragino Sans GB\", \"Microsoft YaHei\", sans-serif",
          },
        }}
      >
        {page}
      </ConfigProvider>
    </AntdRegistry>
  );
}

function InstallSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="memoir-install-section">
      <div className="memoir-install-section-header">
        <div className="memoir-install-section-icon">{icon}</div>
        <Space orientation="vertical" size={2}>
          <Title level={3}>{title}</Title>
          {description ? <Text type="secondary">{description}</Text> : null}
        </Space>
      </div>
      {children}
    </section>
  );
}

function InstallConfirm({ form }: { form: FormInstance<InstallFormValues> }) {
  const values = Form.useWatch([], form) || {};

  return (
    <InstallSection
      icon={<CheckCircleOutlined />}
      title="确认安装"
      description="检查以下配置，确认无误后开始初始化 Memoir。"
    >
      <div className="memoir-install-summary">
        <SummaryBlock
          title="数据库"
          items={[
            ["地址", values.databaseHost],
            ["端口", values.databasePort],
            ["数据库名", values.databaseName],
            ["用户名", values.databaseUsername],
            ["SSL", values.databaseSslMode === "require" ? "启用" : "关闭"],
          ]}
        />
        <SummaryBlock
          title="站点"
          items={[
            ["URL", values.siteUrl],
            ["名称", values.siteName],
            ["标题", values.siteTitle],
            ["标语", values.siteTagline],
            ["联系邮箱", values.siteContactEmail],
          ]}
        />
        <SummaryBlock
          title="管理员"
          items={[
            ["用户名", values.adminUsername],
            ["昵称", values.adminNickname || "未设置"],
            ["邮箱", values.adminEmail],
            ["密码", values.adminPassword ? "已设置" : "未设置"],
          ]}
        />
      </div>
    </InstallSection>
  );
}

function SummaryBlock({
  title,
  items,
}: {
  title: string;
  items: [string, ReactNode][];
}) {
  return (
    <div className="memoir-install-summary-block">
      <Text strong>{title}</Text>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "-"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
