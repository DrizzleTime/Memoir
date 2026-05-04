"use client";

import { Button, Popconfirm, Space, Typography } from "antd";
import { ClearOutlined, DeleteOutlined, FileImageOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface AdminFilesToolbarProps {
  syncing: boolean;
  webpPreviewLoading: boolean;
  webpCleanupPreviewLoading: boolean;
  clearing: boolean;
  onSync: () => void;
  onPreviewWebpConvert: () => void;
  onPreviewWebpCleanup: () => void;
  onClearIndex: () => void;
  onOpenUpload: () => void;
}

export function AdminFilesToolbar({
  syncing,
  webpPreviewLoading,
  webpCleanupPreviewLoading,
  clearing,
  onSync,
  onPreviewWebpConvert,
  onPreviewWebpCleanup,
  onClearIndex,
  onOpenUpload,
}: AdminFilesToolbarProps) {
  return (
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
        文件管理
      </Title>
      <Space className="memoir-admin-toolbar" wrap>
        <Button icon={<ReloadOutlined />} onClick={onSync} loading={syncing}>
          扫描同步
        </Button>
        <Button
          icon={<FileImageOutlined />}
          onClick={onPreviewWebpConvert}
          loading={webpPreviewLoading}
        >
          转换WebP
        </Button>
        <Button
          icon={<ClearOutlined />}
          onClick={onPreviewWebpCleanup}
          loading={webpCleanupPreviewLoading}
        >
          清理WebP转化图
        </Button>
        <Popconfirm
          title="确定要清空索引吗？不会删除磁盘文件。"
          onConfirm={onClearIndex}
          okText="确定"
          cancelText="取消"
        >
          <Button danger icon={<DeleteOutlined />} loading={clearing}>
            清空索引
          </Button>
        </Popconfirm>
        <Button type="primary" icon={<PlusOutlined />} onClick={onOpenUpload}>
          上传文件
        </Button>
      </Space>
    </div>
  );
}
