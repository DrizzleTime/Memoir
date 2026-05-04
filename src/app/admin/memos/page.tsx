"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Table, message, Typography, type TablePaginationConfig } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import { MemoEditorModal } from "@/components/admin/memos/MemoEditorModal";
import { MemoPreviewModal } from "@/components/admin/memos/MemoPreviewModal";
import { createMemoColumns } from "@/components/admin/memos/memo-columns";
import type { MemoFormValues, MemoItem } from "@/components/admin/memos/types";

const { Title } = Typography;

export default function AdminMemosPage() {
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [editingMemo, setEditingMemo] = useState<MemoItem | null>(null);
  const [saving, setSaving] = useState(false);
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchMemos = useCallback(async (page = 1, pageSize = 10) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await authFetch(
        `/api/admin/memos?page=${page}&pageSize=${pageSize}`,
        {}
      );
      if (!response.ok) {
        throw new Error("获取动态列表失败");
      }
      const data = await response.json();
      setMemos(data.data);
      setPagination({
        current: data.pagination.page,
        pageSize: data.pagination.pageSize,
        total: data.pagination.totalCount,
      });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [authFetch, messageApi, token]);

  useEffect(() => {
    if (token) {
      fetchMemos();
    }
  }, [token, fetchMemos]);

  const handleAdd = () => {
    setEditingMemo(null);
    setModalOpen(true);
  };

  const handleEdit = (memo: MemoItem) => {
    setEditingMemo(memo);
    setModalOpen(true);
  };

  const handlePreview = (content: string) => {
    setPreviewContent(content);
    setPreviewOpen(true);
  };

  const handleSubmit = async (values: MemoFormValues) => {
    if (!token) return;

    setSaving(true);
    try {
      const url = editingMemo
        ? `/api/admin/memos/${editingMemo.id}`
        : "/api/admin/memos";
      const method = editingMemo ? "PUT" : "POST";

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

      messageApi.success(editingMemo ? "动态已更新" : "动态已创建");
      setModalOpen(false);
      fetchMemos(pagination.current, pagination.pageSize);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/admin/memos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("删除失败");
      }
      messageApi.success("删除成功");
      fetchMemos(pagination.current, pagination.pageSize);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    fetchMemos(paginationConfig.current || 1, paginationConfig.pageSize || 10);
  };

  const columns = createMemoColumns({
    onDelete: handleDelete,
    onEdit: handleEdit,
    onPreview: handlePreview,
  });

  return (
    <div>
      {contextHolder}
      <div
        className="memoir-admin-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          动态管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          发布动态
        </Button>
      </div>

      <Table
        dataSource={memos}
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
        scroll={{ x: 900 }}
        size="middle"
      />

      <MemoEditorModal
        open={modalOpen}
        editingMemo={editingMemo}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <MemoPreviewModal
        open={previewOpen}
        content={previewContent}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
