"use client";

import MarkdownView from "@/components/MarkdownView";

interface MarkdownEditorPaneProps {
  value: string;
  previewValue: string;
  height: number | "auto";
  isFullscreen: boolean;
  isAutoHeight: boolean;
  placeholder?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  previewRef: React.RefObject<HTMLDivElement | null>;
  onChange: (value: string) => void;
  onScroll: () => void;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

export function MarkdownEditorPane({
  value,
  previewValue,
  height,
  isFullscreen,
  isAutoHeight,
  placeholder,
  textareaRef,
  previewRef,
  onChange,
  onScroll,
  onPaste,
}: MarkdownEditorPaneProps) {
  return (
    <div
      className="memoir-markdown-editor-pane"
      style={{
        display: "flex",
        ...(isFullscreen || isAutoHeight ? { flex: 1, minHeight: 0 } : { height }),
      }}
    >
      <div
        className="memoir-markdown-editor-input-pane"
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={onScroll}
          onPaste={onPaste}
          placeholder={placeholder}
          style={{
            flex: 1,
            width: "100%",
            resize: "none",
            border: "none",
            padding: 12,
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: 14,
            lineHeight: 1.6,
            outline: "none",
          }}
        />
      </div>
      <div
        className="memoir-markdown-editor-preview-pane"
        ref={previewRef}
        style={{
          flex: 1,
          borderLeft: "1px solid #f0f0f0",
          padding: 12,
          overflow: "auto",
          background: "#fff",
        }}
      >
        <MarkdownView content={previewValue} variant="editor" />
      </div>
    </div>
  );
}
