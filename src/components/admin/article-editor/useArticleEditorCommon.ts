"use client";

import { Form } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageInstance } from "antd/es/message/interface";
import type { ArticleStatus } from "@/lib/article-status";
import type {
  ArticleCategoryOption,
  ArticleFormValues,
  AuthFetch,
} from "@/components/admin/article-editor/types";

interface UseArticleEditorCommonParams {
  form: ReturnType<typeof Form.useForm<ArticleFormValues>>[0];
  content: string;
  authFetch: AuthFetch;
  enabled: boolean;
  messageApi: MessageInstance;
}

export function useArticleEditorCommon({
  form,
  content,
  authFetch,
  enabled,
  messageApi,
}: UseArticleEditorCommonParams) {
  const [categories, setCategories] = useState<ArticleCategoryOption[]>([]);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const submitActionRef = useRef<ArticleStatus>("DRAFT");
  const currentStatus = Form.useWatch("status", form) || "DRAFT";

  const uploadImage = useCallback(
    async (file: File) => {
      if (!enabled) return null;

      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/admin/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "上传失败");
      }

      const data = await response.json();
      return data.url as string;
    },
    [authFetch, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    const fetchCategories = async () => {
      try {
        const response = await authFetch("/api/admin/categories");
        if (!response.ok) {
          throw new Error("获取分类列表失败");
        }

        const data = await response.json();
        setCategories(data);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "获取分类列表失败");
      }
    };

    void fetchCategories();
  }, [authFetch, enabled, messageApi]);

  const generateSummary = useCallback(async () => {
    if (!content.trim()) {
      messageApi.warning("请先输入文章内容");
      return;
    }

    if (content.trim().length < 50) {
      messageApi.warning("文章内容太短，无法生成摘要");
      return;
    }

    if (!enabled) return;

    setGeneratingSummary(true);
    try {
      const response = await authFetch("/api/ai/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "生成摘要失败");
      }

      const data = await response.json();
      form.setFieldValue("summary", data.summary);
      messageApi.success("摘要生成成功");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "生成摘要失败");
    } finally {
      setGeneratingSummary(false);
    }
  }, [authFetch, content, enabled, form, messageApi]);

  const submitWithStatus = useCallback(
    (status: ArticleStatus) => {
      submitActionRef.current = status;
      form.setFieldValue("status", status);
      form.submit();
    },
    [form]
  );

  return {
    categories,
    currentStatus,
    generatingSummary,
    submitActionRef,
    uploadImage,
    generateSummary,
    submitWithStatus,
  };
}
