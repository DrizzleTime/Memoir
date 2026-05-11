"use client";

import type { CommentResponse, CommentTarget } from "@/types";
import { Avatar, Button, MutedText } from "@/components/ui";
import CommentForm from "./CommentForm";
import MarkdownView from "@/components/MarkdownView";

function getCommentAuthorName(comment: CommentResponse): string {
  return (
    comment.author?.nickname ||
    comment.author?.username ||
    comment.guest_name ||
    "匿名"
  );
}

function getValidUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

interface CommentItemProps {
  comment: CommentResponse;
  target: CommentTarget;
  replyingTo: number | null;
  onReply: (parentId: number | null) => void;
  onReplySuccess: () => void | Promise<void>;
}

export default function CommentItem({
  comment,
  target,
  replyingTo,
  onReply,
  onReplySuccess,
}: CommentItemProps) {
  const authorName = getCommentAuthorName(comment);

  const email = comment.author?.email || comment.guest_email;
  const website = comment.guest_website;

  const validWebsite = getValidUrl(website);

  const avatarElement = <Avatar email={email} name={authorName} size={36} />;
  const nameElement = (
    <span className={`font-medium ${validWebsite ? "text-neutral-800 hover:text-blue-600 hover:underline" : "text-neutral-800"}`}>
      {authorName}
    </span>
  );

  return (
    <div className={`${comment.parent_id ? "ml-4 sm:ml-8" : ""} mb-4`}>
      <div className="flex gap-3">
        {validWebsite ? (
          <a href={validWebsite} target="_blank" rel="noopener noreferrer nofollow">
            {avatarElement}
          </a>
        ) : (
          avatarElement
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {validWebsite ? (
              <a href={validWebsite} target="_blank" rel="noopener noreferrer nofollow">
                {nameElement}
              </a>
            ) : (
              nameElement
            )}
            <MutedText as="span" className="text-neutral-400 text-sm">
              {new Date(comment.created_at).toLocaleString("zh-CN")}
            </MutedText>
          </div>

          <MarkdownView content={comment.content} variant="comment" />

          <Button
            onClick={() => onReply(comment.id)}
            variant="link"
            type="button"
          >
            回复
          </Button>

          {replyingTo === comment.id && (
            <div className="mt-3">
              <CommentForm
                target={target}
                parentId={comment.id}
                onSuccess={() => {
                  onReply(null);
                  onReplySuccess();
                }}
                onCancel={() => onReply(null)}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (() => {
        const nameMap = new Map<number, string>();
        const flatReplies: CommentResponse[] = [];

        const collect = (node: CommentResponse) => {
          nameMap.set(node.id, getCommentAuthorName(node));
          for (const reply of node.replies || []) {
            flatReplies.push(reply);
            collect(reply);
          }
        };

        collect(comment);

        flatReplies.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

        return (
          <div className="mt-3 border-l-2 border-neutral-100 pl-2 sm:pl-3 space-y-3">
            {flatReplies.map((reply) => {
              const replyAuthorName = getCommentAuthorName(reply);
              const replyEmail = reply.author?.email || reply.guest_email;
              const replyWebsite = getValidUrl(reply.guest_website);
              const replyToName = reply.parent_id ? nameMap.get(reply.parent_id) || "匿名" : null;

              const replyAvatarElement = <Avatar email={replyEmail} name={replyAuthorName} size={36} />;
              const replyNameElement = (
                <span
                  className={`font-medium ${replyWebsite ? "text-neutral-800 hover:text-blue-600 hover:underline" : "text-neutral-800"}`}
                >
                  {replyAuthorName}
                </span>
              );

              return (
                <div key={reply.id}>
                  <div className="flex gap-3">
                    {replyWebsite ? (
                      <a href={replyWebsite} target="_blank" rel="noopener noreferrer nofollow">
                        {replyAvatarElement}
                      </a>
                    ) : (
                      replyAvatarElement
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {replyWebsite ? (
                          <a href={replyWebsite} target="_blank" rel="noopener noreferrer nofollow">
                            {replyNameElement}
                          </a>
                        ) : (
                          replyNameElement
                        )}
                        <MutedText as="span" className="text-neutral-400 text-sm">
                          {new Date(reply.created_at).toLocaleString("zh-CN")}
                        </MutedText>
                      </div>

                      <MarkdownView
                        content={
                          replyToName ? `@${replyToName} ${reply.content}` : reply.content
                        }
                        variant="comment"
                      />

                      <Button
                        onClick={() => onReply(reply.id)}
                        variant="link"
                        type="button"
                      >
                        回复
                      </Button>

                      {replyingTo === reply.id && (
                        <div className="mt-3">
                          <CommentForm
                            target={target}
                            parentId={reply.id}
                            onSuccess={() => {
                              onReply(null);
                              onReplySuccess();
                            }}
                            onCancel={() => onReply(null)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
