"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  LinkOutlined,
  PictureOutlined,
  CodeOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  BlockOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { MarkdownEditorMediaModal } from "@/components/markdown-editor/MarkdownEditorMediaModal";
import { MarkdownEditorPane } from "@/components/markdown-editor/MarkdownEditorPane";
import { MarkdownEditorToolbar } from "@/components/markdown-editor/MarkdownEditorToolbar";
import {
  fetchMediaLibraryFiles,
  uploadMediaLibraryFiles,
} from "@/components/markdown-editor/media-library";
import {
  buildInsertText,
  escapeMarkdownText,
  insertCodeBlock as insertCodeBlockText,
  insertLink as insertLinkText,
  insertTextAtSelection,
  prefixSelectedLines,
  wrapTextSelection,
} from "@/components/markdown-editor/text-edit";
import { getBaseName } from "@/lib/file-meta";
import type { UploadFileItem } from "@/types/files";

type SetValue = React.Dispatch<React.SetStateAction<string>>;

const HeadingIcon = ({ level }: { level: 1 | 2 | 3 }) => (
  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "ui-sans-serif, system-ui" }}>
    H{level}
  </span>
);

interface MarkdownEditorProps {
  value: string;
  onChange: SetValue;
  height?: number | "auto";
  placeholder?: string;
  onUploadImage?: (file: File) => Promise<string | null>;
}

export default function MarkdownEditor({
  value,
  onChange,
  height = 500,
  placeholder,
  onUploadImage,
}: MarkdownEditorProps) {
  const isAutoHeight = height === "auto";
  const deferredValue = useDeferredValue(value);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const scrollSyncRafRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<UploadFileItem[]>([]);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaPageSize, setMediaPageSize] = useState(20);
  const [mediaTotalCount, setMediaTotalCount] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!isFullscreen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  const focusAndSelect = useCallback((start: number, end: number) => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(start, end);
    });
  }, []);

  const getSelection = useCallback(() => {
    const textarea = textareaRef.current;
    return {
      start: textarea?.selectionStart ?? value.length,
      end: textarea?.selectionEnd ?? value.length,
    };
  }, [value]);

  const applyTextEdit = useCallback((nextValue: string, start: number, end: number) => {
    onChange(nextValue);
    focusAndSelect(start, end);
  }, [focusAndSelect, onChange]);

  const wrapSelection = useCallback((prefix: string, suffix?: string) => {
    const result = wrapTextSelection(value, getSelection(), prefix, suffix);
    applyTextEdit(result.value, result.selection.start, result.selection.end);
  }, [applyTextEdit, getSelection, value]);

  const insertAtCursor = useCallback((text: string) => {
    const result = insertTextAtSelection(value, getSelection(), text);
    applyTextEdit(result.value, result.selection.start, result.selection.end);
  }, [applyTextEdit, getSelection, value]);

  const prefixLines = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const result = prefixSelectedLines(value, getSelection(), prefix);
    applyTextEdit(result.value, result.selection.start, result.selection.end);
  }, [applyTextEdit, getSelection, value]);

  const insertCodeBlock = useCallback(() => {
    const result = insertCodeBlockText(value, getSelection());
    applyTextEdit(result.value, result.selection.start, result.selection.end);
  }, [applyTextEdit, getSelection, value]);

  const insertLink = useCallback(() => {
    const result = insertLinkText(value, getSelection());
    applyTextEdit(result.value, result.selection.start, result.selection.end);
  }, [applyTextEdit, getSelection, value]);

  const insertHeading = useCallback((level: 1 | 2 | 3) => {
    const prefix = `${"#".repeat(level)} `;
    prefixLines(prefix);
  }, [prefixLines]);

  const insertHr = useCallback(() => {
    const result = insertTextAtSelection(value, getSelection(), "\n---\n");
    applyTextEdit(result.value, result.selection.start, result.selection.end);
  }, [applyTextEdit, getSelection, value]);

  const uploadFile = useCallback(async (file: File) => {
    if (!onUploadImage) return;
    if (fileUploading) return;

    setFileUploading(true);
    messageApi.open({ type: "loading", content: "正在上传文件...", key: "upload_file" });
    try {
      const url = await onUploadImage(file);
      if (!url) {
        return null;
      }
      messageApi.success({ content: "文件上传成功", key: "upload_file" });
      return url;
    } catch (error) {
      messageApi.error({
        content: error instanceof Error ? error.message : "上传失败",
        key: "upload_file",
      });
      return null;
    } finally {
      setFileUploading(false);
    }
  }, [fileUploading, messageApi, onUploadImage]);

  const fetchMediaFiles = useCallback(async (page = mediaPage, pageSize = mediaPageSize) => {
    setMediaLoading(true);
    try {
      const data = await fetchMediaLibraryFiles(page, pageSize);
      setMediaFiles(data.data);
      setMediaTotalCount(data.pagination.totalCount);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "获取文件列表失败");
    } finally {
      setMediaLoading(false);
    }
  }, [mediaPage, mediaPageSize, messageApi]);

  useEffect(() => {
    if (!mediaOpen) return;
    void fetchMediaFiles(mediaPage, mediaPageSize);
  }, [fetchMediaFiles, mediaOpen, mediaPage, mediaPageSize]);

  const insertRecordAndClose = useCallback((record: UploadFileItem) => {
    const url = `/uploads/${record.relativePath}`;
    const name = record.originalName || getBaseName(record.relativePath);
    const insertText = buildInsertText({ url, name, mimeType: record.mimeType, relativePath: record.relativePath });

    insertAtCursor(insertText);
    setMediaOpen(false);
  }, [insertAtCursor]);

  const handleUploadFromLibrary = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setFileUploading(true);
    messageApi.open({
      type: "loading",
      content: files.length > 1 ? `正在上传 ${files.length} 个文件...` : "正在上传文件...",
      key: "upload_file",
    });

    try {
      const data = await uploadMediaLibraryFiles(files);
      const uploadedCount = data.items.length;
      const failedCount = data.errors?.length || 0;

      if (failedCount > 0) {
        messageApi.warning({
          content: `上传完成：成功 ${uploadedCount} 个，失败 ${failedCount} 个`,
          key: "upload_file",
        });
      } else {
        messageApi.success({
          content: uploadedCount > 1 ? `上传成功，共 ${uploadedCount} 个文件` : "文件上传成功",
          key: "upload_file",
        });
      }

      if (mediaPage === 1) {
        void fetchMediaFiles(1, mediaPageSize);
      } else {
        setMediaPage(1);
      }
    } catch (error) {
      messageApi.error({
        content: error instanceof Error ? error.message : "上传失败",
        key: "upload_file",
      });
    } finally {
      setFileUploading(false);
    }
  }, [fetchMediaFiles, mediaPage, mediaPageSize, messageApi]);

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!onUploadImage) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (!file) continue;
      if (!file.type.startsWith("image/")) continue;
      event.preventDefault();
      void (async () => {
        const url = await uploadFile(file);
        if (!url) return;
        insertAtCursor(`![${escapeMarkdownText(file.name)}](${url})\n`);
      })();
      break;
    }
  }, [insertAtCursor, onUploadImage, uploadFile]);

  const syncPreviewScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;

    const inputMax = textarea.scrollHeight - textarea.clientHeight;
    const previewMax = preview.scrollHeight - preview.clientHeight;

    if (inputMax <= 0 || previewMax <= 0) {
      preview.scrollTop = 0;
      return;
    }

    const ratio = textarea.scrollTop / inputMax;
    preview.scrollTop = ratio * previewMax;
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      syncPreviewScroll();
    });
  }, [deferredValue, isFullscreen, syncPreviewScroll]);

  const handleTextareaScroll = useCallback(() => {
    if (scrollSyncRafRef.current) cancelAnimationFrame(scrollSyncRafRef.current);
    scrollSyncRafRef.current = requestAnimationFrame(() => {
      syncPreviewScroll();
    });
  }, [syncPreviewScroll]);

  const toolbarItems = useMemo(() => {
    return [
      {
        key: "h1",
        label: "H1",
        icon: <HeadingIcon level={1} />,
        onClick: () => insertHeading(1),
      },
      {
        key: "h2",
        label: "H2",
        icon: <HeadingIcon level={2} />,
        onClick: () => insertHeading(2),
      },
      {
        key: "h3",
        label: "H3",
        icon: <HeadingIcon level={3} />,
        onClick: () => insertHeading(3),
      },
      {
        key: "bold",
        label: "加粗",
        icon: <BoldOutlined />,
        onClick: () => wrapSelection("**"),
      },
      {
        key: "italic",
        label: "斜体",
        icon: <ItalicOutlined />,
        onClick: () => wrapSelection("*"),
      },
      {
        key: "strike",
        label: "删除线",
        icon: <StrikethroughOutlined />,
        onClick: () => wrapSelection("~~"),
      },
      {
        key: "code",
        label: "行内代码",
        icon: <CodeOutlined />,
        onClick: () => wrapSelection("`"),
      },
      {
        key: "code_block",
        label: "代码块",
        icon: <CodeOutlined />,
        onClick: insertCodeBlock,
      },
      {
        key: "quote",
        label: "引用",
        icon: <BlockOutlined />,
        onClick: () => prefixLines("> "),
      },
      {
        key: "ul",
        label: "无序列表",
        icon: <UnorderedListOutlined />,
        onClick: () => prefixLines("- "),
      },
      {
        key: "ol",
        label: "有序列表",
        icon: <OrderedListOutlined />,
        onClick: () => prefixLines("1. "),
      },
      {
        key: "link",
        label: "链接",
        icon: <LinkOutlined />,
        onClick: insertLink,
      },
      ...(onUploadImage
        ? [
            {
              key: "image",
              label: "媒体库",
              icon: <PictureOutlined />,
              loading: fileUploading,
              disabled: fileUploading,
              onClick: () => {
                setMediaPage(1);
                setMediaOpen(true);
              },
            },
          ]
        : []),
      {
        key: "hr",
        label: "分割线",
        icon: <MinusOutlined />,
        onClick: insertHr,
      },
    ];
  }, [
    fileUploading,
    insertCodeBlock,
    insertHeading,
    insertHr,
    insertLink,
    onUploadImage,
    prefixLines,
    wrapSelection,
  ]);

  return (
    <div
      className="memoir-markdown-editor"
      style={isAutoHeight ? { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 } : undefined}
    >
      {contextHolder}
      <MarkdownEditorMediaModal
        open={mediaOpen}
        loading={mediaLoading}
        uploading={fileUploading}
        files={mediaFiles}
        page={mediaPage}
        pageSize={mediaPageSize}
        totalCount={mediaTotalCount}
        uploadInputRef={uploadInputRef}
        onClose={() => setMediaOpen(false)}
        onRefresh={() => fetchMediaFiles(mediaPage, mediaPageSize)}
        onPageChange={(nextPage, nextPageSize) => {
          setMediaPageSize(nextPageSize);
          setMediaPage(nextPageSize !== mediaPageSize ? 1 : nextPage);
        }}
        onUploadFiles={handleUploadFromLibrary}
        onInsert={insertRecordAndClose}
      />

      <div
        className="memoir-markdown-editor-shell"
        style={{
          display: "flex",
          flexDirection: "column",
          ...(isAutoHeight ? { flex: 1, minHeight: 0 } : null),
          border: "1px solid #f0f0f0",
          borderRadius: isFullscreen ? 0 : 8,
          overflow: "hidden",
          background: "#fff",
          ...(isFullscreen
            ? {
                position: "fixed",
                inset: 0,
                zIndex: 1000,
              }
            : null),
        }}
      >
        <MarkdownEditorToolbar
          items={toolbarItems}
          isFullscreen={isFullscreen}
          showMediaHint={Boolean(onUploadImage)}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
        />

        <MarkdownEditorPane
          value={value}
          previewValue={deferredValue}
          height={height}
          isFullscreen={isFullscreen}
          isAutoHeight={isAutoHeight}
          placeholder={placeholder}
          textareaRef={textareaRef}
          previewRef={previewRef}
          onChange={onChange}
          onScroll={handleTextareaScroll}
          onPaste={handlePaste}
        />
      </div>
    </div>
  );
}
