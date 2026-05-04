"use client";

import { useState } from "react";
import { Form, message } from "antd";
import { useRouter } from "next/navigation";
import { useAdminAuth, useAuthFetch } from "@/lib/admin-auth";
import ArticleEditorShell from "@/components/admin/article-editor/ArticleEditorShell";
import { useArticleEditorCommon } from "@/components/admin/article-editor/useArticleEditorCommon";
import type { ArticleFormValues } from "@/components/admin/article-editor/types";

export default function CreateArticlePage() {
  const [form] = Form.useForm<ArticleFormValues>();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { token } = useAdminAuth();
  const authFetch = useAuthFetch();
  const [messageApi, contextHolder] = message.useMessage();
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

  const handleSubmit = async (values: ArticleFormValues) => {
    if (!content.trim()) {
      messageApi.error("请输入文章内容");
      return;
    }

    if (!token) return;

    setSubmitting(true);
    try {
      const response = await authFetch("/api/articles", {
        method: "POST",
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
        throw new Error(error.detail || "创建失败");
      }

      const createdArticle = (await response.json()) as { id: number };

      if (submitActionRef.current === "PUBLISHED") {
        messageApi.success("文章发布成功");
        router.push("/admin/articles");
        return;
      }

      messageApi.success(
        submitActionRef.current === "PRIVATE" ? "私密文章已创建" : "草稿已创建"
      );
      router.replace(`/admin/articles/${createdArticle.id}`);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="memoir-admin-article-editor-page"
      style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      {contextHolder}

      <ArticleEditorShell
        pageTitle="新建文章"
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
        submitting={submitting}
      />
    </div>
  );
}
