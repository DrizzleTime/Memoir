"use client";

import { useState } from "react";
import {
  Input,
  Textarea,
  Button,
  FormRow,
  FormError,
} from "@/components/ui";
import { useUser } from "@/lib/use-user";
import type { CommentTarget } from "@/types";

interface CommentFormProps {
  target: CommentTarget;
  parentId: number | null;
  onSuccess: () => void | Promise<void>;
  onCancel?: () => void;
}

export default function CommentForm({
  target,
  parentId,
  onSuccess,
  onCancel,
}: CommentFormProps) {
  const { user, token, isLoading } = useUser();
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestWebsite, setGuestWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user && !!token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("请输入评论内容");
      return;
    }
    if (!isLoggedIn && (!guestName.trim() || !guestEmail.trim())) {
      setError("请填写昵称和邮箱");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (isLoggedIn && token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/comments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: content.trim(),
          target_type: target.type,
          target_id: target.id,
          parent_id: parentId,
          ...(isLoggedIn ? {} : {
            guest_name: guestName.trim(),
            guest_email: guestEmail.trim(),
            guest_website: guestWebsite.trim() || undefined,
          }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "提交失败");
      }

      setContent("");
      await onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {isLoggedIn ? (
        <div className="text-base text-neutral-500">
          以 <span className="font-medium text-neutral-700">{user.nickname || user.username}</span> 的身份评论
        </div>
      ) : (
        <FormRow>
          <Input
            type="text"
            placeholder="昵称 *"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full sm:flex-1"
          />
          <Input
            type="email"
            placeholder="邮箱 * (用于显示头像)"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full sm:flex-1"
          />
          <Input
            type="url"
            placeholder="网址 (可选)"
            value={guestWebsite}
            onChange={(e) => setGuestWebsite(e.target.value)}
            className="w-full sm:flex-1"
          />
        </FormRow>
      )}

      <Textarea
        placeholder={parentId ? "写下你的回复..." : "写下你的评论..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />

      {error && <FormError>{error}</FormError>}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting ? "提交中..." : "发表"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
          >
            取消
          </Button>
        )}
      </div>
    </form>
  );
}
