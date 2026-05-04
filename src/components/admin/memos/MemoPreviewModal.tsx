"use client";

import { Modal } from "antd";
import MarkdownView from "@/components/MarkdownView";

interface MemoPreviewModalProps {
  open: boolean;
  content: string;
  onClose: () => void;
}

export function MemoPreviewModal({ open, content, onClose }: MemoPreviewModalProps) {
  return (
    <Modal
      title="预览"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      <MarkdownView content={content} variant="memo" />
    </Modal>
  );
}
