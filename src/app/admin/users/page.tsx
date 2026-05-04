"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Typography,
  Avatar,
  Modal,
  Form,
  Input,
} from "antd";
import type { TablePaginationConfig } from "antd";
import { EditOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import type { UserResponse } from "@/types";

const { Title } = Typography;
const { TextArea } = Input;

interface UserItem extends UserResponse {
  article_count: number;
  comment_count: number;
}

interface PageData {
  items: UserItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface UserFormValues {
  nickname?: string;
  avatar?: string;
  bio?: string;
  password?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [form] = Form.useForm<UserFormValues>();
  const [saving, setSaving] = useState(false);
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchUsers = useCallback(async (page = 1, pageSize = 10) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });

      const response = await authFetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error("获取用户列表失败");
      }
      const data: PageData = await response.json();
      setUsers(data.items);
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
      fetchUsers();
    }
  }, [token, fetchUsers]);

  const handleEdit = (user: UserItem) => {
    setEditingUser(user);
    form.setFieldsValue({
      nickname: user.nickname || undefined,
      avatar: user.avatar || undefined,
      bio: user.bio || undefined,
      password: undefined,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (values: UserFormValues) => {
    if (!editingUser || !token) return;

    setSaving(true);
    try {
      const payload: UserFormValues = { ...values };
      if (!payload.password) {
        delete payload.password;
      }

      const response = await authFetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "更新失败");
      }
      messageApi.success("用户信息已更新");
      setEditModalOpen(false);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "更新失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("删除失败");
      }
      messageApi.success("删除成功");
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    fetchUsers(paginationConfig.current || 1, paginationConfig.pageSize || 10);
  };

  const columns = [
    {
      title: "用户",
      key: "user",
      width: 250,
      render: (_: unknown, record: UserItem) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.nickname || record.username}</div>
            <div style={{ fontSize: 12, color: "#999" }}>@{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "文章数",
      dataIndex: "article_count",
      key: "article_count",
      width: 100,
      align: "center" as const,
    },
    {
      title: "评论数",
      dataIndex: "comment_count",
      key: "comment_count",
      width: 100,
      align: "center" as const,
    },
    {
      title: "注册时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_: unknown, record: UserItem) => (
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
            title="确定要删除这个用户吗？"
            description="删除后该用户的所有文章和评论也将被删除"
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
          用户管理
        </Title>
      </div>

      <Table
        dataSource={users}
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
        scroll={{ x: 880 }}
        size="middle"
      />

      <Modal
        title="编辑用户"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        destroyOnHidden
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="nickname" label="昵称">
            <Input placeholder="请输入昵称" maxLength={50} />
          </Form.Item>
          <Form.Item name="avatar" label="头像 URL">
            <Input placeholder="请输入头像图片 URL" />
          </Form.Item>
          <Form.Item name="bio" label="个人简介">
            <TextArea placeholder="请输入个人简介" rows={3} maxLength={200} showCount />
          </Form.Item>
          <Form.Item
            name="password"
            label="新密码"
            rules={[{ min: 6, message: "密码至少 6 位" }]}
          >
            <Input.Password placeholder="留空则不修改密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setEditModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
