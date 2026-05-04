"use client";

import { Meta } from "@/components/ui";
import MarkdownView from "@/components/MarkdownView";
import CommentSection from "@/components/CommentSection";

interface Memo {
  id: number;
  content: string;
  createdAt: Date | string;
  commentCount: number;
}

interface MemoItemProps {
  memo: Memo;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MemoItem({ memo }: MemoItemProps) {
  return (
    <article id={`memo-${memo.id}`} className="memoir-interactive-row group relative">
      <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200 group-last:bg-transparent" />
      <div className="absolute left-0 top-2 w-2 h-2 -translate-x-[3.5px] rounded-full bg-neutral-300 group-hover:bg-emerald-500 transition-colors" />

      <div className="pl-6">
        <div className="flex items-center gap-3 mb-2">
          <Meta label="">{formatDate(memo.createdAt)}</Meta>
          <span className="text-neutral-300 text-sm">{formatTime(memo.createdAt)}</span>
        </div>

        <MarkdownView content={memo.content} variant="memo" />

        <div className="mt-3">
          <CommentSection
            target={{ type: "memo", id: memo.id }}
            initialCount={memo.commentCount}
            collapsible
          />
        </div>
      </div>
    </article>
  );
}
