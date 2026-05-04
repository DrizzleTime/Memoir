"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Avatar,
  Form,
  Tag,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { LinkCheckSummaryBar } from "@/components/admin/links/LinkCheckSummaryBar";
import { LinkEditModal } from "@/components/admin/links/LinkEditModal";
import { LinksToolbar } from "@/components/admin/links/LinksToolbar";
import { LINK_CATEGORY_OPTIONS } from "@/components/admin/links/constants";
import type {
  LinkCheckResponse,
  LinkCheckSummary,
  LinkFormValues,
  LinkItem,
} from "@/components/admin/links/types";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import type { LinkCheckResult } from "@/lib/link-check";

export default function AdminLinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [form] = Form.useForm<LinkFormValues>();
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [checkSummary, setCheckSummary] = useState<LinkCheckSummary | null>(null);
  const [checkResults, setCheckResults] = useState<Record<number, LinkCheckResult>>({});
  const [checking, setChecking] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();

  const resetCheckResults = useCallback(() => {
    setCheckSummary(null);
    setCheckResults({});
  }, []);

  const fetchLinks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set("q", searchQuery);
      }
      if (statusFilter) {
        params.set("isActive", statusFilter);
      }
      if (categoryFilter) {
        params.set("category", categoryFilter);
      }
      const url = params.toString()
        ? `/api/admin/links?${params.toString()}`
        : "/api/admin/links";
      const response = await authFetch(url);
      if (!response.ok) {
        throw new Error("获取链接列表失败");
      }
      const data: LinkItem[] = await response.json();
      setLinks(data);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [authFetch, categoryFilter, messageApi, searchQuery, statusFilter, token]);

  useEffect(() => {
    if (token) {
      fetchLinks();
    }
  }, [token, fetchLinks]);

  const handleAdd = () => {
    setEditingLink(null);
    form.resetFields();
    form.setFieldsValue({
      category: "friend",
      sortOrder: 0,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (link: LinkItem) => {
    setEditingLink(link);
    form.setFieldsValue({
      name: link.name,
      url: link.url,
      avatarUrl: link.avatarUrl || undefined,
      category: link.category,
      sortOrder: link.sortOrder,
      isActive: link.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: LinkFormValues) => {
    if (!token) return;

    setSaving(true);
    try {
      const url = editingLink
        ? `/api/admin/links/${editingLink.id}`
        : "/api/admin/links";
      const method = editingLink ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "保存失败");
      }

      messageApi.success(editingLink ? "链接已更新" : "链接已创建");
      setModalOpen(false);
      resetCheckResults();
      fetchLinks();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/admin/links/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("删除失败");
      }
      messageApi.success("删除成功");
      resetCheckResults();
      fetchLinks();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const handleCheckAll = async () => {
    if (!token) return;

    setChecking(true);
    try {
      const response = await authFetch("/api/admin/links/check", {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "检测失败");
      }

      const data: LinkCheckResponse = await response.json();
      setCheckSummary({
        scannedAt: data.scannedAt,
        total: data.total,
        validCount: data.validCount,
        invalidCount: data.invalidCount,
        activeInvalidCount: data.activeInvalidCount,
      });
      setCheckResults(
        Object.fromEntries(
          data.items.map((item) => [item.id, item])
        )
      );

      messageApi.success(
        data.total > 0
          ? `检测完成，共 ${data.total} 条，失效 ${data.invalidCount} 条`
          : "暂无可检测链接"
      );
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "检测失败");
    } finally {
      setChecking(false);
    }
  };

  const activeInvalidIds = Object.values(checkResults)
    .filter((item) => item.status === "invalid" && item.isActive)
    .map((item) => item.id);

  const handleDeactivateInvalid = async () => {
    if (!token || activeInvalidIds.length === 0) return;

    setDeactivating(true);
    try {
      const response = await authFetch("/api/admin/links/deactivate-invalid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: activeInvalidIds }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "关闭失效链接失败");
      }

      const data: { updatedCount: number } = await response.json();
      setCheckResults((prev) => {
        const next = { ...prev };
        for (const id of activeInvalidIds) {
          const item = next[id];
          if (item) {
            next[id] = { ...item, isActive: false };
          }
        }
        return next;
      });
      setCheckSummary((prev) =>
        prev
          ? {
              ...prev,
              activeInvalidCount: 0,
            }
          : prev
      );

      messageApi.success(`已关闭 ${data.updatedCount} 个失效链接`);
      fetchLinks();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "关闭失效链接失败");
    } finally {
      setDeactivating(false);
    }
  };

  const columns = [
    {
      title: "链接",
      key: "link",
      width: 300,
      render: (_: unknown, record: LinkItem) => (
        <Space>
          <Avatar
            src={record.avatarUrl}
            icon={<LinkOutlined />}
            size="small"
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: "#999" }}>
              <a
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1677ff" }}
              >
                {record.url}
              </a>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 100,
      render: (category: string) => (
        <Tag color={category === "friend" ? "blue" : "green"}>
          {LINK_CATEGORY_OPTIONS.find((option) => option.value === category)?.label || category}
        </Tag>
      ),
    },
    {
      title: "排序",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 80,
      align: "center" as const,
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      width: 80,
      align: "center" as const,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "启用" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "检测结果",
      key: "checkStatus",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: LinkItem) => {
        const result = checkResults[record.id];

        if (!result) {
          return <Tag>未检测</Tag>;
        }

        const label = result.status === "valid" ? "正常" : "失效";
        const color = result.status === "valid" ? "success" : "error";
        const detail = `${result.reason} · ${new Date(result.checkedAt).toLocaleString("zh-CN")}`;

        return (
          <Tooltip title={detail}>
            <Tag color={color}>{label}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_: unknown, record: LinkItem) => (
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
            title="确定要删除这个链接吗？"
            onConfirm={() => handleDelete(record.id)}
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

  return (
    <div>
      {contextHolder}
      <LinksToolbar
        searchInput={searchInput}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        checking={checking}
        deactivating={deactivating}
        activeInvalidCount={activeInvalidIds.length}
        onAdd={handleAdd}
        onSearchInputChange={setSearchInput}
        onStatusFilterChange={setStatusFilter}
        onCategoryFilterChange={setCategoryFilter}
        onSearch={() => {
          const nextQuery = searchInput.trim();
          setSearchQuery(nextQuery);
          if (nextQuery === searchQuery) {
            fetchLinks();
          }
        }}
        onReset={() => {
          setSearchInput("");
          setSearchQuery("");
          setStatusFilter(undefined);
          setCategoryFilter(undefined);
        }}
        onCheckAll={handleCheckAll}
        onDeactivateInvalid={handleDeactivateInvalid}
      />

      <LinkCheckSummaryBar summary={checkSummary} />

      <Table
        dataSource={links}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 1020 }}
        size="middle"
      />

      <LinkEditModal
        open={modalOpen}
        editingLink={editingLink}
        form={form}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
