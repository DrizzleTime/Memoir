"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { AlbumEditModal } from "@/components/admin/albums/AlbumEditModal";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import type { AlbumFormValues, AlbumItem } from "@/types/albums";
import type { ListResponse, UploadFileItem } from "@/types/files";

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [filePage, setFilePage] = useState(1);
  const [filePageSize] = useState(12);
  const [totalFiles, setTotalFiles] = useState(0);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchAlbums = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await authFetch("/api/admin/albums");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "获取相册列表失败");
      setAlbums(data);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取相册列表失败");
    } finally {
      setLoading(false);
    }
  }, [authFetch, messageApi, token]);

  const fetchFiles = useCallback(async (page: number, pageSize: number) => {
    if (!token) return;
    setLoadingFiles(true);
    try {
      const response = await authFetch(`/api/admin/files?page=${page}&pageSize=${pageSize}&missing=false&type=image`);
      const data = await response.json() as ListResponse | { error?: string };
      if (!response.ok) throw new Error("error" in data ? data.error || "获取媒体库失败" : "获取媒体库失败");
      const listData = data as ListResponse;
      setFiles(listData.data);
      setFilePage(listData.pagination.page);
      setTotalFiles(listData.pagination.totalCount);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取媒体库失败");
    } finally {
      setLoadingFiles(false);
    }
  }, [authFetch, messageApi, token]);

  useEffect(() => {
    void fetchAlbums();
  }, [fetchAlbums]);

  const openCreateModal = () => {
    setEditingAlbum(null);
    setModalOpen(true);
  };

  const openEditModal = async (album: AlbumItem) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/admin/albums/${album.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "获取相册失败");
      setEditingAlbum(data);
      setModalOpen(true);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取相册失败");
    }
  };

  const handleSubmit = async (values: AlbumFormValues) => {
    setSaving(true);
    try {
      const url = editingAlbum ? `/api/admin/albums/${editingAlbum.id}` : "/api/admin/albums";
      const response = await authFetch(url, {
        method: editingAlbum ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "保存相册失败");
      messageApi.success("已保存相册");
      setModalOpen(false);
      await fetchAlbums();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "保存相册失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (album: AlbumItem) => {
    try {
      const response = await authFetch(`/api/admin/albums/${album.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "删除相册失败");
      messageApi.success("已删除相册");
      await fetchAlbums();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "删除相册失败");
    }
  };

  return (
    <>
      {contextHolder}
      <Card
        title="相册管理"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>新建相册</Button>}
        style={{ borderRadius: 24 }}
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={albums}
          pagination={false}
          scroll={{ x: 760 }}
          columns={[
            {
              title: "标题",
              dataIndex: "title",
              render: (title: string, record: AlbumItem) => (
                <div>
                  <Typography.Text strong>{title}</Typography.Text>
                  {record.description ? (
                    <Typography.Paragraph type="secondary" ellipsis={{ rows: 1 }} style={{ margin: 0 }}>
                      {record.description}
                    </Typography.Paragraph>
                  ) : null}
                </div>
              ),
            },
            {
              title: "状态",
              dataIndex: "isPublic",
              width: 110,
              render: (isPublic: boolean) => <Tag color={isPublic ? "success" : "default"}>{isPublic ? "公开" : "私密"}</Tag>,
            },
            { title: "图片", dataIndex: "imageCount", width: 100, render: (count: number) => `${count} 张` },
            {
              title: "更新时间",
              dataIndex: "updatedAt",
              width: 180,
              render: (date: string) => new Date(date).toLocaleString("zh-CN"),
            },
            {
              title: "操作",
              width: 160,
              render: (_: unknown, record: AlbumItem) => (
                <Space>
                  <Button type="link" icon={<EditOutlined />} onClick={() => void openEditModal(record)}>编辑</Button>
                  <Popconfirm title="确认删除这个相册？" onConfirm={() => void handleDelete(record)}>
                    <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {modalOpen ? (
        <AlbumEditModal
          key={editingAlbum?.id ?? "create"}
          open={modalOpen}
          saving={saving}
          loadingFiles={loadingFiles}
          filePage={filePage}
          filePageSize={filePageSize}
          totalFiles={totalFiles}
          files={files}
          album={editingAlbum}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          onLoadFiles={fetchFiles}
        />
      ) : null}
    </>
  );
}
