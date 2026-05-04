"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Button, Tag, Space, Popconfirm, message, Input, Select, Typography } from "antd";
import type { TablePaginationConfig } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import {
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUS_OPTIONS,
  ARTICLE_STATUS_TAG_COLORS,
} from "@/lib/article-status";
import type { ArticleListItem, PageData } from "@/types";
import type { ArticleStatus } from "@/lib/article-status";

const { Title } = Typography;

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchTitle, setSearchTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<ArticleStatus | undefined>(undefined);
  const router = useRouter();
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchArticles = useCallback(async (page = 1, pageSize = 10, status?: ArticleStatus, query?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (status !== undefined) {
        params.append("status", status);
      }
      if (query) {
        params.append("q", query);
      }

      const response = await authFetch(`/api/articles?${params.toString()}`);
      if (!response.ok) {
        throw new Error("获取文章列表失败");
      }
      const data: PageData<ArticleListItem> = await response.json();
      setArticles(data.items);
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total,
      });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [authFetch, messageApi, token]);

  useEffect(() => {
    if (token) {
      fetchArticles(1, 10, filterStatus, searchQuery);
    }
  }, [token, filterStatus, searchQuery, fetchArticles]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/articles/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("删除失败");
      }
      messageApi.success("删除成功");
      fetchArticles(pagination.current, pagination.pageSize, filterStatus, searchQuery);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const handleTogglePublish = async (article: ArticleListItem) => {
    if (!token) return;
    try {
      const nextStatus: ArticleStatus =
        article.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      const response = await authFetch(`/api/articles/${article.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });
      if (!response.ok) {
        throw new Error("操作失败");
      }
      messageApi.success(
        nextStatus === "PUBLISHED" ? "文章已发布" : "已撤回为草稿"
      );
      fetchArticles(pagination.current, pagination.pageSize, filterStatus, searchQuery);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    fetchArticles(
      paginationConfig.current || 1,
      paginationConfig.pageSize || 10,
      filterStatus,
      searchQuery
    );
  };

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      width: 250,
      ellipsis: true,
      fixed: "left" as const,
      render: (title: string, record: ArticleListItem) =>
        record.status === "PUBLISHED" ? (
          <a
            href={`/article/${record.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1677ff" }}
          >
            {title}
          </a>
        ) : (
          <span>{title}</span>
        ),
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 100,
      render: (category: string | null) => category || "-",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: ArticleStatus) => (
        <Tag color={ARTICLE_STATUS_TAG_COLORS[status]}>
          {ARTICLE_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: "作者",
      dataIndex: "author",
      key: "author",
      width: 80,
      render: (author: ArticleListItem["author"]) => author.nickname || author.username,
    },
    {
      title: "发布时间",
      dataIndex: "published_at",
      key: "published_at",
      width: 170,
      render: (date: string | null) => date ? new Date(date).toLocaleString("zh-CN") : "-",
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      fixed: "right" as const,
      render: (_: unknown, record: ArticleListItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/articles/${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={record.status === "PUBLISHED" ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleTogglePublish(record)}
          >
            {record.status === "PUBLISHED" ? "撤回" : "发布"}
          </Button>
          <Popconfirm
            title="确定要删除这篇文章吗？"
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
      <div
        className="memoir-admin-page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
      >
        <Title level={4} style={{ margin: 0 }}>
          文章管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push("/admin/articles/create")}
        >
          新建文章
        </Button>
      </div>

      <Space className="memoir-admin-toolbar" style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索标题"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          allowClear
          enterButton
          style={{ width: 260 }}
          onSearch={(value) => {
            const nextQuery = value.trim();
            setPagination((prev) => ({ ...prev, current: 1 }));
            setSearchQuery(nextQuery);
          }}
        />
        <Select
          placeholder="筛选状态"
          value={filterStatus}
          onChange={(value) => {
            setPagination((prev) => ({ ...prev, current: 1 }));
            setFilterStatus(value);
          }}
          style={{ width: 120 }}
          allowClear
          options={ARTICLE_STATUS_OPTIONS}
        />
      </Space>

      <Table
        dataSource={articles}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1010 }}
        size="middle"
      />
    </div>
  );
}
