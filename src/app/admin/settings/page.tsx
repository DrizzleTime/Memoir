"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Typography,
  Form,
  Card,
  Empty,
  Divider,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { AIConfigCard } from "@/components/admin/settings/AIConfigCard";
import { ConfigEditModal } from "@/components/admin/settings/ConfigEditModal";
import { EmailConfigCard } from "@/components/admin/settings/EmailConfigCard";
import { FeishuConfigCard } from "@/components/admin/settings/FeishuConfigCard";
import { SiteConfigCard } from "@/components/admin/settings/SiteConfigCard";
import {
  buildAiConfigItems,
  buildEmailConfigItems,
  buildFeishuConfigItems,
  buildSiteConfigItems,
  filterCustomConfigs,
  getAiConfigValues,
  getEmailConfigValues,
  getFeishuConfigValues,
  getSiteConfigValues,
} from "@/components/admin/settings/config-helpers";
import type {
  AIConfigFormValues,
  ConfigFormValues,
  ConfigItem,
  EmailConfigFormValues,
  FeishuConfigFormValues,
  SiteConfigFormValues,
} from "@/components/admin/settings/types";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";

const { Title, Text } = Typography;

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigItem | null>(null);
  const [form] = Form.useForm<ConfigFormValues>();
  const [aiForm] = Form.useForm<AIConfigFormValues>();
  const [feishuForm] = Form.useForm<FeishuConfigFormValues>();
  const [emailForm] = Form.useForm<EmailConfigFormValues>();
  const [siteForm] = Form.useForm<SiteConfigFormValues>();
  const [saving, setSaving] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [feishuSaving, setFeishuSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [siteSaving, setSiteSaving] = useState(false);
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();

  const aiFormRef = useRef(aiForm);
  aiFormRef.current = aiForm;

  const feishuFormRef = useRef(feishuForm);
  feishuFormRef.current = feishuForm;

  const emailFormRef = useRef(emailForm);
  emailFormRef.current = emailForm;

  const siteFormRef = useRef(siteForm);
  siteFormRef.current = siteForm;

  const fetchConfigs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await authFetch("/api/admin/configs");
      if (!response.ok) {
        throw new Error("获取配置列表失败");
      }
      const data: ConfigItem[] = await response.json();
      setConfigs(data);
      aiFormRef.current.setFieldsValue(getAiConfigValues(data));
      feishuFormRef.current.setFieldsValue(getFeishuConfigValues(data));
      emailFormRef.current.setFieldsValue(getEmailConfigValues(data));
      siteFormRef.current.setFieldsValue(getSiteConfigValues(data));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [authFetch, messageApi, token]);

  useEffect(() => {
    if (token) {
      fetchConfigs();
    }
  }, [token, fetchConfigs]);

  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (config: ConfigItem) => {
    setEditingConfig(config);
    form.setFieldsValue({
      key: config.key,
      value: config.value,
      description: config.description || undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: ConfigFormValues) => {
    if (!token) return;
    setSaving(true);
    try {
      if (editingConfig) {
        const response = await authFetch("/api/admin/configs", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([values]),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "更新失败");
        }
        messageApi.success("配置已更新");
      } else {
        const response = await authFetch("/api/admin/configs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "创建失败");
        }
        messageApi.success("配置已创建");
      }
      setModalOpen(false);
      fetchConfigs();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!token) return;
    try {
      const response = await authFetch("/api/admin/configs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key }),
      });
      if (!response.ok) {
        throw new Error("删除失败");
      }
      messageApi.success("配置已删除");
      fetchConfigs();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const handleAiConfigSubmit = async (values: AIConfigFormValues) => {
    if (!token) return;
    setAiSaving(true);
    try {
      const response = await authFetch("/api/admin/configs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildAiConfigItems(values)),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "保存失败");
      }

      messageApi.success("AI 配置已保存");
      fetchConfigs();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setAiSaving(false);
    }
  };

  const handleEmailConfigSubmit = async (values: EmailConfigFormValues) => {
    if (!token) return;
    setEmailSaving(true);
    try {
      const response = await authFetch("/api/admin/configs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildEmailConfigItems(values)),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "保存失败");
      }

      messageApi.success("邮箱配置已保存");
      fetchConfigs();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setEmailSaving(false);
    }
  };

  const handleFeishuConfigSubmit = async (values: FeishuConfigFormValues) => {
    if (!token) return;
    setFeishuSaving(true);
    try {
      const response = await authFetch("/api/admin/configs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildFeishuConfigItems(values)),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "保存失败");
      }

      messageApi.success("飞书配置已保存");
      fetchConfigs();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setFeishuSaving(false);
    }
  };

  const handleSiteConfigSubmit = async (values: SiteConfigFormValues) => {
    if (!token) return;
    setSiteSaving(true);
    try {
      const response = await authFetch("/api/admin/configs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildSiteConfigItems(values)),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "保存失败");
      }

      messageApi.success("站点配置已保存");
      fetchConfigs();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSiteSaving(false);
    }
  };

  const columns = [
    {
      title: "键名",
      dataIndex: "key",
      key: "key",
      width: 200,
      render: (key: string) => <Text code>{key}</Text>,
    },
    {
      title: "值",
      dataIndex: "value",
      key: "value",
      ellipsis: true,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      width: 250,
      ellipsis: true,
      render: (desc: string | null) => desc || <Text type="secondary">-</Text>,
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_: unknown, record: ConfigItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个配置项吗？"
            onConfirm={() => handleDelete(record.key)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredConfigs = filterCustomConfigs(configs);

  return (
    <div>
      {contextHolder}
      <Title level={4} style={{ marginBottom: 16 }}>
        系统配置
      </Title>

      <SiteConfigCard form={siteForm} saving={siteSaving} onSubmit={handleSiteConfigSubmit} />

      <AIConfigCard form={aiForm} saving={aiSaving} onSubmit={handleAiConfigSubmit} />

      <FeishuConfigCard form={feishuForm} saving={feishuSaving} onSubmit={handleFeishuConfigSubmit} />

      <EmailConfigCard form={emailForm} saving={emailSaving} onSubmit={handleEmailConfigSubmit} />

      <Divider />

      <div
        className="memoir-admin-page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
      >
        <Title level={5} style={{ margin: 0 }}>
          其他配置
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加配置
        </Button>
      </div>

      <Card>
        {filteredConfigs.length === 0 && !loading ? (
          <Empty description="暂无配置项" />
        ) : (
          <Table
            dataSource={filteredConfigs}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 760 }}
          />
        )}
      </Card>

      <ConfigEditModal
        open={modalOpen}
        editingConfig={editingConfig}
        form={form}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
