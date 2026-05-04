"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Modal,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd";
import {
  DownloadOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";

const { Title, Paragraph, Text } = Typography;

const BACKUP_TABLES = [
  "用户",
  "分类",
  "文章",
  "文章历史",
  "评论",
  "动态",
  "飞书动态映射",
  "链接",
  "系统配置",
  "文件索引",
];

type RestoreResponse = {
  restored: Record<string, number>;
};

export default function AdminBackupPage() {
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleDownload = async () => {
    if (!token) return;

    setDownloading(true);
    try {
      const response = await authFetch("/api/admin/backup");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "导出备份失败");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const matched = disposition.match(/filename="?([^";]+)"?/);
      const filename = matched?.[1] || `memoir-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      messageApi.success("备份已下载");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "导出备份失败");
    } finally {
      setDownloading(false);
    }
  };

  const handleRestore = () => {
    if (!token) return;
    const file = fileList[0]?.originFileObj;
    if (!file) {
      messageApi.error("请选择备份文件");
      return;
    }

    Modal.confirm({
      title: "确认覆盖恢复？",
      icon: <ExclamationCircleOutlined />,
      content: "恢复会先清空当前博客数据库中的目标数据，再导入备份文件内容。此操作不可撤销。",
      okText: "确认恢复",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        setRestoring(true);
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await authFetch("/api/admin/backup/restore", {
            method: "POST",
            body: formData,
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "恢复备份失败");
          }

          const restored = (result as RestoreResponse).restored;
          const total = Object.values(restored).reduce((sum, count) => sum + count, 0);
          messageApi.success(`恢复完成，共导入 ${total} 条数据`);
          setFileList([]);
        } catch (error) {
          messageApi.error(error instanceof Error ? error.message : "恢复备份失败");
        } finally {
          setRestoring(false);
        }
      },
    });
  };

  return (
    <div>
      {contextHolder}
      <Title level={2}>备份恢复</Title>

      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        <Alert
          type="warning"
          showIcon
          title="恢复会覆盖当前数据库数据"
          description="请先下载当前备份，再执行恢复。备份文件不包含 public/uploads 下的实际文件，只包含文件索引记录。"
        />

        <Card title="备份范围">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="包含数据">
              {BACKUP_TABLES.join("、")}
            </Descriptions.Item>
            <Descriptions.Item label="不包含内容">
              public/uploads 实际文件、数据库结构、迁移历史、数据库账号和扩展
            </Descriptions.Item>
            <Descriptions.Item label="文件格式">
              JSON，由本页面导出的备份文件
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="下载备份">
          <Paragraph>
            <Text type="secondary">
              导出当前数据库业务数据，生成可用于恢复的 JSON 文件。
            </Text>
          </Paragraph>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownload}
          >
            下载备份
          </Button>
        </Card>

        <Card title="恢复备份">
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Paragraph style={{ marginBottom: 0 }}>
              <Text type="secondary">
                上传备份 JSON 文件并执行覆盖恢复。恢复完成后，当前数据会变为备份文件中的数据。
              </Text>
            </Paragraph>
            <Upload
              accept="application/json,.json"
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: nextFileList }) => setFileList(nextFileList.slice(-1))}
            >
              <Button icon={<UploadOutlined />}>选择备份文件</Button>
            </Upload>
            <Button
              danger
              type="primary"
              loading={restoring}
              disabled={fileList.length === 0}
              onClick={handleRestore}
            >
              开始恢复
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
}
