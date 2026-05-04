"use client";

import { useState, useCallback } from "react";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import { SectionTitle, MutedText, Button } from "@/components/ui";
import type { CommentResponse, CommentTarget } from "@/types";

interface CommentSectionProps {
  target: CommentTarget;
  initialComments?: CommentResponse[];
  initialCount?: number;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

function countAllComments(list: CommentResponse[]): number {
  return list.reduce(
    (sum, comment) => sum + 1 + countAllComments(comment.replies || []),
    0
  );
}

function getCommentApiPath(target: CommentTarget): string {
  return `/api/comments/${target.type}/${target.id}`;
}

export default function CommentSection({
  target,
  initialComments,
  initialCount = 0,
  collapsible = false,
  defaultExpanded,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments || []);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(
    defaultExpanded ?? !collapsible
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(initialComments !== undefined);

  const loadComments = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch(getCommentApiPath(target));
      if (res.ok) {
        const data = await res.json();
        setComments(data);
        setHasLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [target]);

  const totalCount = hasLoaded ? countAllComments(comments) : initialCount;

  const handleToggle = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      setReplyTo(null);
      return;
    }

    if (!hasLoaded) {
      await loadComments();
    }

    setIsExpanded(true);
  };

  const handleSuccess = useCallback(async () => {
    await loadComments();
    setIsExpanded(true);
  }, [loadComments]);

  return (
    <section>
      {collapsible ? (
        <div>
          <Button
            onClick={handleToggle}
            variant="link"
            type="button"
            disabled={isLoading}
          >
            {isLoading
              ? "加载评论中..."
              : isExpanded
                ? `收起评论 (${totalCount})`
                : `评论 (${totalCount})`}
          </Button>
        </div>
      ) : (
        <SectionTitle>评论 ({totalCount})</SectionTitle>
      )}

      {isExpanded && (
        <div className={collapsible ? "mt-3 border-l-2 border-neutral-100 pl-4" : ""}>
          <CommentForm
            target={target}
            parentId={null}
            onSuccess={handleSuccess}
          />

          <div className="mt-6">
            {comments.length === 0 ? (
              <MutedText className="text-base py-4 text-neutral-400">
                暂无评论，来抢沙发吧
              </MutedText>
            ) : (
              <div className="space-y-2">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    target={target}
                    replyingTo={replyTo}
                    onReply={setReplyTo}
                    onReplySuccess={handleSuccess}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
