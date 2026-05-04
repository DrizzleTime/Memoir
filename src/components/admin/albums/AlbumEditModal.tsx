"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Modal, Space, Switch, Table, Tag, Typography } from "antd";
import { DownOutlined, PlusOutlined, UpOutlined } from "@ant-design/icons";
import { RawImg } from "@/components/ui";
import { getBaseName } from "@/lib/file-meta";
import type { AlbumFormValues, AlbumItem } from "@/types/albums";
import type { ListResponse, UploadFileItem } from "@/types/files";

interface AlbumEditModalProps {
  open: boolean;
  saving: boolean;
  loadingFiles: boolean;
  filePage: number;
  filePageSize: number;
  totalFiles: number;
  files: UploadFileItem[];
  album: AlbumItem | null;
  onClose: () => void;
  onSubmit: (values: AlbumFormValues) => void;
  onLoadFiles: (page: number, pageSize: number) => void;
}

export function AlbumEditModal({
  open,
  saving,
  loadingFiles,
  filePage,
  filePageSize,
  totalFiles,
  files,
  album,
  onClose,
  onSubmit,
  onLoadFiles,
}: AlbumEditModalProps) {
  const [form] = Form.useForm<AlbumFormValues>();
  const [selectedFiles, setSelectedFiles] = useState<UploadFileItem[]>(
    () => album?.images?.map((image) => image.file) || []
  );
  const selectedIds = useMemo(() => selectedFiles.map((file) => file.id), [selectedFiles]);

  useEffect(() => {
    if (!open) return;
    onLoadFiles(1, filePageSize);
  }, [filePageSize, onLoadFiles, open]);

  const addFile = (file: UploadFileItem) => {
    if (selectedIds.includes(file.id)) return;
    setSelectedFiles((current) => [...current, file]);
  };

  const removeFile = (fileId: number) => {
    setSelectedFiles((current) => current.filter((file) => file.id !== fileId));
  };

  const moveFile = (fileId: number, direction: -1 | 1) => {
    setSelectedFiles((current) => {
      const index = current.findIndex((file) => file.id === fileId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  return (
    <Modal
      title={album ? "编辑相册" : "新建相册"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      width={980}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          title: album?.title || "",
          description: album?.description || "",
          isPublic: album?.isPublic ?? true,
        }}
        onFinish={(values) => onSubmit({ ...values, fileIds: selectedIds })}
      >
        <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
          <Input placeholder="相册标题" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="相册描述，可留空" />
        </Form.Item>
        <Form.Item name="isPublic" label="公开状态" valuePropName="checked">
          <Switch checkedChildren="公开" unCheckedChildren="私密" />
        </Form.Item>
      </Form>

      <div
        className="memoir-admin-album-file-picker"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
      >
        <div>
          <Typography.Text strong>已选图片</Typography.Text>
          <Table
            rowKey="id"
            size="small"
            style={{ marginTop: 8 }}
            dataSource={selectedFiles}
            pagination={false}
            locale={{ emptyText: "请选择图片" }}
            columns={[
              {
                title: "图片",
                render: (_: unknown, record: UploadFileItem) => (
                  <ImageName file={record} />
                ),
              },
              {
                title: "操作",
                width: 150,
                render: (_: unknown, record: UploadFileItem, index: number) => (
                  <Space size={4}>
                    <Button size="small" icon={<UpOutlined />} disabled={index === 0} onClick={() => moveFile(record.id, -1)} />
                    <Button size="small" icon={<DownOutlined />} disabled={index === selectedFiles.length - 1} onClick={() => moveFile(record.id, 1)} />
                    <Button size="small" danger onClick={() => removeFile(record.id)}>移除</Button>
                  </Space>
                ),
              },
            ]}
          />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography.Text strong>媒体库图片</Typography.Text>
            <Button size="small" onClick={() => onLoadFiles(filePage, filePageSize)} loading={loadingFiles}>刷新</Button>
          </div>
          <Table
            rowKey="id"
            size="small"
            style={{ marginTop: 8 }}
            loading={loadingFiles}
            dataSource={files}
            pagination={{
              current: filePage,
              pageSize: filePageSize,
              total: totalFiles,
              showSizeChanger: false,
              onChange: onLoadFiles,
            }}
            columns={[
              {
                title: "图片",
                render: (_: unknown, record: UploadFileItem) => <ImageName file={record} />,
              },
              {
                title: "操作",
                width: 86,
                render: (_: unknown, record: UploadFileItem) => {
                  const selected = selectedIds.includes(record.id);
                  return selected ? (
                    <Tag color="success">已选</Tag>
                  ) : (
                    <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => addFile(record)}>
                      选择
                    </Button>
                  );
                },
              },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}

function ImageName({ file }: { file: UploadFileItem }) {
  const displayName = file.originalName || getBaseName(file.relativePath);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <RawImg
        src={`/uploads/${file.relativePath}`}
        alt={displayName}
        style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #f0f0f0" }}
      />
      <div style={{ minWidth: 0 }}>
        <Typography.Text ellipsis style={{ display: "block", maxWidth: 220 }}>
          {displayName}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>
          {file.relativePath}
        </Typography.Text>
      </div>
    </div>
  );
}

export type AlbumFilesResponse = ListResponse;
