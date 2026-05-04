"use client";

import { Input, Button, Select, Card, Space, Tag, Typography, Tooltip, Form, Spin } from "antd";
import type { FormInstance } from "antd";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SendOutlined,
  RobotOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import MarkdownEditor from "@/components/MarkdownEditor";
import {
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUS_TAG_COLORS,
} from "@/lib/article-status";
import type { ArticleStatus } from "@/lib/article-status";
import type {
  ArticleCategoryOption,
  ArticleFormValues,
} from "@/components/admin/article-editor/types";

const { Title } = Typography;
const { TextArea } = Input;

interface ArticleEditorShellProps {
  pageTitle: string;
  form: FormInstance<ArticleFormValues>;
  content: string;
  onContentChange: Dispatch<SetStateAction<string>>;
  onSubmit: (values: ArticleFormValues) => void | Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
  onBack: () => void;
  onSaveDraft: () => void;
  onSavePrivate: () => void;
  onPublish: () => void;
  onGenerateSummary: () => void;
  currentStatus: ArticleStatus;
  categories: ArticleCategoryOption[];
  generatingSummary: boolean;
  submitting: boolean;
  loading?: boolean;
  sidebarExtra?: ReactNode;
}

export default function ArticleEditorShell({
  pageTitle,
  form,
  content,
  onContentChange,
  onSubmit,
  onUploadImage,
  onBack,
  onSaveDraft,
  onSavePrivate,
  onPublish,
  onGenerateSummary,
  currentStatus,
  categories,
  generatingSummary,
  submitting,
  loading = false,
  sidebarExtra,
}: ArticleEditorShellProps) {
  return (
    <Form
      className="memoir-admin-article-editor"
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{ status: "DRAFT" }}
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      <div
        className="memoir-admin-article-editor-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} />
          <Title level={4} style={{ margin: 0, whiteSpace: "nowrap" }}>
            {pageTitle}
          </Title>
        </div>

        <Space className="memoir-admin-article-editor-actions" wrap>
          <Button onClick={onBack}>取消</Button>
          <Button
            icon={<SaveOutlined />}
            onClick={onSaveDraft}
            loading={submitting}
            disabled={loading}
          >
            保存草稿
          </Button>
          <Button
            icon={<EyeInvisibleOutlined />}
            onClick={onSavePrivate}
            loading={submitting}
            disabled={loading}
          >
            设为私密
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={onPublish}
            loading={submitting}
            disabled={loading}
          >
            发布
          </Button>
        </Space>
      </div>

      {loading ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <div
          className="memoir-admin-article-editor-body"
          style={{ display: "flex", gap: 16, flex: 1, minHeight: 0, overflow: "hidden" }}
        >
          <div
            className="memoir-admin-article-editor-main"
            style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}
          >
            <MarkdownEditor
              value={content}
              onChange={onContentChange}
              height="auto"
              onUploadImage={onUploadImage}
              placeholder="支持 Markdown 格式"
            />
          </div>

          <div
            className="memoir-admin-article-editor-sidebar"
            style={{
              width: 320,
              flex: "0 0 320px",
              minWidth: 320,
              minHeight: 0,
              overflow: "auto",
              paddingRight: 4,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card size="small">
                <Form.Item
                  name="title"
                  label="标题"
                  rules={[{ required: true, message: "请输入文章标题" }]}
                >
                  <Input placeholder="请输入文章标题" maxLength={200} showCount />
                </Form.Item>

                <Form.Item
                  name="summary"
                  label={
                    <Space>
                      <span>摘要</span>
                      <Tooltip title="使用 AI 根据文章内容自动生成摘要">
                        <Button
                          type="link"
                          size="small"
                          icon={<RobotOutlined />}
                          loading={generatingSummary}
                          onClick={onGenerateSummary}
                          style={{ padding: 0 }}
                        >
                          AI 生成
                        </Button>
                      </Tooltip>
                    </Space>
                  }
                >
                  <TextArea
                    placeholder="请输入文章摘要（可选），或点击「AI 生成」自动生成"
                    rows={3}
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Card>

              <Card title="文章设置" size="small">
                <Form.Item name="cover_image" label="封面图片">
                  <Input placeholder="请输入封面图片 URL" />
                </Form.Item>

                <Form.Item name="category_id" label="分类">
                  <Select
                    allowClear
                    placeholder="选择分类（可选）"
                    style={{ width: "100%" }}
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                  />
                </Form.Item>

                <Form.Item label="当前状态" style={{ marginBottom: 12 }}>
                  <Tag color={ARTICLE_STATUS_TAG_COLORS[currentStatus]}>
                    {ARTICLE_STATUS_LABELS[currentStatus]}
                  </Tag>
                </Form.Item>

                <Form.Item name="status" hidden>
                  <Input />
                </Form.Item>
              </Card>

              {sidebarExtra}
            </div>
          </div>
        </div>
      )}
    </Form>
  );
}
