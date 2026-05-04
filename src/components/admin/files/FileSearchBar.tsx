"use client";

import { Button, Input, Space } from "antd";
import { ClearOutlined } from "@ant-design/icons";

interface FileSearchBarProps {
  searchInput: string;
  searchQuery: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export function FileSearchBar({
  searchInput,
  searchQuery,
  onSearchInputChange,
  onSearch,
  onReset,
}: FileSearchBarProps) {
  return (
    <Space className="memoir-admin-toolbar" style={{ marginBottom: 16 }} wrap>
      <Input
        placeholder="搜索文件名/路径/MIME"
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        allowClear
        style={{ width: 320 }}
      />
      <Button type="primary" onClick={onSearch}>
        搜索
      </Button>
      <Button
        icon={<ClearOutlined />}
        onClick={onReset}
        disabled={!searchInput && !searchQuery}
      >
        重置
      </Button>
    </Space>
  );
}
