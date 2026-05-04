"use client";

import { Button, Space, Tooltip } from "antd";
import { CompressOutlined, ExpandOutlined } from "@ant-design/icons";

export interface MarkdownToolbarItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

interface MarkdownEditorToolbarProps {
  items: MarkdownToolbarItem[];
  isFullscreen: boolean;
  showMediaHint: boolean;
  onToggleFullscreen: () => void;
}

export function MarkdownEditorToolbar({
  items,
  isFullscreen,
  showMediaHint,
  onToggleFullscreen,
}: MarkdownEditorToolbarProps) {
  return (
    <div
      className="memoir-markdown-editor-toolbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 10px",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <Space className="memoir-markdown-editor-toolbar-buttons" size={4} wrap>
        {items.map((item) => (
          <Tooltip key={item.key} title={item.label}>
            <Button
              type="text"
              size="small"
              icon={item.icon}
              onClick={item.onClick}
              loading={item.loading}
              disabled={item.disabled}
              style={{ width: 32, height: 32, padding: 0 }}
            />
          </Tooltip>
        ))}
      </Space>
      <Space className="memoir-markdown-editor-toolbar-extra" size={8} align="center">
        {showMediaHint ? (
          <span style={{ color: "#999", fontSize: 12 }}>支持粘贴图片或从媒体库插入/上传</span>
        ) : null}
        <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
          <Button
            type="text"
            size="small"
            icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={onToggleFullscreen}
            style={{ width: 32, height: 32, padding: 0 }}
          />
        </Tooltip>
      </Space>
    </div>
  );
}
