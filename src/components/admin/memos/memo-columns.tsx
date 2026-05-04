"use client";

import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Tag, Typography, type TableProps } from "antd";
import type { MemoItem } from "@/components/admin/memos/types";

const { Paragraph } = Typography;

interface MemoColumnActions {
  onDelete: (id: number) => void;
  onEdit: (memo: MemoItem) => void;
  onPreview: (content: string) => void;
}

export function createMemoColumns({
  onDelete,
  onEdit,
  onPreview,
}: MemoColumnActions): TableProps<MemoItem>["columns"] {
  return [
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (content: string) => (
        <div style={{ maxWidth: 400 }}>
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}
          >
            {content}
          </Paragraph>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "isPublished",
      key: "isPublished",
      width: 100,
      align: "center",
      render: (isPublished: boolean) => (
        <Tag color={isPublished ? "success" : "default"}>
          {isPublished ? "已发布" : "草稿"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_: unknown, record: MemoItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onPreview(record.content)}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条动态吗？"
            onConfirm={() => onDelete(record.id)}
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
}
