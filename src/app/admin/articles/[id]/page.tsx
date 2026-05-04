"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Tag,
  message,
  Typography,
  Spin,
  Modal,
  Empty,
  Descriptions,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import {
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUS_TAG_COLORS,
} from "@/lib/article-status";
import type {
  ArticleHistoryListItem,
  ArticleHistoryResponse,
  ArticleResponse,
} from "@/types";
import MarkdownView from "@/components/MarkdownView";
import ArticleEditorShell from "@/components/admin/article-editor/ArticleEditorShell";
import { useArticleEditorCommon } from "@/components/admin/article-editor/useArticleEditorCommon";
import type { ArticleFormValues } from "@/components/admin/article-editor/types";

const { Text } = Typography;

export default function EditArticlePage() {
  const params = useParams();
  const articleId = params.id as string;
  const [form] = Form.useForm<ArticleFormValues>();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [histories, setHistories] = useState<ArticleHistoryListItem[]>([]);
  const [historiesLoading, setHistoriesLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHistory, setPreviewHistory] = useState<ArticleHistoryResponse | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renamingHistory, setRenamingHistory] = useState<ArticleHistoryListItem | null>(null);
  const [renaming, setRenaming] = useState(false);
  const router = useRouter();
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();
  const hasFetched = useRef(false);
  const [renameForm] = Form.useForm<{ name: string }>();
  const {
    categories,
    currentStatus,
    generatingSummary,
    submitActionRef,
    uploadImage,
    generateSummary,
    submitWithStatus,
  } = useArticleEditorCommon({
    form,
    content,
    authFetch,
    enabled: !!token,
    messageApi,
  });

  const fetchHistories = useCallback(async () => {
    if (!token) return;

    setHistoriesLoading(true);
    try {
      const response = await authFetch(`/api/admin/articles/${articleId}/histories`);
      if (!response.ok) {
        throw new Error("获取历史版本失败");
      }

      const data = (await response.json()) as ArticleHistoryListItem[];
      setHistories(data);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取历史版本失败");
    } finally {
      setHistoriesLoading(false);
    }
  }, [articleId, authFetch, messageApi, token]);

  useEffect(() => {
    if (!token || hasFetched.current) return;
    hasFetched.current = true;

    const fetchArticle = async () => {
      try {
        const response = await authFetch(`/api/articles/${articleId}`);
        if (!response.ok) {
          throw new Error("获取文章失败");
        }
        const article: ArticleResponse = await response.json();
        form.setFieldsValue({
          title: article.title,
          summary: article.summary || undefined,
          cover_image: article.cover_image || undefined,
          category_id: article.category_id ?? undefined,
          status: article.status,
        });
        setContent(article.content);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "获取文章失败");
        router.push("/admin/articles");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId, authFetch, form, messageApi, router, token]);

  useEffect(() => {
    if (!token) return;
    fetchHistories();
  }, [fetchHistories, token]);

  const handleSubmit = async (values: ArticleFormValues) => {
    if (!content.trim()) {
      messageApi.error("请输入文章内容");
      return;
    }

    if (!token) return;

    setSaving(true);
    try {
      const response = await authFetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          content,
          category_id: values.category_id ?? null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "保存失败");
      }

      const updatedArticle = (await response.json()) as ArticleResponse;
      await fetchHistories();

      const historySuffix = updatedArticle.history_created ? "，已生成历史版本" : "";

      if (submitActionRef.current === "PUBLISHED") {
        messageApi.success(`文章发布成功${historySuffix}`);
        router.push("/admin/articles");
        return;
      }

      messageApi.success(
        submitActionRef.current === "PRIVATE"
          ? `私密文章已保存${historySuffix}`
          : `草稿已保存${historySuffix}`
      );
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewHistory = async (historyId: number) => {
    if (!token) return;

    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewHistory(null);

    try {
      const response = await authFetch(`/api/admin/articles/${articleId}/histories/${historyId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "获取历史版本失败");
      }

      const data = (await response.json()) as ArticleHistoryResponse;
      setPreviewHistory(data);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取历史版本失败");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenRename = (history: ArticleHistoryListItem) => {
    setRenamingHistory(history);
    renameForm.setFieldsValue({ name: history.name });
    setRenameOpen(true);
  };

  const handleRenameHistory = async (values: { name: string }) => {
    if (!token || !renamingHistory) return;

    setRenaming(true);
    try {
      const response = await authFetch(
        `/api/admin/articles/${articleId}/histories/${renamingHistory.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "修改名称失败");
      }

      const updatedHistory = (await response.json()) as ArticleHistoryResponse;
      setHistories((current) =>
        current.map((history) =>
          history.id === updatedHistory.id
            ? {
                ...history,
                name: updatedHistory.name,
                updated_at: updatedHistory.updated_at,
              }
            : history
        )
      );
      setPreviewHistory((current) =>
        current && current.id === updatedHistory.id
          ? {
              ...current,
              name: updatedHistory.name,
              updated_at: updatedHistory.updated_at,
            }
          : current
      );
      messageApi.success("历史版本名称已更新");
      setRenameOpen(false);
      setRenamingHistory(null);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "修改名称失败");
    } finally {
      setRenaming(false);
    }
  };

  return (
    <div
      className="memoir-admin-article-editor-page"
      style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      {contextHolder}

      <ArticleEditorShell
        pageTitle="编辑文章"
        form={form}
        onSubmit={handleSubmit}
        content={content}
        onContentChange={setContent}
        onUploadImage={uploadImage}
        onBack={() => router.back()}
        onSaveDraft={() => submitWithStatus("DRAFT")}
        onSavePrivate={() => submitWithStatus("PRIVATE")}
        onPublish={() => submitWithStatus("PUBLISHED")}
        onGenerateSummary={generateSummary}
        currentStatus={currentStatus}
        categories={categories}
        generatingSummary={generatingSummary}
        submitting={saving}
        loading={loading}
        sidebarExtra={(
          <Card
            title="历史版本"
            size="small"
            extra={<Text type="secondary">{histories.length} 条</Text>}
          >
            {historiesLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "12px 0",
                }}
              >
                <Spin size="small" />
              </div>
            ) : histories.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无历史版本" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {histories.map((history, index) => (
                  <div
                    key={history.id}
                    style={{
                      paddingBottom: index === histories.length - 1 ? 0 : 12,
                      borderBottom:
                        index === histories.length - 1 ? "none" : "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, wordBreak: "break-all" }}>
                          {history.name}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(history.created_at).toLocaleString("zh-CN")}
                        </Text>
                      </div>
                      <Tag color={ARTICLE_STATUS_TAG_COLORS[history.status]}>
                        {ARTICLE_STATUS_LABELS[history.status]}
                      </Tag>
                    </div>

                    <Space size="small" style={{ marginTop: 8 }}>
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreviewHistory(history.id)}
                        style={{ padding: 0 }}
                      >
                        回顾
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenRename(history)}
                        style={{ padding: 0 }}
                      >
                        改名
                      </Button>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      />

      <Modal
        title={previewHistory ? `历史版本：${previewHistory.name}` : "历史版本"}
        open={previewOpen}
        onCancel={() => {
          setPreviewOpen(false);
          setPreviewHistory(null);
        }}
        footer={null}
        width={960}
      >
        {previewLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 240,
            }}
          >
            <Spin />
          </div>
        ) : previewHistory ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="名称">{previewHistory.name}</Descriptions.Item>
              <Descriptions.Item label="标题">{previewHistory.title}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={ARTICLE_STATUS_TAG_COLORS[previewHistory.status]}>
                  {ARTICLE_STATUS_LABELS[previewHistory.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="分类">
                {previewHistory.category_name || "未分类"}
              </Descriptions.Item>
              <Descriptions.Item label="封面图片">
                {previewHistory.cover_image || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="生成时间">
                {new Date(previewHistory.created_at).toLocaleString("zh-CN")}
              </Descriptions.Item>
              <Descriptions.Item label="最后修改">
                {new Date(previewHistory.updated_at).toLocaleString("zh-CN")}
              </Descriptions.Item>
            </Descriptions>

            {previewHistory.summary ? (
              <Card title="摘要" size="small">
                <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {previewHistory.summary}
                </div>
              </Card>
            ) : null}

            <Card title="正文" size="small">
              <MarkdownView content={previewHistory.content} variant="editor" />
            </Card>
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
        )}
      </Modal>

      <Modal
        title="修改历史版本名称"
        open={renameOpen}
        onCancel={() => {
          setRenameOpen(false);
          setRenamingHistory(null);
        }}
        footer={null}
        destroyOnHidden
      >
        <Form form={renameForm} layout="vertical" onFinish={handleRenameHistory}>
          <Form.Item
            name="name"
            label="名称"
            rules={[
              { required: true, message: "请输入名称" },
              { max: 200, message: "名称不能超过 200 个字符" },
            ]}
          >
            <Input placeholder="请输入历史版本名称" maxLength={200} showCount />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setRenameOpen(false);
                  setRenamingHistory(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={renaming}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
