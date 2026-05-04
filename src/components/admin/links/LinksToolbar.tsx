"use client";

import { Button, Input, Select, Space, Typography, Popconfirm } from "antd";
import { PlusOutlined, StopOutlined, SyncOutlined } from "@ant-design/icons";
import { LINK_CATEGORY_OPTIONS, LINK_STATUS_OPTIONS } from "@/components/admin/links/constants";

const { Title } = Typography;

interface LinksToolbarProps {
  searchInput: string;
  searchQuery: string;
  statusFilter?: string;
  categoryFilter?: string;
  checking: boolean;
  deactivating: boolean;
  activeInvalidCount: number;
  onAdd: () => void;
  onSearchInputChange: (value: string) => void;
  onStatusFilterChange: (value: string | undefined) => void;
  onCategoryFilterChange: (value: string | undefined) => void;
  onSearch: () => void;
  onReset: () => void;
  onCheckAll: () => void;
  onDeactivateInvalid: () => void;
}

export function LinksToolbar({
  searchInput,
  searchQuery,
  statusFilter,
  categoryFilter,
  checking,
  deactivating,
  activeInvalidCount,
  onAdd,
  onSearchInputChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onSearch,
  onReset,
  onCheckAll,
  onDeactivateInvalid,
}: LinksToolbarProps) {
  return (
    <>
      <div
        className="memoir-admin-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          链接管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          添加链接
        </Button>
      </div>

      <Space className="memoir-admin-toolbar" style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="筛选状态"
          value={statusFilter}
          onChange={onStatusFilterChange}
          style={{ width: 120 }}
          allowClear
          options={LINK_STATUS_OPTIONS}
        />
        <Select
          placeholder="筛选分类"
          value={categoryFilter}
          onChange={onCategoryFilterChange}
          style={{ width: 120 }}
          allowClear
          options={LINK_CATEGORY_OPTIONS}
        />
        <Input
          placeholder="搜索名称/URL"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          allowClear
          style={{ width: 320 }}
        />
        <Button type="primary" onClick={onSearch}>
          搜索
        </Button>
        <Button
          onClick={onReset}
          disabled={!searchInput && !searchQuery && !statusFilter && !categoryFilter}
        >
          重置
        </Button>
        <Button
          icon={<SyncOutlined />}
          onClick={onCheckAll}
          loading={checking}
        >
          检测全部链接
        </Button>
        {activeInvalidCount > 0 && (
          <Popconfirm
            title={`确定要关闭 ${activeInvalidCount} 个失效链接吗？`}
            description="关闭后这些链接将不会在前台友情链接页展示。"
            onConfirm={onDeactivateInvalid}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<StopOutlined />}
              loading={deactivating}
            >
              一键关闭失效链接 ({activeInvalidCount})
            </Button>
          </Popconfirm>
        )}
      </Space>
    </>
  );
}
