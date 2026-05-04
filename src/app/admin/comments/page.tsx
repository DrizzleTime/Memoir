"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Button, Tag, Space, Popconfirm, message, Select, Typography, Tooltip, Input } from "antd";
import type { TablePaginationConfig } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import type { CommentTargetType, UserResponse } from "@/types";

const { Title } = Typography;

interface CommentItem {
  id: number;
  content: string;
  article_id: number | null;
  memo_id: number | null;
  target_type: CommentTargetType;
  article: {
    id: number;
    title: string;
  } | null;
  memo: {
    id: number;
    content: string;
  } | null;
  author: UserResponse | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_website: string | null;
  parent_id: number | null;
  is_approved: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PageData {
  items: CommentItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchComments = useCallback(async (page = 1, pageSize = 10, status?: string, query?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (status !== undefined) {
        params.append("is_approved", status);
      }
      if (query) {
        params.append("q", query);
      }

      const response = await authFetch(`/api/admin/comments?${params.toString()}`);
      if (!response.ok) {
        throw new Error("获取评论列表失败");
      }
      const data: PageData = await response.json();
      setComments(data.items);
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
      fetchComments();
    }
  }, [token, fetchComments]);

  const handleApprove = async (id: number, approve: boolean) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/admin/comments/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_approved: approve }),
      });
      if (!response.ok) {
        throw new Error("操作失败");
      }
      messageApi.success(approve ? "评论已通过" : "评论已拒绝");
      fetchComments(pagination.current, pagination.pageSize, filterStatus, searchQuery);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const response = await authFetch("/api/comments/batch", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!response.ok) {
        throw new Error("删除失败");
      }
      messageApi.success("删除成功");
      fetchComments(pagination.current, pagination.pageSize, filterStatus, searchQuery);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const handleBatchDelete = async () => {
    if (!token || selectedRowKeys.length === 0) return;
    setBatchDeleting(true);
    try {
      const response = await authFetch("/api/comments/batch", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedRowKeys }),
      });
      if (!response.ok) {
        throw new Error("批量删除失败");
      }
      const data = await response.json();
      messageApi.success(data.message || "批量删除成功");
      setSelectedRowKeys([]);
      fetchComments(pagination.current, pagination.pageSize, filterStatus, searchQuery);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "批量删除失败");
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    fetchComments(paginationConfig.current || 1, paginationConfig.pageSize || 10, filterStatus, searchQuery);
  };

  const getCommentEmail = (record: CommentItem) => record.author?.email || record.guest_email || "-";

  const columns = [
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      width: 200,
      ellipsis: true,
      render: (content: string) => (
        <Tooltip title={content}>
          {content.length > 50 ? `${content.slice(0, 50)}...` : content}
        </Tooltip>
      ),
    },
    {
      title: "目标",
      key: "target",
      width: 150,
      ellipsis: true,
      render: (_: unknown, record: CommentItem) => (
        record.article ? (
          <Link href={`/admin/articles/${record.article.id}`}>{record.article.title}</Link>
        ) : (
          <Tooltip title={record.memo?.content}>
            <Link href="/admin/memos">{`动态 #${record.memo?.id}`}</Link>
          </Tooltip>
        )
      ),
    },
    {
      title: "评论者",
      key: "commenter",
      width: 120,
      render: (_: unknown, record: CommentItem) => {
        if (record.author) {
          return (
            <Tooltip title={record.author.email}>
              {record.author.nickname || record.author.username}
            </Tooltip>
          );
        }
        return (
          <Tooltip title={record.guest_email}>
            {record.guest_name} <Tag>游客</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "邮箱",
      key: "email",
      width: 220,
      ellipsis: true,
      render: (_: unknown, record: CommentItem) => {
        const email = getCommentEmail(record);
        return (
          <Tooltip title={email}>
            {email}
          </Tooltip>
        );
      },
    },
    {
      title: "IP",
      dataIndex: "ip_address",
      key: "ip_address",
      width: 130,
      render: (ip: string | null) => ip || "-",
    },
    {
      title: "状态",
      dataIndex: "is_approved",
      key: "is_approved",
      width: 100,
      render: (approved: boolean) =>
        approved ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            已通过
          </Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            待审核
          </Tag>
        ),
    },
    {
      title: "时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_: unknown, record: CommentItem) => (
        <Space size="small">
          {!record.is_approved ? (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record.id, true)}
            >
              通过
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleApprove(record.id, false)}
            >
              拒绝
            </Button>
          )}
          <Popconfirm
            title="确定要删除这条评论吗？"
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
          评论管理
        </Title>
      </div>

      <Space className="memoir-admin-toolbar" style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="筛选状态"
          value={filterStatus}
          onChange={(value) => {
            setPagination((prev) => ({ ...prev, current: 1 }));
            setSelectedRowKeys([]);
            setFilterStatus(value);
            fetchComments(1, pagination.pageSize, value, searchQuery);
          }}
          style={{ width: 120 }}
          allowClear
          options={[
            { value: "true", label: "已通过" },
            { value: "false", label: "待审核" },
          ]}
        />
        <Input
          placeholder="搜索内容/文章/邮箱/IP"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          allowClear
          style={{ width: 320 }}
        />
        <Button
          type="primary"
          onClick={() => {
            const nextQuery = searchInput.trim();
            setPagination((prev) => ({ ...prev, current: 1 }));
            setSelectedRowKeys([]);
            setSearchQuery(nextQuery);
            fetchComments(1, pagination.pageSize, filterStatus, nextQuery);
          }}
        >
          搜索
        </Button>
        <Button
          onClick={() => {
            setSearchInput("");
            setPagination((prev) => ({ ...prev, current: 1 }));
            setSelectedRowKeys([]);
            setSearchQuery("");
            fetchComments(1, pagination.pageSize, filterStatus, "");
          }}
          disabled={!searchInput && !searchQuery}
        >
          重置
        </Button>
        {selectedRowKeys.length > 0 && (
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 条评论吗？`}
            onConfirm={handleBatchDelete}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={batchDeleting}
            >
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        )}
      </Space>

      <Table
        dataSource={comments}
        columns={columns}
        rowKey="id"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1160 }}
        size="middle"
      />
    </div>
  );
}
